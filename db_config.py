import os

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

def using_postgres():
    return DATABASE_URL.startswith(("postgres://", "postgresql://"))
