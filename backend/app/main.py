from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .database import engine, Base
from . import models  # ensure all models are imported before create_all
from .routers import auth, users, companies, bank_accounts, balance_snapshots, exchange_rates, fund_notes, dashboard, reports
from .core.security import get_password_hash

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(companies.router, prefix="/api/v1")
app.include_router(bank_accounts.router, prefix="/api/v1")
app.include_router(balance_snapshots.router, prefix="/api/v1")
app.include_router(exchange_rates.router, prefix="/api/v1")
app.include_router(fund_notes.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    _seed_admin()


def _seed_admin():
    """Create default super_admin if no users exist."""
    from .database import SessionLocal
    from .models.user import User
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            admin = User(
                username="admin",
                email="admin@fundmonitor.local",
                full_name="System Admin",
                role="super_admin",
                status="active",
                password_hash=get_password_hash("Admin@1234"),
            )
            db.add(admin)
            db.commit()
            print("✓ Default admin created: admin / Admin@1234  — change password immediately!")
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}
