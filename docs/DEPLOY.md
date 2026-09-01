# Deployment

The repo ships a **Render Blueprint** (`render.yaml`) that stands up the whole
stack. Other platforms are documented below.

---

## Render (recommended — one blueprint, free tier)

`render.yaml` defines three resources and wires the URLs between them:

| Resource        | What it is                                    |
| --------------- | --------------------------------------------- |
| `blog-db`       | Managed PostgreSQL (free)                     |
| `blog-api`      | NestJS API from `backend/Dockerfile` (Docker web service) |
| `blog-frontend` | Angular static site built from `frontend/`    |

### Steps

1. Push the repo to GitHub (done).
2. Create a free account at <https://dashboard.render.com> — sign in with
   GitHub. No credit card for the free tier.
3. <https://dashboard.render.com/blueprints> → **New Blueprint Instance**.
4. **Connect** the `dev-ayeshazee/sakai-blog` repo → Render reads `render.yaml`
   and lists `blog-db`, `blog-api`, `blog-frontend`.
5. It prompts for one value — **`CORS_ORIGIN`** on `blog-api`. Leave it blank
   for now (or type `*`), click **Apply**.
6. Wait ~5–8 min for the first build. You now have:
   - API  → `https://blog-api-XXXX.onrender.com/api`
   - Site → `https://blog-frontend-XXXX.onrender.com`
7. **Lock down CORS:** Dashboard → `blog-api` → **Environment** → set
   `CORS_ORIGIN` = your `https://blog-frontend-XXXX.onrender.com` → **Save**
   (auto-redeploys, ~1 min).
8. Open the site URL. Log in with `demo@blog.test` / `password123`.

### How the wiring works

- `blog-api` reads `DATABASE_URL` from the managed DB, runs migrations on boot
  (`RUN_MIGRATIONS=true`) and seeds demo data **once** (`RUN_SEED=true`, skipped
  if the DB already has users). `JWT_SECRET` is auto-generated.
- `blog-frontend`'s build runs `node scripts/set-env.js`, which reads the
  `API_HOST` service binding and writes `environment.prod.ts` with
  `apiUrl = https://<api-host>/api` before `ng build`.
- `CORS_ORIGIN` is the one value you set by hand (step 7) — kept out of the
  blueprint so the two services don't form a circular dependency. `main.ts`
  also prepends `https://` to a bare host if you paste one.

### Free-tier caveats

- The web service **sleeps after 15 min idle**; the next request cold-starts in
  ~50 s. Fine for a demo — mention it to reviewers.
- Render's **free Postgres is deleted ~30 days** after creation. For something
  longer-lived, use a free Neon database instead (next section).

### Keep it alive: free Neon Postgres instead of Render's

Neon's free tier does not expire. Swap the database only:

1. <https://neon.tech> → sign up (GitHub) → **New Project** (pick a region near
   your Render region, e.g. US West).
2. Copy the **connection string** (`postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).
3. In `render.yaml`, delete the whole `databases:` block **and** the
   `DATABASE_URL` `fromDatabase` entry under `blog-api`. Commit + push.
4. Render dashboard → `blog-api` → **Environment**:
   - `DATABASE_URL` = the Neon string
   - `DATABASE_SSL` = `true`
   - Save → redeploy. Migrations + seed run against Neon on boot.

(Same recipe works with a free **Supabase** database — use its
*Session pooler* connection string.)

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
