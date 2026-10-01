import asyncio
import base64
import httpx
from cryptography.fernet import Fernet
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple

from app.config.settings import settings

# Generous timeout for GitHub API calls (repo creation can be slow)
_GITHUB_TIMEOUT = httpx.Timeout(connect=10.0, read=30.0, write=30.0, pool=10.0)

# Delay after creating a new repo to let GitHub finish initializing the default branch
_POST_CREATE_DELAY_SECONDS = 2.5

# Max retries for file push (handles race conditions after repo init)
_MAX_PUSH_RETRIES = 3
_RETRY_BACKOFF_SECONDS = 2.0

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


async def get_valid_token(github_conf: dict, student_db_id: str) -> Optional[str]:
    """Return a working GitHub access token, refreshing if expired.
    
    If the token is expired and a refresh token exists, performs the refresh,
    updates the DB, and returns the new access token. Returns None only when
    no valid token can be obtained.
    """
    encrypted_access = github_conf.get("encrypted_access_token")
    if not encrypted_access:
        return None

    access_token = decrypt_token(encrypted_access)

    # Check if token has expired
    expires_at_str = github_conf.get("token_expires_at")
    is_expired = False
    if expires_at_str:
        try:
            expires_at = datetime.fromisoformat(expires_at_str)
            # Refresh 60 seconds before actual expiry to avoid edge-case failures
            is_expired = datetime.now(timezone.utc) >= expires_at.replace(tzinfo=timezone.utc if expires_at.tzinfo is None else expires_at.tzinfo)
        except (ValueError, TypeError):
            pass

    if not is_expired:
        return access_token

    # Token is expired — attempt refresh
    encrypted_refresh = github_conf.get("encrypted_refresh_token")
    if not encrypted_refresh:
        print("[GitHub] Access token expired and no refresh token available")
        return None

    refresh_token = decrypt_token(encrypted_refresh)
    print("[GitHub] Access token expired, refreshing via GitHub OAuth...")

    try:
        async with httpx.AsyncClient(timeout=_GITHUB_TIMEOUT) as client:
            resp = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                },
            )
            if resp.status_code != 200:
                print(f"[GitHub] Token refresh HTTP error: {resp.status_code}")
                return None

            data = resp.json()
            new_access = data.get("access_token")
            if not new_access:
                error = data.get("error_description") or data.get("error", "unknown")
                print(f"[GitHub] Token refresh failed: {error}")
                return None

            # Build update payload
            new_expires_in = data.get("expires_in")
            new_refresh = data.get("refresh_token")
            new_refresh_expires_in = data.get("refresh_token_expires_in")

            update_fields = {
                "github.encrypted_access_token": encrypt_token(new_access),
            }
            if new_expires_in:
                from datetime import timedelta
                update_fields["github.token_expires_at"] = (
                    datetime.now(timezone.utc) + timedelta(seconds=int(new_expires_in))
                ).isoformat()
            if new_refresh:
                update_fields["github.encrypted_refresh_token"] = encrypt_token(new_refresh)
            if new_refresh_expires_in:
                from datetime import timedelta
                update_fields["github.refresh_token_expires_at"] = (
                    datetime.now(timezone.utc) + timedelta(seconds=int(new_refresh_expires_in))
                ).isoformat()

            # Persist refreshed tokens to DB
            from app.database.mongodb import db
            from bson import ObjectId
            await db.students.update_one(
                {"_id": ObjectId(student_db_id)},
                {"$set": update_fields},
            )
            print("[GitHub] Token refreshed and saved successfully")
            return new_access

    except Exception as e:
        print(f"[GitHub] Token refresh exception: {e}")
        return None


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
        async with httpx.AsyncClient(timeout=_GITHUB_TIMEOUT) as client:
            resp = await client.get(f"{GitHubService.BASE_URL}/user", headers=GitHubService.get_headers(token))
            if resp.status_code == 200:
                return resp.json()
            return None

    @staticmethod
    async def get_repositories(token: str) -> list:
        async with httpx.AsyncClient(timeout=_GITHUB_TIMEOUT) as client:
            resp = await client.get(f"{GitHubService.BASE_URL}/user/repos?sort=updated&per_page=100", headers=GitHubService.get_headers(token))
            if resp.status_code == 200:
                return resp.json()
            return []

    @staticmethod
    async def get_repository(token: str, owner: str, repo: str) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=_GITHUB_TIMEOUT) as client:
            resp = await client.get(f"{GitHubService.BASE_URL}/repos/{owner}/{repo}", headers=GitHubService.get_headers(token))
            if resp.status_code == 200:
                return resp.json()
            return None

    @staticmethod
    async def create_repository(token: str, name: str, description: str = "", private: bool = True) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=_GITHUB_TIMEOUT) as client:
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
            # 422 means repo already exists — treat as success
            if resp.status_code == 422:
                existing = await GitHubService.get_repository(token, name.split("/")[-1] if "/" in name else "", name)
                return existing
            return None
            
    @staticmethod
    def _get_branch_url(owner: str, repo: str, branch: str) -> str:
        return f"{GitHubService.BASE_URL}/repos/{owner}/{repo}/branches/{branch}"

    @staticmethod
    async def verify_branch(token: str, owner: str, repo: str, branch: str) -> bool:
        async with httpx.AsyncClient(timeout=_GITHUB_TIMEOUT) as client:
            resp = await client.get(GitHubService._get_branch_url(owner, repo, branch), headers=GitHubService.get_headers(token))
            return resp.status_code == 200

    @staticmethod
    async def get_file_sha(token: str, owner: str, repo: str, path: str, branch: str = "main") -> Tuple[Optional[str], bool]:
        """Get the SHA of a file in a repo.
        
        Returns:
            (sha, success): sha is the file SHA if found, None if file doesn't exist.
            success is True if the API call succeeded (even if file is 404), False on error.
            This distinction prevents treating a network error as "file doesn't exist"
            which would cause a 409 conflict when pushing without the correct SHA.
        """
        try:
            async with httpx.AsyncClient(timeout=_GITHUB_TIMEOUT) as client:
                resp = await client.get(
                    f"{GitHubService.BASE_URL}/repos/{owner}/{repo}/contents/{path}?ref={branch}",
                    headers=GitHubService.get_headers(token)
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("sha"), True
                if resp.status_code == 404:
                    # File genuinely doesn't exist — safe to create without SHA
                    return None, True
                # Other error (rate limit, auth, server error)
                print(f"[GitHub] get_file_sha unexpected status {resp.status_code} for {path}")
                return None, False
        except Exception as e:
            print(f"[GitHub] get_file_sha network error: {e}")
            return None, False

    @staticmethod
    async def create_or_update_file(
        token: str, owner: str, repo: str, path: str, content: str, message: str, branch: str = "main"
    ) -> Dict[str, Any]:
        """Push a file to GitHub with retry logic for race conditions.
        
        After a new repo is created, GitHub may not have finished initializing
        the default branch. This method retries with backoff to handle 409 Conflict
        and other transient errors.
        """
        encoded_content = base64.b64encode(content.encode("utf-8")).decode("utf-8")
        last_error = None

        for attempt in range(_MAX_PUSH_RETRIES):
            try:
                sha, sha_ok = await GitHubService.get_file_sha(token, owner, repo, path, branch)

                if not sha_ok:
                    # Could not reliably determine file state — wait and retry
                    if attempt < _MAX_PUSH_RETRIES - 1:
                        await asyncio.sleep(_RETRY_BACKOFF_SECONDS * (attempt + 1))
                        continue
                    # Last attempt: try without SHA (create mode)
                    sha = None

                payload = {
                    "message": message,
                    "content": encoded_content,
                    "branch": branch
                }
                if sha:
                    payload["sha"] = sha

                async with httpx.AsyncClient(timeout=_GITHUB_TIMEOUT) as client:
                    resp = await client.put(
                        f"{GitHubService.BASE_URL}/repos/{owner}/{repo}/contents/{path}",
                        headers=GitHubService.get_headers(token),
                        json=payload
                    )

                    if resp.status_code in (200, 201):
                        return resp.json()

                    # 409 Conflict — SHA mismatch or branch not ready after repo init
                    if resp.status_code == 409 and attempt < _MAX_PUSH_RETRIES - 1:
                        print(f"[GitHub] 409 conflict on attempt {attempt + 1}, retrying after backoff...")
                        await asyncio.sleep(_RETRY_BACKOFF_SECONDS * (attempt + 1))
                        continue

                    # 422 can happen when the branch doesn't exist yet (race after auto_init)
                    if resp.status_code == 422 and attempt < _MAX_PUSH_RETRIES - 1:
                        print(f"[GitHub] 422 on attempt {attempt + 1}, branch may not be ready, retrying...")
                        await asyncio.sleep(_RETRY_BACKOFF_SECONDS * (attempt + 1))
                        continue

                    resp.raise_for_status()
                    return {}

            except httpx.HTTPStatusError:
                raise  # Re-raise HTTP errors on the last attempt
            except Exception as e:
                last_error = e
                if attempt < _MAX_PUSH_RETRIES - 1:
                    print(f"[GitHub] Push attempt {attempt + 1} failed: {e}, retrying...")
                    await asyncio.sleep(_RETRY_BACKOFF_SECONDS * (attempt + 1))
                    continue
                raise

        # Should not reach here, but just in case
        if last_error:
            raise last_error
        return {}

    @staticmethod
    async def ensure_repo_and_push(
        token: str, owner: str, repo_name: str, repo_description: str,
        path: str, content: str, message: str, branch: str = "main"
    ) -> Dict[str, Any]:
        """High-level helper: ensure repo exists, then push a file.
        
        Handles the common race condition where a newly created repo isn't
        ready for file pushes yet by adding an appropriate delay.
        """
        repo_data = await GitHubService.get_repository(token, owner, repo_name)
        if not repo_data:
            created = await GitHubService.create_repository(token, repo_name, repo_description, True)
            if created:
                # Wait for GitHub to finish initializing the repo and default branch
                await asyncio.sleep(_POST_CREATE_DELAY_SECONDS)
            else:
                print(f"[GitHub] Failed to create repository {repo_name}")

        return await GitHubService.create_or_update_file(
            token=token, owner=owner, repo=repo_name,
            path=path, content=content, message=message, branch=branch
        )

github_service = GitHubService()
