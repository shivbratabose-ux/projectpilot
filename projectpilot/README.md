# ProjectPilot
**Command Every Project. From One Place.**

Hans Infomatic Pvt. Ltd. — Internal Project & Collaboration Management Platform.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS      |
| Backend    | Node.js, Express                  |
| Database   | PostgreSQL 15                     |
| Auth       | JWT (7-day expiry)                |
| Hosting    | Render.com (Singapore region)     |

---

## Modules Included (v1.0)

- **Dashboard** — Portfolio health, my tasks, activity feed
- **Portfolio** — All projects with filters, detail view, tasks, milestones
- **Partners** — Partner registry, agreements, action log
- **GTM Projects** — Go-to-market tracker with revenue targets
- **Marketing** — Campaign management
- **Issues & SLA** — Issue tracker with P1–P4 severity, SLA health bar
- **Joint Ventures** — JV structure, equity visualisation
- **Audit Log** — Full system event log
- **Settings** — Platform configuration

---

## Seed Data (Hans Infomatic Context)

The database seeds with:
- 6 users (Shivbrata, Tanbir, Parvinder, Padma, Charles, Demo)
- 5 partners (MPC Marketing, Colossal Avia, AIASL, Delhi Airport, RAM)
- 7 projects (WiseHandling Colossal, ACSA Valet, Counter Services, DRC HMIS, WiseTrax, iCAFFE, Hans-MPC GTM)
- Hans-MPC Reseller Agreement (signed 23 Feb 2026)
- Milestones, JV equity structure, GTM records

**Default login:**
- Email: `shivbrata@hansinfomatic.com`
- Password: `Admin@123`

---

## Deploy to GitHub + Render

### Step 1 — Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `projectpilot`
3. Set to **Private**
4. Click **Create repository**

### Step 2 — Push Code

```bash
cd projectpilot
git init
git add .
git commit -m "feat: initial ProjectPilot build — Hans Infomatic"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/projectpilot.git
git push -u origin main
```

### Step 3 — Deploy on Render

**Option A — Blueprint (recommended, deploys everything at once):**

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub account if not already connected
4. Select the `projectpilot` repository
5. Render will auto-detect `render.yaml`
6. Click **Apply Blueprint**
7. Wait ~5 minutes for:
   - PostgreSQL database to provision
   - Backend to build, migrate DB, and seed data
   - Frontend to build and deploy

**Option B — Manual (if Blueprint doesn't work):**

**Database first:**
1. Render → New → PostgreSQL
2. Name: `projectpilot-db`, Region: Singapore, Plan: Free
3. Copy the **Internal Database URL**

**Backend:**
1. Render → New → Web Service
2. Connect repo, Root Directory: `backend`
3. Build Command: `npm install && npm run db:migrate && npm run db:seed`
4. Start Command: `npm start`
5. Add environment variables:
   - `DATABASE_URL` → paste Internal Database URL
   - `JWT_SECRET` → click "Generate" for a random value
   - `NODE_ENV` → `production`
   - `CORS_ORIGINS` → set after frontend deploys

**Frontend:**
1. Render → New → Static Site
2. Connect repo, Root Directory: `frontend`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Add environment variable:
   - `VITE_API_URL` → Backend's Render URL (e.g. `https://projectpilot-api.onrender.com`)

### Step 4 — Set CORS Origin

After both services are live:
1. Go to Backend service → Environment
2. Set `CORS_ORIGINS` = your frontend URL (e.g. `https://projectpilot-ui.onrender.com`)
3. Redeploy backend

### Step 5 — Verify

Visit your frontend URL → Login with `shivbrata@hansinfomatic.com` / `Admin@123`

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 15 running locally

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/projectpilot.git
cd projectpilot

# 2. Backend
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL to your local PostgreSQL
npm install
npm run db:migrate
npm run db:seed
npm run dev       # runs on port 5000

# 3. Frontend (new terminal)
cd ../frontend
cp .env.example .env
# .env already set to http://localhost:5000
npm install
npm run dev       # runs on port 5173
```

Open: http://localhost:5173

---

## API Reference

| Method | Endpoint                  | Description               |
|--------|---------------------------|---------------------------|
| POST   | /api/auth/login           | Login, returns JWT        |
| GET    | /api/auth/me              | Current user              |
| GET    | /api/projects             | List projects             |
| POST   | /api/projects             | Create project            |
| GET    | /api/projects/:id         | Project detail            |
| PATCH  | /api/projects/:id         | Update project            |
| GET    | /api/partners             | List partners             |
| POST   | /api/partners             | Add partner               |
| GET    | /api/issues               | List issues               |
| POST   | /api/issues               | Log issue                 |
| GET    | /api/issues/stats/sla     | SLA statistics            |
| GET    | /api/gtm                  | GTM projects              |
| GET    | /api/jv                   | Joint ventures            |
| GET    | /api/campaigns            | Marketing campaigns       |
| GET    | /api/dashboard            | Dashboard data            |
| GET    | /api/audit                | Audit log                 |

All routes (except /api/auth/login and /health) require `Authorization: Bearer <token>` header.

---

## Project Structure

```
projectpilot/
├── render.yaml                 ← Render Blueprint config
├── .gitignore
├── README.md
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js           ← Express entry point
│       ├── db/
│       │   ├── pool.js         ← PostgreSQL connection
│       │   ├── schema.sql      ← Full DB schema
│       │   ├── migrate.js      ← Migration runner
│       │   └── seed.js         ← Hans Infomatic seed data
│       ├── middleware/
│       │   └── auth.js         ← JWT middleware
│       └── routes/
│           ├── auth.js
│           ├── projects.js
│           ├── partners.js
│           └── misc.js         ← Issues, GTM, JV, Campaigns, Dashboard, Audit
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx             ← Router config
        ├── index.css           ← Tailwind + Hans brand styles
        ├── lib/
        │   └── api.js          ← Axios client
        ├── stores/
        │   └── authStore.js    ← Zustand auth state
        ├── components/
        │   ├── Sidebar.jsx     ← Navigation
        │   ├── Layout.jsx      ← Protected route wrapper
        │   └── ui.jsx          ← Shared components
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Portfolio.jsx
            ├── ProjectDetail.jsx
            ├── Partners.jsx
            └── OtherPages.jsx  ← Issues, GTM, JV, Marketing, Audit, Settings
```

---

## Brand Standards

| Token  | Value   | Usage                  |
|--------|---------|------------------------|
| Navy   | #1B3A6B | Primary text, headers  |
| Teal   | #0E7F8C | CTAs, active states    |
| Orange | #E8523A | Danger, P1 severity    |
| Green  | #12B76A | Success, completed     |
| Amber  | #F79009 | Warning, P3            |
| Gray   | #F2F4F7 | Backgrounds, surfaces  |

---

## Support

Technology Lead: Tanbir Ansari — tanbir@hansinfomatic.com
Business Lead: Shivbrata Bose — shivbrata@hansinfomatic.com
