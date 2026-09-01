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

1. Push the repo to GitHub.
2. Go to <https://dashboard.render.com/blueprints> → **New Blueprint Instance**.
3. Select the repo → **Apply**.
4. Wait for all three to go green (~5–8 min on the first deploy).

You get:

- API  → `https://blog-api-XXXX.onrender.com/api`
- Site → `https://blog-frontend-XXXX.onrender.com`

### How the wiring works

- `blog-api` reads `DATABASE_URL` from the managed DB, runs migrations on boot
  (`RUN_MIGRATIONS=true`) and seeds demo data **once** (`RUN_SEED=true`, skipped
  if the DB already has users). `JWT_SECRET` is auto-generated.
- `blog-frontend`'s build runs `node scripts/set-env.js`, which reads the
  `API_HOST` service binding and writes `environment.prod.ts` with
  `apiUrl = https://<api-host>/api` before `ng build`.
- `blog-api`'s `CORS_ORIGIN` is bound to the frontend's host; `main.ts`
  prepends `https://` to bare hosts.

### If Render reports a dependency cycle

The API↔frontend host bindings are mutual. If Render refuses to apply:

1. Delete the `CORS_ORIGIN` env block from `render.yaml`, re-apply.
2. Once `blog-frontend` has a URL, add `CORS_ORIGIN` =
   `https://blog-frontend-XXXX.onrender.com` in the `blog-api` dashboard
   → **Environment** → save (triggers a redeploy).

### Free-tier caveats

- The web service sleeps after 15 min idle; first request after that takes
  ~50 s (cold start).
- The free Postgres instance is removed after 90 days.

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
