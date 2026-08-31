# Sakai Blog

A small blog application: public post list + detail, JWT auth, and an
authenticated "write a post" flow. Built on the **sakai-ng** Angular 17 starter
with a **NestJS** API.

| Part        | Stack                                                            |
| ----------- | --------------------------------------------------------------- |
| `frontend/` | Angular 17, sakai-ng (PrimeNG 17), AG Grid 31, RxJS + signals  |
| `backend/`  | NestJS 10, TypeORM 0.3, PostgreSQL 16, Passport-JWT, bcrypt    |
| infra       | `docker-compose.yml` — Postgres + API                          |

---

## Quick start

### Option A — Docker (API + DB)

```bash
docker compose up --build
# API  -> http://localhost:3001/api   (migrations run on boot)
# DB   -> localhost:5544
docker compose exec api npm run seed   # optional: demo user + 12 posts
```

Then run the frontend (it is not containerised):

```bash
cd frontend
npm install
npm start            # http://localhost:4200
```

### Option B — all local

Prerequisites: **Node 20** (Angular 17 does not support Node 24 — use
`nvm use 20`), a **PostgreSQL** database (local install, Docker, or Supabase).

```bash
# 1. Database — pick one:
docker compose up -d db                       # Dockerised Postgres on :5544
#   ...or point backend/.env at any other Postgres / Supabase instance.

# 2. Backend
cd backend
cp .env.example .env                          # adjust DATABASE_URL if needed
npm install
npm run migration:run
npm run seed                                  # demo data
npm run start:dev                             # http://localhost:3001/api

# 3. Frontend
cd ../frontend
npm install
npm start                                     # http://localhost:4200
```

### Demo credentials (after `npm run seed`)

```
email:    demo@blog.test
password: password123
```

---

## Using Supabase instead of local Postgres

The backend takes a single `DATABASE_URL`, so Supabase is a config change only:

1. Supabase dashboard → **Project Settings → Database → Connection string → URI**.
2. In `backend/.env`:

   ```env
   DATABASE_URL=postgres://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
   DATABASE_SSL=true
   ```

3. `npm run migration:run && npm run seed`.

The migration enables the `uuid-ossp` and `citext` extensions, both available on
Supabase. No code changes required. (This repo was developed against a local
Dockerised Postgres; the Supabase path is wired but credentials are not bundled.)

---

## API

Base URL `http://localhost:3001/api`. All bodies are JSON.

| Method + path        | Auth | Body                          | Notes                                   |
| -------------------- | ---- | ----------------------------- | --------------------------------------- |
| `POST /auth/register`| —    | `{ email, name, password }`   | Returns `{ accessToken, user }`         |
| `POST /auth/login`   | —    | `{ email, password }`         | Returns `{ accessToken, user }`         |
| `GET  /auth/me`      | JWT  | —                             | Current user (used by the navbar)       |
| `GET  /posts?page=1&pageSize=5` | — | —                  | `{ data: [...], meta: {...} }`          |
| `GET  /posts/:id`    | —    | —                             | Full post incl. `body`                  |
| `POST /posts`        | JWT  | `{ title, body }`             | Author from JWT; excerpt + tags auto    |
| `GET  /mcp/tools`    | —    | —                             | Mock MCP tool catalogue                 |
| `POST /mcp/rpc`      | —    | JSON-RPC 2.0                  | `initialize` / `tools/list` / `tools/call` |

Validation is enforced by `class-validator` DTOs + a global `ValidationPipe`
(`whitelist`, `forbidNonWhitelisted`). Invalid input → `400` with a message
array. Duplicate email → `409`. Bad/missing JWT → `401`. Flagged content → `422`.

---

## Auth flow

```
Register / Login  ──>  API verifies (bcrypt) ──>  signs JWT { sub, email, name }
        │                                              │
        │  { accessToken, user }                       │  HS256, JWT_EXPIRES_IN (7d)
        ▼                                              ▼
Frontend AuthService                          passport-jwt validates on each
  • token  -> localStorage 'blog.token'       protected request, loads the user,
  • user   -> signal + localStorage           sets req.user
        │
        ▼
AuthInterceptor adds  Authorization: Bearer <token>  to every API call.
On 401 it clears the session and redirects to /auth/login.

Route protection:
  • Backend  — @UseGuards(JwtAuthGuard) on POST /posts
  • Frontend — authGuard (functional CanActivateFn) on /create,
               redirects to /auth/login?returnUrl=/create
```

