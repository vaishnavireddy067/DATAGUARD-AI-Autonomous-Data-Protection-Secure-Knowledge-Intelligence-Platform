import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from sqlalchemy import text
from app.database import engine, AsyncSessionLocal
from app.config import settings

async def check_db():
    print(f"DATABASE_URL in config: {settings.DATABASE_URL}")
    is_postgres = "postgres" in settings.DATABASE_URL
    is_sqlite = "sqlite" in settings.DATABASE_URL
    print(f"Is PostgreSQL active? {is_postgres}")
    print(f"Is SQLite active? {is_sqlite}")

    async with AsyncSessionLocal() as session:
        # Check users count
        res = await session.execute(text("SELECT count(*) FROM users"))
        user_count = res.scalar()
        print(f"Total Users in DB: {user_count}")

        # Check documents count
        res = await session.execute(text("SELECT count(*) FROM documents"))
        doc_count = res.scalar()
        print(f"Total Documents in DB: {doc_count}")

        # Check sensitive findings count
        res = await session.execute(text("SELECT count(*) FROM sensitive_findings"))
        finding_count = res.scalar()
        print(f"Total Sensitive Findings in DB: {finding_count}")

        # Check protection actions count
        res = await session.execute(text("SELECT count(*) FROM protection_actions"))
        action_count = res.scalar()
        print(f"Total Protection Actions in DB: {action_count}")

        # Check audit logs count
        res = await session.execute(text("SELECT count(*) FROM audit_logs"))
        audit_count = res.scalar()
        print(f"Total Audit Logs in DB: {audit_count}")

    if is_sqlite:
        db_path = settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
        if os.path.exists(db_path):
            print(f"SQLite file exists on disk: {db_path}, Size: {os.path.getsize(db_path)} bytes")

asyncio.run(check_db())
