# LeadFlow — Lead Management System
### Full-Stack Developer Technical Assignment | Swan Digital Solutions

LeadFlow is a high-performance, production-grade Lead Management Platform engineered for software and digital marketing agencies. It enables sales executives and management to capture leads, track conversion funnels, schedule follow-ups, execute server-side filtered queries, and visualize performance metrics through real-time dashboards.

---

## 1. System Architecture & Tech Stack

```
leadflow/
├── backend/
│   ├── alembic/                 # Alembic database migrations
│   ├── app/
│   │   ├── api/                 # Versioned REST API endpoints (/api/v1)
│   │   │   ├── deps.py          # Dependency injection (DB session, JWT auth)
│   │   │   └── v1/
│   │   │       ├── auth.py      # Registration, login, logout, me
│   │   │       ├── leads.py     # CRUD, filtering, pagination, CSV export
│   │   │       └── dashboard.py # KPI stats, charts, follow-up alerts
│   │   ├── core/                # Configuration & cryptographic security
│   │   ├── db/                  # SQLAlchemy session, base, & seed script
│   │   ├── models/              # SQLAlchemy 2.0 ORM models (User, Lead)
│   │   ├── schemas/             # Pydantic v2 validation models
│   │   ├── repositories/        # Database access layer
│   │   ├── services/            # Business logic & tenant authorization
│   │   ├── middleware/          # Security headers & error formatting
│   │   └── main.py              # FastAPI application entrypoint
│   ├── tests/                   # Pytest automated test suite
│   ├── requirements.txt         # Pinned backend dependencies
│   ├── pyproject.toml           # Ruff and Pytest configuration
│   ├── .env.example             # Documented backend environment variables
│   └── Dockerfile               # Multi-stage production container
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Accessible UI primitives (Button, Modal, Drawer, etc.)
│   │   │   ├── layout/          # Sidebar, Header, MobileDrawer, ProtectedRoute
│   │   │   ├── dashboard/       # MetricCard, Recharts charts, FollowUp alerts
│   │   │   └── leads/           # LeadTable, LeadFilters, DetailsDrawer, Modals
│   │   ├── pages/               # Dashboard, Leads, Login, Register, 404
│   │   ├── services/            # Centralized Axios client & API services
│   │   ├── hooks/               # useAuth authentication hook & state
│   │   ├── schemas/             # Zod schema validation
│   │   ├── types/               # Strict TypeScript definitions
│   │   ├── App.tsx              # Router configuration
│   │   └── main.tsx             # TanStack Query & React root mount
│   ├── package.json             # Pinned frontend dependencies
│   ├── vite.config.ts           # Vite configuration
│   ├── tailwind.config.js       # Custom design system tokens
│   ├── .env.example             # Documented frontend environment variables
│   ├── vercel.json              # Vercel SPA deployment config
│   └── Dockerfile               # Nginx multi-stage container
├── docker-compose.yml           # Unified stack (Postgres 16, backend, frontend)
├── render.yaml                  # Render cloud infrastructure blueprint
├── .gitignore                   # Workspace gitignore
└── README.md                    # Comprehensive documentation
```

### Technology Selections & Rationale
| Layer | Technology | Key Capabilities |
|---|---|---|
| **Frontend** | React 18, TypeScript (Strict), Vite, Tailwind CSS | Lightning HMR, strict type checking, responsive design. |
| **Data Viz** | Recharts | Composable SVG Donut and Area charts for conversion velocity. |
| **State & Forms** | TanStack Query v5, React Hook Form, Zod | Server-state caching, optimistic mutations, schema validation. |
| **Backend** | Python 3.12+, FastAPI, Pydantic v2 | Async execution, OpenAPI/Swagger generation, schema safety. |
| **ORM & Migrations** | SQLAlchemy 2.0, Alembic | Declarative mapped models, indexing, portable engine support. |
| **Database** | PostgreSQL 16 (Prod) / SQLite (Dev) | Native UUID, foreign key cascades, transaction isolation. |
| **Security & Auth** | Bcrypt (12 rounds), PyJWT (HS256) | Salted password hashing, stateless tamper-proof tokens. |
| **Testing & Quality**| Pytest, HTTPX, Ruff | 100% test pass rate across 21 test suites, zero lint errors. |

