# Big Basket E-Commerce Backend (FastAPI + PostgreSQL)

Production-ready backend API foundation for the **Big Basket** quick-commerce platform.

---

## 🛠️ Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12+)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [SQLAlchemy 2.x](https://www.sqlalchemy.org/)
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/)
- **Security**: Bcrypt password hashing & PyJWT token management
- **Testing**: [pytest](https://docs.pytest.org/) & HTTPX TestClient

---

## 📁 Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py               # Dependency injection & Auth guards
│   │   └── routes/               # Modular REST API endpoints
│   │       ├── auth.py           # Register, login, /me
│   │       ├── users.py          # Profile, password management
│   │       ├── categories.py     # Master categories & category tree
│   │       ├── products.py       # Catalog, filtering, search, pagination
│   │       ├── cart.py           # User shopping cart management
│   │       ├── wishlist.py       # User wishlist
│   │       ├── addresses.py      # Saved delivery addresses
│   │       ├── orders.py         # Order placement & tracking
│   │       └── health.py         # Liveness & database checks
│   ├── core/
│   │   ├── config.py             # Pydantic Settings (.env configuration)
│   │   ├── database.py           # Engine, connection pooling & sessions
│   │   └── security.py           # Bcrypt hashing & JWT signing
│   ├── models/                   # SQLAlchemy 2.x database models
│   ├── schemas/                  # Pydantic request/response schemas
│   ├── services/
│   │   └── seed_data.py          # 21 Categories & 60+ Products Seeder
│   └── main.py                   # FastAPI Application Entrypoint
├── alembic/                      # Database Schema Migration Versioning
├── tests/                        # Pytest Automated Test Suite
├── .env.example                  # Template configuration file
├── alembic.ini                   # Alembic configuration
└── requirements.txt              # Python dependencies
```

---

## 🚀 Quick Start Guide

### 1. Setup Python Virtual Environment

```bash
cd backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Linux / macOS:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your PostgreSQL connection string in `.env`:
```ini
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/bigbasket_local
SECRET_KEY=your-production-secret-key-here
```

### 4. Run Database Migrations

Apply Alembic migrations to create all database tables:
```bash
alembic upgrade head
```

### 5. Seed Catalog & Default Demo Account

Populate 21 master categories and 60+ products:
```bash
python -m app.services.seed_data
```

**Default Demo Credentials**:
- **Email**: `abhishek.sharma@example.com`
- **Phone**: `9876543210`
- **Password**: `password123`

---

## 🏃 Running the Server

Start the development server with live reload:
```bash
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Documentation (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 🧪 Running Automated Tests

Run the full pytest suite:
```bash
pytest
```

---

## 🌐 API Response Envelope Standard

All responses follow a consistent envelope structure:

### Successful Response
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email/phone or password.",
    "details": null
  }
}
```
