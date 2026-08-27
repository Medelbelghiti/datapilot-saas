# DataPilot AI

**Turn Your Data Into Decisions.**

An AI-powered data analysis SaaS that allows users to upload CSV or Excel files and automatically receive data quality analysis, statistics, correlations, outliers, charts, AI insights, and professional PDF reports.

## Features

- **Automatic Data Cleaning** — Detect missing values, duplicates, and inconsistencies
- **Statistical Analysis** — Mean, median, std dev, percentiles, and more
- **Correlation Analysis** — Pearson correlations with strength classification
- **Outlier Detection** — IQR-based detection with impact analysis
- **Automatic Charts** — Histograms, box plots, scatter plots, heatmaps
- **AI Insights** — Executive summaries and recommendations via GPT
- **PDF Reports** — Professional consulting-style reports
- **Subscription Billing** — Polar integration with Free/Pro/Business tiers
- **Google OAuth** — Sign in with Google one-click
- **Dark Mode** — Full dark mode support with system preference detection
- **Admin Dashboard** — User management, analytics, and error monitoring
- **Rate Limiting** — API protection against abuse
- **Analytics Events** — Track key product events
- **Email Notifications** — Analysis completion emails
- **Toasts & Confirm Dialogs** — Professional UI feedback
- **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python, FastAPI, Pandas, NumPy, SciPy, Plotly |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Payments | Polar |
| AI | OpenAI GPT-4o-mini |
| PDF | ReportLab |
| Automation | n8n (optional) |

## Architecture

```
/
├── frontend/          # Next.js application
│   ├── src/app/       # Pages and routes
│   ├── components/    # UI components
│   ├── lib/           # Utilities, API client, Supabase
│   └── types/         # TypeScript types
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/       # API endpoints
│   │   ├── core/      # Auth, config
│   │   ├── services/  # Analysis engine
│   │   └── webhooks/  # Polar webhooks
│   └── migrations/    # SQL migrations
├── n8n/               # n8n workflow docs
└── docs/              # Documentation
```

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- Supabase project
- Polar account
- OpenAI API key

### 1. Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local
# Edit .env.local with your values
npm run dev
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your values
uvicorn app.main:app --reload --port 8000
```

### 3. Database

Run the SQL migration in Supabase SQL Editor:

```bash
# Paste contents of backend/migrations/001_initial.sql
# into Supabase Dashboard → SQL Editor → Run
```

Create storage bucket:
- Go to Supabase Dashboard → Storage
- Create bucket: `datasets` (private)

### 4. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Get URL and keys from Project Settings → API
3. Get service role key from Project Settings → API → Service Role
4. Run the migration SQL
5. Create the `datasets` storage bucket (private)
6. Enable Email auth in Authentication → Providers

### 5. Polar Setup

1. Create account at [polar.sh](https://polar.sh)
2. Create products:
   - Pro Monthly ($15/mo)
   - Pro Yearly ($150/yr)
   - Business Monthly ($39/mo)
3. Get product IDs from product URLs
4. Create a webhook endpoint pointing to `https://your-backend.com/api/webhooks/polar`
5. Copy webhook secret

#### Testing with Polar Sandbox