---

## 2. Security & Multi-Tenancy Architecture

1. **Password Hashing**: Uses `bcrypt` with work factor 12. Plaintext passwords are never saved or returned in responses.
2. **Multi-Tenancy & Authorization**:
   - Every lead query is scoped by `owner_id == current_user.id`.
   - Accessing another tenant's lead returns `404 Not Found` to prevent resource enumeration attacks.
   - Users with the `ADMIN` role can optionally toggle viewing all leads across the organization.
3. **CORS Isolation**: Explicitly allowlists configured origins (e.g. `http://localhost:5173`). Wildcard CORS (`*`) with credentials is explicitly forbidden.
4. **Injection Prevention**: All SQL queries use SQLAlchemy 2.0 parameterized statements. Sort columns are validated against an allowlist dictionary (`SORTABLE_COLUMNS`).
5. **HTTP Security Headers**: Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 3. Database Schema

```mermaid
erDiagram
    USERS ||--o{ LEADS : owns
    USERS {
        uuid id PK "UUIDv4"
        string email UK "Indexed, unique"
        string full_name "Full user name"
        string password_hash "Bcrypt hash"
        string role "USER or ADMIN"
        boolean is_active "Active flag"
        timestamptz created_at "Timestamp"
        timestamptz updated_at "Auto-updated"
    }
    LEADS {
        uuid id PK "UUIDv4"
        uuid owner_id FK "References users.id ON DELETE CASCADE"
        string name "Contact name (indexed)"
        string email "Optional email (indexed)"
        string phone_number "Optional phone (indexed)"
        string company "Company name"
        string service_interested "Service package"
        string status "New | Contacted | Qualified | Converted | Lost"
        timestamptz follow_up_date "Scheduled follow-up (indexed)"
        text notes "Contextual notes"
        timestamptz created_at "Timestamp (indexed)"
        timestamptz updated_at "Auto-updated"
    }
```

### Business Rules Enforced
- **Contact Policy**: At least one contact method (`email` or `phone_number`) must be provided. Enforced in backend Pydantic model validator and frontend Zod schema.
- **Cascading Deletion**: Deleting a user safely cascades to their leads (`ON DELETE CASCADE`), preventing orphaned records.
- **Conversion Rate Formula**:
  $$\text{Conversion Rate} = \frac{\text{Converted Leads}}{\text{Total Leads}} \times 100$$
  Returns `0.0%` safely when total leads equals 0.

---

## 4. API Endpoints (`/api/v1`)

| Method | Endpoint | Status | Description |
|---|---|---|---|
| `GET` | `/health` | 200 | Application & database connection health check |
| `POST` | `/api/v1/auth/register` | 201 | Register new user account & receive JWT tokens |
| `POST` | `/api/v1/auth/login` | 200 | Authenticate credentials & receive JWT tokens |
| `POST` | `/api/v1/auth/logout` | 200 | Logout confirmation / token invalidation |
| `GET` | `/api/v1/auth/me` | 200 | Get current authenticated user profile |
| `GET` | `/api/v1/leads` | 200 | Paginated leads with search, filter, and sort |
| `POST` | `/api/v1/leads` | 201 | Create a new lead record |
| `GET` | `/api/v1/leads/{id}` | 200 | Fetch full details for a single lead |
| `PATCH` | `/api/v1/leads/{id}` | 200 | Update lead fields or status |
| `DELETE`| `/api/v1/leads/{id}` | 204 | Delete lead permanently (enforces ownership) |
| `GET` | `/api/v1/leads/export/csv` | 200 | Download filtered leads as CSV file |
| `GET` | `/api/v1/dashboard/stats` | 200 | 6 KPI cards & conversion rate metric |
| `GET` | `/api/v1/dashboard/charts` | 200 | Status distribution donut & 14-day trend |
| `GET` | `/api/v1/dashboard/follow-ups` | 200 | Upcoming and overdue follow-up lists |

