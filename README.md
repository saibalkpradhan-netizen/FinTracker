# FinTrack — Personal Finance Tracker

Full-stack finance tracker: React (Vite) frontend, Node/Express backend, PostgreSQL database.

## Current status

**Phase 1 (scaffold) — done:**
- Complete project structure (`frontend/`, `backend/`, `database/`)
- Full PostgreSQL schema (`database/schema.sql`) + seed data (`database/seed.sql`)
- Authentication end-to-end: register, login, JWT, bcrypt hashing, protected routes,
  get/update profile, change password, rate limiting on auth endpoints
- React app shell: routing, sidebar nav, protected-route guard, Axios client with
  JWT auto-attach + auto-logout on 401, working Login/Register pages

**Phase 2 (in progress) — done so far:**
- **Categories**: full CRUD API (system defaults + per-user custom categories,
  defaults are immutable/undeletable) and a working Categories page (add/delete
  custom categories, browse defaults)
- **Transactions**: full CRUD API with filtering (type, category, date range,
  description search) and pagination, category-type validation server-side, and
  a shared `TransactionsManager` React component that powers the **Transactions**,
  **Income**, and **Expenses** pages (add/edit/delete, filters, paginated table)

Still scaffolded, not yet implemented:
- Budgets, Savings, Goals, Dashboard, Reports, Alerts — backend routes/controllers
  exist and are wired into `app.js` behind `protect` middleware, but currently
  return `501 Not Implemented`. Matching frontend pages are placeholders.

## Project structure

```text
personal-finance-tracker/
├── backend/       Express API (src/config, middleware, controllers, routes, utils)
├── frontend/      React (Vite) app (src/api, context, routes, components, pages)
├── database/      schema.sql, seed.sql
└── README.md
```

## Local setup

### 1. Database
```bash
createdb fintrack
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET
npm install
npm run migrate             # applies database/schema.sql
npm run seed                # loads default categories + demo user
```
Demo login after seeding: `demo@fintrack.app` / `Demo@1234`

### 2. Backend
```bash
cd backend
npm run dev                 # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # http://localhost:5173
```

## Deploying to Render

1. **Database**: Render dashboard → New → PostgreSQL. Copy the generated
   **Internal Database URL**.
2. **Backend (Web Service)**: New → Web Service, point at `backend/`.
   - Build command: `npm install`
   - Start command: `npm start`
   - Env vars: `DATABASE_URL` (from step 1), `JWT_SECRET`, `JWT_EXPIRES_IN`,
     `NODE_ENV=production`, `CLIENT_URL` (frontend's Render URL)
   - After first deploy, run `npm run migrate` and `npm run seed` once via the
     Render Shell (or a one-off Job).
3. **Frontend (Static Site)**: New → Static Site, point at `frontend/`.
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Env var: `VITE_API_URL=https://<your-backend>.onrender.com/api`

## API surface (implemented + scaffolded)

All routes except `/api/auth/register` and `/api/auth/login` require
`Authorization: Bearer <token>`.

| Base path            | Status |
|-----------------------|--------|
| `POST /api/auth/register`, `/login` | ✅ implemented |
| `GET/PUT /api/auth/profile`, `PUT /api/auth/password` | ✅ implemented |
| `/api/categories` (list/create/update/delete) | ✅ implemented |
| `/api/transactions` (list w/ filters+pagination, get, create, update, delete) | ✅ implemented |
| `/api/budgets`, `/api/savings`, `/api/goals`, `/api/dashboard`, `/api/reports`, `/api/alerts` | 🚧 scaffolded (501) |

## Security notes
- Passwords hashed with bcrypt (12 salt rounds)
- JWT-based auth; every data query is scoped to the authenticated `user_id`
- `helmet`, `cors` (locked to `CLIENT_URL`), and rate limiting on auth routes
- No secrets ever sent to the frontend — only `VITE_API_URL` is public

## Next steps
Implement business logic for budgets, savings, goals, the dashboard aggregation
endpoint, PDF/CSV report export, and the alerts engine — then build out their
corresponding React pages and charts. Budgets/Savings/Dashboard should read from
the now-working `transactions` table.
