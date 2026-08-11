import os

# Read from environment when available, with safe local defaults.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./shpe.db")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
