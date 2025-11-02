import hashlib
from passlib.context import CryptContext

# Initialize password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _pre_hash(password: str) -> str:
    """
    Hash the password with SHA-256 first to ensure it's <= 72 bytes.
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def hash_password(password: str) -> str:
    """
    Securely hash the password: SHA-256 -> bcrypt.
    """
    prehashed = _pre_hash(password)
    return pwd_context.hash(prehashed)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password: SHA-256 -> bcrypt comparison.
    """
    prehashed = _pre_hash(plain_password)
    return pwd_context.verify(prehashed, hashed_password)
