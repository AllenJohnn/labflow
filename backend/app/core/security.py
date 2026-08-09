import hashlib
import os
import hmac


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2 with SHA-256 and a random salt."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        100000
    )
    return f"{salt.hex()}${key.hex()}"



def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a plain password against a stored salt$hash string."""
    try:
        salt_hex, key_hex = hashed_password.split('$')
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)
        
        computed_key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt,
            100000
        )
        return hmac.compare_digest(computed_key, expected_key)
    except Exception:
        return False
