# Deployment

The repo ships a **Render Blueprint** (`render.yaml`) that stands up the whole
stack. Other platforms are documented below.

---

## Render + Neon (recommended — free, nothing expires)

`render.yaml` creates two services; the database is a free external Neon
instance so it never gets deleted.

| Resource        | Where            | Notes                                        |
| --------------- | ---------------- | -------------------------------------------- |
| Postgres        | Neon (free)      | permanent; autosuspends, wakes on connect    |
| `blog-api`      | Render web (free)| Docker from `backend/Dockerfile`; sleeps 15 min idle, ~40 s wake |
| `blog-frontend` | Render static (free) | always on                                |

### Steps

**1 — Neon database**

1. <https://neon.tech> → **Sign up** with GitHub → **New Project**
   (region: US East or US West).
2. Copy the **connection string** from the dashboard — looks like
   `postgresql://user:pass@ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
   (use the **pooled** one if offered).

**2 — Render blueprint**

3. <https://dashboard.render.com> → sign in with GitHub (no card for free tier).
4. **Blueprints** → **New Blueprint Instance** → connect
   `dev-ayeshazee/sakai-blog`.
5. Render reads `render.yaml` and prompts for two values:
   - `DATABASE_URL` → paste the Neon string
   - `CORS_ORIGIN` → leave blank (set in step 7)
6. **Apply.** First build ≈ 6–10 min. You get:
   - API  → `https://blog-api-XXXX.onrender.com/api`
   - Site → `https://blog-frontend-XXXX.onrender.com`

**3 — CORS**

7. Copy the `blog-frontend` URL → Render → `blog-api` → **Environment** →
   set `CORS_ORIGIN` to it → **Save Changes** (redeploys ~1 min).
8. Open the site, log in with `demo@blog.test` / `password123`.

### How the wiring works

- On boot `blog-api` runs migrations (`RUN_MIGRATIONS=true`) and seeds demo
  data once (`RUN_SEED=true`, skipped once the DB has users). `JWT_SECRET` is
  auto-generated.
- `blog-frontend`'s build runs `node scripts/set-env.js`, which reads the
  `API_HOST` service binding and writes `environment.prod.ts` with
  `apiUrl = https://<api-host>/api` before `ng build`.
- `CORS_ORIGIN` is set by hand (step 7) so the two services don't form a
  circular dependency at blueprint-apply time. `main.ts` prepends `https://`
  to a bare host.

### Keeping the API warm (optional)

The free API sleeps after 15 min idle. For a portfolio link, add a free
uptime ping so the first visit is instant:

- <https://cron-job.org> (free) → new cron job → `GET
  https://blog-api-XXXX.onrender.com/api/health` every 10 minutes.

Or just note on your portfolio that the first load may take ~40 s.

---

## Railway

1. `railway init` in the repo root.
2. Add a **PostgreSQL** plugin.
3. Create a service from `backend/` (Railway detects the Dockerfile). Set:
   `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`, `DATABASE_SSL=true`,
   `JWT_SECRET=<random>`, `RUN_MIGRATIONS=true`, `RUN_SEED=true`,
   `PORT=3001`, `CORS_ORIGIN=<frontend url>`.
4. Deploy the frontend as a second service or on Vercel/Netlify (below).

---

## Fly.io (API)

```bash
cd backend
fly launch --no-deploy            # generates fly.toml from the Dockerfile
fly postgres create               # then: fly postgres attach <db>
fly secrets set JWT_SECRET=$(openssl rand -hex 32) \
  DATABASE_SSL=true RUN_MIGRATIONS=true RUN_SEED=true \
  CORS_ORIGIN=https://<your-frontend>
fly deploy
```

---

## Frontend on Vercel / Netlify (with the API hosted elsewhere)

Both build the same way. Set an env var `API_URL` (full, incl. `/api`) or
`API_HOST` (bare host), then:

| Setting          | Value                                        |
| ---------------- | -------------------------------------------- |
| Root directory   | `frontend`                                   |
| Build command    | `npm ci && node scripts/set-env.js && npm run build` |
| Output directory | `dist/sakai-ng`                              |
| SPA rewrite      | `/*` → `/index.html`                         |

Then set the API's `CORS_ORIGIN` to the deployed frontend URL.

---

## Docker (self-hosted)

`docker compose up --build` already runs the full stack locally
(API `:3001`, DB `:5544`). For a server, put a reverse proxy in front that
serves the built `frontend/dist/sakai-ng` and proxies `/api` to the `api`
container — then `apiUrl` stays `/api` and CORS is a non-issue.