Interactive OpenAPI / Swagger documentation is available locally at:
👉 **`http://localhost:8000/docs`**

---

## 5. Local Setup Instructions

### Prerequisites
- Python 3.12 or 3.13
- Node.js v18+ (tested on Node v24)
- Git

### Option A: Standard Local Setup (Fastest)

#### 1. Backend Setup (PowerShell)
```powershell
cd leadflow/backend

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed realistic demo accounts and leads
python -m app.db.seed

# Start backend server on port 8000
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend Setup (PowerShell in a new terminal)
```powershell
cd leadflow/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

### Option B: Docker Compose Setup (PostgreSQL + Backend + Frontend)
If you have Docker Desktop installed:
```powershell
cd leadflow
docker-compose up --build
```
This spins up:
- PostgreSQL 16 on port 5432
- FastAPI backend on port 8000 (with automatic migrations and seeding)
- React frontend on port 5173

---

## 6. Pre-Configured Demo Credentials

The seed script creates two fictional accounts:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Sales Rep (User)** | `demo@swandigital.com` | `DemoPassword123!` | Manages 14 pre-seeded leads across all 5 stages |
| **Director (Admin)** | `admin@swandigital.com` | `AdminPassword123!` | Access to organization-wide lead toggle |

> **Tip**: The login page provides **One-Click Quick Fill** buttons for both accounts.

---

## 7. Verification & Automated Testing

### Backend Test Suite (Pytest)
Runs 21 comprehensive tests covering registration, duplicate conflicts, auth barriers, CRUD operations, multi-tenancy isolation, filters, pagination, and analytics formulas:
```powershell
cd leadflow/backend
.\.venv\Scripts\pytest.exe -v
```

### Backend Linter & Formatter (Ruff)
```powershell
cd leadflow/backend
.\.venv\Scripts\ruff.exe check .
```

### Frontend Type Check & Production Build
```powershell
cd leadflow/frontend
npm run build
```

---

## 8. Deployment Guide

### Backend Deployment (Render)
1. Push this repository to GitHub.
2. In Render, select **New > Blueprint** and link the repository.
3. Render reads `render.yaml` and provisions:
   - A managed PostgreSQL database.
   - The FastAPI web service running `alembic upgrade head && python -m app.db.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Copy the assigned backend URL (e.g. `https://leadflow-api.onrender.com`).

### Frontend Deployment (Vercel)
1. Import the `frontend` folder into Vercel.
2. Framework Preset: **Vite**.
3. Set environment variable:
   - `VITE_API_URL` = `https://leadflow-api.onrender.com/api/v1`
4. Deploy! The included `vercel.json` ensures client-side routing works seamlessly.

---

## 9. Interview Talking Points (Key Architectural Decisions)

1. **Why SQLAlchemy 2.0 with Alembic?**
   - Declarative mapped columns provide type safety and modern Python idioms.
   - Alembic revisions ensure safe, reproducible migrations in production without risky `create_all()` restarts.
   - Engine configuration seamlessly supports PostgreSQL for production and zero-dependency SQLite for local review.

2. **Why TanStack Query on the Frontend?**
   - Decouples server state from local UI state.
   - Automatic cache invalidation ensures that when a lead is created or edited in a modal, the leads table, metric cards, and charts update immediately without page refreshes.

3. **Multi-Tenancy Security Model**:
   - Enforced at the repository query level (`WHERE owner_id = :current_user_id`), not just in UI view hiding.
   - Returns `404 Not Found` for unauthorized IDs to prevent timing and resource-enumeration attacks.

4. **Conversion Funnel Integrity**:
   - Math is computed via SQL aggregations on authorized records rather than client-side calculations, guaranteeing consistent metrics even with thousands of records.
