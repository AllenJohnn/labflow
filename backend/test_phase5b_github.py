import pytest
from cryptography.fernet import Fernet
import os
import jwt
from datetime import datetime, timedelta, timezone

# Ensure the app can import properly by adding dummy key if not present
if not os.getenv("GITHUB_ENCRYPTION_KEY"):
    os.environ["GITHUB_ENCRYPTION_KEY"] = Fernet.generate_key().decode()

from app.services.github_service import encrypt_token, decrypt_token
from app.config.settings import settings

# Override the autouse fixture to prevent pytest-asyncio errors in isolated tests
@pytest.fixture(autouse=True)
def app_lifespan():
    pass

def test_token_encryption_decryption():
    """Test that github token encryption/decryption works correctly and is symmetric."""
    original_token = "gho_test_1234567890abcdef"
    encrypted = encrypt_token(original_token)
    
    assert encrypted != original_token
    assert type(encrypted) is str
    
    decrypted = decrypt_token(encrypted)
    assert decrypted == original_token

def test_oauth_state_generation_and_validation():
    """Test generating a JWT state for CSRF and validating it."""
    import secrets
    
    user_id = "test_user_id_123"
    nonce = secrets.token_urlsafe(16)
    
    # Generate
    state_payload = {
        "sub": user_id,
        "nonce": nonce,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15)
    }
    state = jwt.encode(state_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    # Validate
    decoded = jwt.decode(state, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert decoded["sub"] == user_id
    assert decoded["nonce"] == nonce

def test_github_service_instantiation():
    """Test that github_service class is properly constructed without errors."""
    from app.services.github_service import GitHubService
    assert GitHubService.API_VERSION == "2022-11-28"
    assert GitHubService.BASE_URL == "https://api.github.com"
    headers = GitHubService.get_headers("dummy")
    assert headers["Authorization"] == "Bearer dummy"

@pytest.mark.asyncio
async def test_auth_dependency_strips_encrypted_token():
    """Test that get_current_user strips out sensitive github tokens."""
    from app.dependencies.auth import get_current_user
    from fastapi.security import HTTPAuthorizationCredentials
    from app.services.jwt_service import create_access_token
    
    # We will mock the database call to return a user with github token
    from app.dependencies import auth
    
    async def mock_get_student_by_id(user_id):
        return {
            "_id": "dummy",
            "role": "student",
            "github": {
                "connected": True,
                "encrypted_access_token": "secret_here",
                "repository": "test"
            }
        }
        
    original = auth.get_student_by_id
    auth.get_student_by_id = mock_get_student_by_id
    
    try:
        # Create a valid token
        token = create_access_token("dummy", role="student")
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        
        user = await get_current_user(creds)
        assert "github" in user
        assert user["github"].get("repository") == "test"
        assert "encrypted_access_token" not in user["github"]
    finally:
        auth.get_student_by_id = original

