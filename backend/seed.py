"""Create or promote the first admin account.

Usage (with the venv active or via ./setup.sh's python):
    .venv/bin/python seed.py admin@purdue.edu password "Admin Name"
"""
import sys

from app.database import SessionLocal, Base, engine
from app.models import User, Role
from app.auth import hash_password

Base.metadata.create_all(bind=engine)


def main():
    if len(sys.argv) < 4:
        print('Usage: python seed.py <email> <password> "<full name>"')
        sys.exit(1)

    email, password, full_name = sys.argv[1], sys.argv[2], sys.argv[3]
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            existing.role = Role.admin
            db.commit()
            print(f"Promoted {email} to admin.")
        else:
            db.add(User(
                email=email,
                hashed_password=hash_password(password),
                full_name=full_name,
                role=Role.admin,
            ))
            db.commit()
            print(f"Created admin: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