The API never returns the `passwordHash`: services map entities to plain
response objects.

---

## Frontend structure

```
src/app/
  core/
    models/            # PostListItem, PostDetail, AuthUser, ...
    services/          # AuthService (signals), PostService (HTTP)
    guards/            # authGuard
    interceptors/      # AuthInterceptor (Bearer + 401 handling)
  features/            # lazy-loaded route modules
    home/              # AG Grid, infinite row model, 5 rows/page
    post-detail/       # public full-post view
    create-post/       # PrimeNG reactive form + optimistic UI
    auth/              # login + register (sakai styling)
  layout/              # sakai shell; topbar has the profile dropdown
```

- **Home** uses AG Grid's **infinite row model** — each 5-row block is a
  `GET /posts?page=n&pageSize=5` call, so pagination is genuinely server-driven.
  Columns: Title, Excerpt (≤200 chars), Author, Published date. Row click →
  detail.
- **Create post** renders an optimistic preview the instant you hit Publish and
  rolls it back (with a toast) if the request fails.
- **Navbar** (`layout/app.topbar.component`) shows an avatar + name + dropdown
  (New post / Logout) when authenticated, a Login link otherwise. State is an
  `AuthService` signal, so it updates without a reload.

---

## AI / MCP integration


- **AI middleware** (`backend/src/ai`): `AiService.enrichPost()` runs on the
  write path for every new post — content moderation, excerpt generation, tag
  suggestion — before the row is persisted.
- **Provider abstraction**: `AiProvider` interface with a zero-dependency
  `HeuristicAiProvider` (default, offline) and an `AnthropicAiProvider`
  (`AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`) that falls back to the
  heuristic on any error.
- **Mock MCP server** (`backend/src/mcp`): a self-contained MCP server speaking
  JSON-RPC 2.0 (`initialize`, `tools/list`, `tools/call`) with three tools —
  `generate_excerpt`, `suggest_tags`, `moderate_content`.
- **MCP client hook**: `McpClientService` is the single seam the app uses to
  call "an MCP server". In-process by default; set `MCP_SERVER_URL` to route
  the identical calls to a real server over HTTP.

```bash
curl -s -X POST http://localhost:3001/api/mcp/rpc \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## Bonus features implemented

- ✅ **MCP server integration** — mock MCP server + client interface with a
  one-env-var switch to a real server; used as AI middleware in the write path.
- ✅ **Optimistic UI** on post creation, with rollback.
- ✅ **Route guards** — backend `JwtAuthGuard`, frontend functional `authGuard`.
- ✅ **Form validation** — `class-validator` DTOs (API) + Angular reactive
  validators with inline messages (UI).
- ✅ **Docker setup** — `docker-compose.yml` for API + Postgres, `backend/Dockerfile`.
- ✅ **Content moderation** as write-path middleware (`422` on flagged content).

---

## Environment variables (`backend/.env`)

| Var                 | Default                                   | Purpose                                  |
| ------------------- | ----------------------------------------- | ---------------------------------------- |
| `PORT`              | `3001`                                    | API port                                 |
| `DATABASE_URL`      | `postgres://blog:blog@localhost:5544/blog`| Postgres connection (local or hosted)    |
| `DATABASE_SSL`      | `false`                                   | `true` for Supabase / managed PG         |
| `JWT_SECRET`        | dev placeholder                           | HS256 signing key — **set in prod**      |
| `JWT_EXPIRES_IN`    | `7d`                                      | Token lifetime                           |
| `CORS_ORIGIN`       | `http://localhost:4200`                   | Allowed browser origin(s), comma-sep     |
| `AI_PROVIDER`       | `heuristic`                               | `heuristic` \| `anthropic`               |
| `ANTHROPIC_API_KEY` | —                                         | Enables the Anthropic excerpt path       |
| `MCP_SERVER_URL`    | —                                         | Point AI middleware at a real MCP server |
| `RUN_MIGRATIONS`    | `false`                                   | Run pending migrations on boot           |

---

## Notes & trade-offs

- **Ports**: the dev machine already had Postgres on `5432` and another
  container on `5433`, so Docker Postgres is mapped to **`5544`** and the API to
  **`3001`**. Change in `docker-compose.yml` / `.env` if those clash for you.
- Seeded excerpts/tags use the heuristic provider — no API key needed to demo.
- The API image is single-stage (keeps dev deps so `npm run seed` works via
  `docker compose exec`); a production build would multi-stage prune.
