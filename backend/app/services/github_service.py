import base64
import httpx
from cryptography.fernet import Fernet
from typing import Optional, Dict, Any

from app.config.settings import settings

_fallback_key = None
def get_fernet():
    global _fallback_key
    key = settings.GITHUB_ENCRYPTION_KEY
    if not key:
        if not _fallback_key:
            _fallback_key = Fernet.generate_key()
        key = _fallback_key
    return Fernet(key)

def encrypt_token(token: str) -> str:
    f = get_fernet()
    return f.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    f = get_fernet()
    return f.decrypt(encrypted_token.encode()).decode()

class GitHubService:
    BASE_URL = "https://api.github.com"
    API_VERSION = "2022-11-28"

    @staticmethod
    def get_headers(token: str) -> Dict[str, str]:
        return {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": GitHubService.API_VERSION,
            "User-Agent": "LabFlow-MCA"
        }

    @staticmethod
    async def get_current_user(token: str) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{GitHubService.BASE_URL}/user", headers=GitHubService.get_headers(token))
            if resp.status_code == 200:
                return resp.json()
            return None

    @staticmethod
    async def get_repositories(token: str) -> list:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{GitHubService.BASE_URL}/user/repos?sort=updated&per_page=100", headers=GitHubService.get_headers(token))
            if resp.status_code == 200:
                return resp.json()
            return []

    @staticmethod
    async def get_repository(token: str, owner: str, repo: str) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{GitHubService.BASE_URL}/repos/{owner}/{repo}", headers=GitHubService.get_headers(token))
            if resp.status_code == 200:
                return resp.json()
            return None

    @staticmethod
    async def create_repository(token: str, name: str, description: str = "", private: bool = True) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            payload = {
                "name": name,
                "description": description,
                "private": private,
                "auto_init": True
            }
            resp = await client.post(
                f"{GitHubService.BASE_URL}/user/repos", 
                headers=GitHubService.get_headers(token),
                json=payload
            )
            if resp.status_code == 201:
                return resp.json()
            return None
            
    @staticmethod
    def _get_branch_url(owner: str, repo: str, branch: str) -> str:
        return f"{GitHubService.BASE_URL}/repos/{owner}/{repo}/branches/{branch}"

    @staticmethod
    async def verify_branch(token: str, owner: str, repo: str, branch: str) -> bool:
        async with httpx.AsyncClient() as client:
            resp = await client.get(GitHubService._get_branch_url(owner, repo, branch), headers=GitHubService.get_headers(token))
            return resp.status_code == 200

    @staticmethod
    async def get_file_sha(token: str, owner: str, repo: str, path: str, branch: str = "main") -> Optional[str]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{GitHubService.BASE_URL}/repos/{owner}/{repo}/contents/{path}?ref={branch}",
                headers=GitHubService.get_headers(token)
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("sha")
            return None

    @staticmethod
    async def create_or_update_file(
        token: str, owner: str, repo: str, path: str, content: str, message: str, branch: str = "main"
    ) -> Dict[str, Any]:
        sha = await GitHubService.get_file_sha(token, owner, repo, path, branch)
        encoded_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")

        payload = {
            "message": message,
            "content": encoded_content,
            "branch": branch
        }
        if sha:
            payload["sha"] = sha

        async with httpx.AsyncClient() as client:
            resp = await client.put(
                f"{GitHubService.BASE_URL}/repos/{owner}/{repo}/contents/{path}",
                headers=GitHubService.get_headers(token),
                json=payload
            )
            if resp.status_code in (200, 201):
                return resp.json()
            # If rate limit or other error, raise it to be caught by the caller
            resp.raise_for_status()
            return {}

github_service = GitHubService()