Polar provides an isolated [sandbox environment](https://sandbox.polar.sh/start) for testing payments without real money.

1. Create a **separate account/org** on the sandbox environment
2. Create the same 3 products in sandbox (they have different IDs than production)
3. Create sandbox access token at sandbox.polar.sh settings
4. Point your backend to sandbox:
   ```
   POLAR_ACCESS_TOKEN=sk_sandbox_...
   POLAR_ORG_ID=sandbox-org-id
   POLAR_PRO_MONTHLY_PRODUCT_ID=<sandbox-id>
   POLAR_PRO_YEARLY_PRODUCT_ID=<sandbox-id>
   POLAR_BUSINESS_PRODUCT_ID=<sandbox-id>
   POLAR_WEBHOOK_SECRET=<sandbox-webhook-secret>
   POLAR_ENV=sandbox
   ```
5. Configure the sandbox webhook to point at your local backend.
6. Test checkout with Stripe test card: `4242 4242 4242 4242` (any future expiry, any CVC)
7. Make `POLAR_ENV=production` only when going live.

> **Note:** Sandbox access tokens and webhook secrets are separate from production. The backend SDK switches base URL automatically via `POLAR_ENV`.

### 6. OpenAI Setup

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env`

### 7. n8n Setup (Optional)

1. Install n8n: `npm install -g n8n` or use Docker
2. Import workflows from `n8n/` directory
3. Configure credentials in n8n
4. Activate workflows

## Environment Variables

See `.env.example` for the complete list.

## Running

```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && uvicorn app.main:app --reload --port 8000
```

## API Documentation

FastAPI auto-generates docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Deployment

The app has two deployable units plus managed services:

| Unit | Host | Root |
|------|------|------|
| `frontend/` | Vercel | directory `frontend` |
| `backend/` | Render | directory `backend` |
| PostgreSQL + Auth + Storage | Supabase (hosted) | — |
| Payments | Polar | dashboard |
| AI | OpenAI | dashboard |

### Prereqs (once)

- Push the repo to GitHub with **no secrets committed**. `.env`, `.env.local`
  and `.venv` are git-ignored / docker-ignored.
- Create the production Polar products and the production webhook secret (they
  differ from sandbox).

---

### 1. Backend (Render)

1. In [Render](https://render.com) → **New → Web Service** → connect the GitHub repo.
2. **Root directory**: `backend`
3. **Environment**: `Python`
4. **Build command**: `pip install -r requirements.txt`
5. **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add the env vars below and deploy.

#### Render env vars

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service-role key |
| `SUPABASE_JWT_SECRET` | your JWT secret (ES256 `kid` from project JWKS) |
| `OPENAI_API_KEY` | your OpenAI key |
| `POLAR_ACCESS_TOKEN` | **production** Polar token |
| `POLAR_ORGANIZATION_ID` | production Polar org id |
| `POLAR_PRO_MONTHLY_PRODUCT_ID` | production Pro Monthly id |
| `POLAR_PRO_YEARLY_PRODUCT_ID` | production Pro Yearly id |
| `POLAR_BUSINESS_PRODUCT_ID` | production Business id |
| `POLAR_WEBHOOK_SECRET` | **production** webhook secret |
| `POLAR_ENV` | `production` |
| `FRONTEND_URL` | `https://your-app.vercel.app` (your Vercel domain) |
| `NEXT_PUBLIC_ADMIN_EMAILS` | comma-separated admin emails |
| `DATABASE_URL` | optional self-hosted Postgres |

> Render exposes `PORT` automatically. The health check is
> `GET /api/health`.

#### Render webhook endpoint

After the backend deploys, create the production webhook in the Polar
dashboard pointing to `https://YOUR-BACKEND.onrender.com/api/webhooks/polar`
with the production webhook secret, and set that secret as
`POLAR_WEBHOOK_SECRET`.

---

### 2. Frontend (Vercel)

1. In [Vercel](https://vercel.com) → **Add New → Project** → import the repo.
2. **Root Directory**: `frontend`
3. **Framework**: Next.js is auto-detected.
4. Add the env vars below and deploy.

#### Vercel env vars

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
| `NEXT_PUBLIC_BACKEND_URL` | `https://YOUR-BACKEND.onrender.com` |
| `NEXT_PUBLIC_PRO_MONTHLY_ID` | production Pro Monthly id |
| `NEXT_PUBLIC_PRO_YEARLY_ID` | production Pro Yearly id |
| `NEXT_PUBLIC_BUSINESS_ID` | production Business id |
| `NEXT_PUBLIC_ADMIN_EMAILS` | comma-separated admin emails |

> The frontend is built with `output: "standalone"` (see `next.config.js`) and
> is compatible with either Vercel's native builder or the `Dockerfile`.

---

### 3. Database / Supabase

Run these SQL migrations in Supabase → SQL Editor (in order):

1. `backend/migrations/001_initial.sql`
2. `backend/migrations/002_billing.sql`
3. `backend/migrations/003_fix_grants.sql` (set up RLS grants + the
   `handle_new_user` trigger that creates a `free` subscription on signup)

Create the private storage bucket `datasets` in Supabase → Storage.

---

### 4. Going live checklist

- [ ] `POLAR_ENV=production` on Render; sandbox token/secret replaced by production.
- [ ] Production webhook points to the Render `/api/webhooks/polar` URL.
- [ ] One and only one webhook endpoint configured in Polar (a stray duplicate
      that points at a wrong path causes failed deliveries).
- [ ] `FRONTEND_URL` on Render = the exact Vercel domain (CORS).
- [ ] Production product IDs on both Render and Vercel match the Polar products.
- [ ] Run a real checkout with a real card and confirm the webhook flips the plan.

### Alternative: Docker

A `docker-compose.yml` plus `backend/Dockerfile` and `frontend/Dockerfile`
are included if you prefer self-hosting. The frontend image is a
Standalone Next.js build; the backend image runs uvicorn on port 8000.

## Testing

```bash
# Frontend
cd frontend && npm run lint

# Backend
cd backend && python -m pytest tests/
```

## Production Checklist

- [ ] No hardcoded credentials
- [ ] Environment variables set
- [ ] Supabase RLS enabled
- [ ] Polar webhook configured
- [ ] CORS configured for production URLs
- [ ] Storage bucket is private
- [ ] Rate limiting enabled
- [ ] Error monitoring configured

## License

MIT
