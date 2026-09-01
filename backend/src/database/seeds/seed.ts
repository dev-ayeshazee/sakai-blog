import 'reflect-metadata';
import { DataSource, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

const DEMO_USERS = [
  { email: 'demo@blog.test', name: 'Demo Author', password: 'password123' },
  { email: 'jane@blog.test', name: 'Jane Rivera', password: 'password123' },
  { email: 'omar@blog.test', name: 'Omar Haddad', password: 'password123' },
  { email: 'lena@blog.test', name: 'Lena Fischer', password: 'password123' },
];

const TOPICS: [string, string][] = [
  ['Getting started with Angular 17 standalone components',
    'Angular 17 makes standalone components the default. This post walks through bootstrapping an app without NgModules, wiring the router, and lazy-loading feature areas. We cover the mental model shift, the new control-flow syntax, and how signals fit in. By the end you will have a project structure that scales.'],
  ['Designing a REST API with NestJS and TypeORM',
    'NestJS gives you a batteries-included structure for building APIs. Here we model users and posts with TypeORM entities, add DTO validation with class-validator, and protect routes with a Passport JWT strategy. We also discuss migrations versus synchronize and why you should never use synchronize in production.'],
  ['AG Grid pagination patterns for server-driven data',
    'Client-side pagination breaks down once your dataset grows. This article shows how to drive AG Grid from a paginated API: mapping page and pageSize to query params, keeping the grid in sync with the URL, and showing a skeleton while rows load. Includes a reusable Angular wrapper component.'],
  ['JWT auth done right in a single-page app',
    'Storing tokens, refreshing them, and attaching them to requests are three separate problems. We build an HTTP interceptor that adds the Authorization header, a route guard that redirects anonymous users to login, and a small auth service that survives page reloads by rehydrating from storage.'],
  ['PrimeNG forms: reactive validation without the boilerplate',
    'PrimeNG components pair well with Angular reactive forms. This post builds a create-post form with inline validation messages, a disabled submit until valid, and an optimistic UI update that rolls back on failure. We keep the template declarative and push logic into a typed form model.'],
  ['What the Model Context Protocol actually gives you',
    'MCP standardises how applications expose tools and context to language models. Instead of bespoke function-calling glue per integration, you run an MCP server that advertises tools over JSON-RPC. We mock one here for excerpt generation and content moderation, then swap in a real server with one env var.'],
  ['Dockerizing a Node API and Postgres for local dev',
    'A good docker-compose file removes "works on my machine" from code review. We define a Postgres service with a healthcheck, an API service that waits for it, and a single DATABASE_URL that also points at a hosted database in production. Volumes keep your data between restarts.'],
  ['Optimistic UI: show the result before the server confirms',
    'Users perceive optimistic updates as instant. The trick is a clean rollback path. We add the new post to the list immediately with a temporary id, reconcile with the server response, and restore the previous state plus a toast if the request fails. Works nicely with Angular signals.'],
  ['Route guards and lazy feature areas in Angular',
    'Guards are just functions now. A functional canActivate guard reads the auth service and returns a UrlTree to redirect. Combined with loadComponent, you get feature areas that are both code-split and access-controlled. We show how to test guards in isolation without the router.'],
  ['Content moderation as middleware, not an afterthought',
    'Moderation belongs in the write path. Before a post is persisted we run the body through a moderation tool and reject flagged content with a 422 and a reason list. The same pipeline generates the excerpt and tags, so one AI call does triple duty and the controller stays thin.'],
  ['Migrations you can trust: hand-written versus generated',
    'Generated migrations drift from intent. We hand-write the initial schema so reviewers can read it: extensions first, then tables, then indexes and foreign keys. Down migrations mirror up in reverse. The seed script runs against the same DataSource so CI can rebuild the database from zero.'],
  ['Structuring an Angular app for a take-home review',
    'Reviewers skim. A predictable folder layout, core and shared modules, typed models next to services, and a single environment file with the API base URL all buy goodwill. This post is a checklist for repo hygiene: README first, .env.example committed, no node_modules, meaningful commits.'],
  ['Server-side sorting with the AG Grid infinite row model',
    'The infinite row model hands your datasource a sortModel and a filterModel on every block request. This post maps those into query parameters, keeps a stable id tiebreaker so rows never duplicate across pages, and purges the cache when the sort changes so the grid restarts from page one.'],
  ['Debouncing a search box without losing a keystroke',
    'A naive keyup handler fires a request per character and races responses out of order. We pipe the input through an RxJS Subject with debounceTime, switchMap the HTTP call so stale responses are cancelled, and reset pagination when the term changes. The grid stays responsive at any typing speed.'],
  ['Passport JWT strategy: validate once, trust everywhere',
    'The strategy verifies the signature and expiry, then its validate() hook loads the user and becomes req.user. Downstream controllers read a typed AuthUser via a param decorator and never touch the token again. We also cover why the user lookup matters: a deleted account should not keep a valid session.'],
  ['bcrypt cost factors and the login latency budget',
    'A higher bcrypt cost is more resistant to offline cracking but adds milliseconds to every login. We benchmark cost 10 through 14 on typical container hardware, land on a number that keeps p95 login under 250ms, and note that the hash stores its own cost so you can raise it later without a migration.'],
  ['Designing a paginated list response your clients will like',
    'Return the rows and a meta block with page, pageSize, total and totalPages. Clients compute "showing 6-10 of 42" without a second call, and an empty page still carries totalPages: 1. We contrast this with cursor pagination and explain when each is the right choice.'],
  ['Environment config as a single typed object',
    'Scattered process.env reads are impossible to audit. We funnel every variable through one configuration() factory that returns a typed AppConfig, coerces booleans and numbers, and supplies safe development defaults. Tests import the same factory, so misconfiguration fails fast and loudly.'],
  ['CORS for a split frontend and API deployment',
    'When the SPA and the API live on different origins, the browser demands an explicit allowlist. We drive it from a CORS_ORIGIN variable, accept bare hostnames from platform service bindings by prepending https, and keep credentials support on for the Authorization header.'],
  ['Writing hand-crafted TypeORM migrations',
    'Generated migrations encode incidental diffs. A hand-written one reads like a schema description: enable extensions, create tables, then indexes and foreign keys, with the down method mirroring up in reverse. Reviewers can approve it without running it.'],
  ['citext versus lower() for case-insensitive email',
    'Storing email in a citext column makes uniqueness and lookups case-insensitive without a functional index or LOWER() sprinkled through queries. We enable the extension in the first migration and discuss the trade-off against a plain varchar plus normalisation at the service layer.'],
  ['A provider interface that survives swapping vendors',
    'Depend on an AiProvider interface, not a concrete client. A zero-dependency heuristic implementation is the default and the offline fallback; a vendor-backed one is selected by config and degrades to the heuristic on any error. The rest of the app never knows which is live.'],
  ['Mocking an MCP server for local development',
    'You do not need a running MCP server to build against one. We implement initialize, tools/list and tools/call over JSON-RPC in process, back the tools with the heuristic provider, and expose the same surface over HTTP so an external client can point at it with one variable.'],
  ['Excerpt generation: sentence-aware truncation',
    'Cutting a string at 200 characters mangles the last word. Our heuristic prefers the nearest sentence boundary past 60 percent of the limit, falls back to the last space, and only then adds an ellipsis. The result reads like a summary rather than a broken sentence.'],
  ['Keyword tag suggestion with a stop-word list',
    'Rank the words in a post body by frequency, drop a stop-word list, and take the top five. It is not machine learning but it is fast, explainable, and good enough to make the tag column useful. We show how the same call is swappable for a model when you want better tags.'],
  ['Route-level code splitting in Angular 17',
    'loadChildren on a route turns a feature module into its own chunk. We measure the initial bundle before and after splitting the create-post and auth areas, and note the trade-off: a small navigation delay on first visit for a faster first paint.'],
  ['Signals for view state, RxJS for streams',
    'Signals shine for synchronous view state like the current user or a loading flag. RxJS still owns anything that is a stream over time: debounced input, HTTP with cancellation, websocket messages. This post draws the line with concrete examples from the blog UI.'],
  ['A functional CanActivateFn you can unit test',
    'The guard is just a function that injects AuthService and Router and returns true or a UrlTree. No TestBed, no router harness: call it with a fake state and assert on the redirect. We show the three-line test and the guard it covers.'],
  ['Global ValidationPipe: whitelist and forbidNonWhitelisted',
    'With whitelist on, unknown properties are stripped; with forbidNonWhitelisted, they 400. Together they stop a client from setting authorId in the body of POST /posts. We walk through the pipe options and the DTOs that make them meaningful.'],
  ['Health checks that actually tell you something',
    'A 200 from GET /health should mean the process is up and can serve. We keep ours dependency-light for load balancers, and discuss when to add a deeper readiness check that pings the database before a deploy is marked live.'],
  ['Seeding demo data without wiping real rows',
    'A seed that truncates on every boot is a foot-gun in production. Ours takes an onlyIfEmpty flag: it checks the users table and returns early if anything is there. First deploy gets sample content, restarts leave user data alone.'],
  ['The take-home repo hygiene checklist',
    'README at the top, .env.example committed and real .env ignored, no node_modules, no dist, meaningful commit messages, a green build. None of it is hard; all of it is noticed. This is the list I run through before sharing a repo.'],
  ['Interceptors: one place for the Authorization header',
    'Setting the bearer token on every call by hand is how you miss one. An HttpInterceptor clones the request with the header, and on a 401 it clears the session and routes to login. Every current and future service gets it for free.'],
  ['Why the API maps entities to plain response objects',
    'Return the entity and you leak whatever is on it, including passwordHash. A small toListItem mapper picks the fields the client needs and shapes the author relation. It is boilerplate worth writing.'],
  ['Pagination math: totalPages and the empty page',
    'totalPages is ceil(total / pageSize), floored at one so an empty list still renders a single page. Page N past the end returns an empty data array with honest meta. Small rules that keep the UI from dividing by zero.'],
  ['Testing a service that builds a query',
    'You do not need a database to prove the where clauses are right. Mock the query builder with chainable jest.fn().mockReturnThis(), call the method, and assert on the andWhere and orderBy calls. Fast, deterministic, and it catches the filter you forgot to wire.'],
  ['Docker healthcheck and depends_on: condition',
    'depends_on alone only waits for the container to start, not for Postgres to accept connections. Add a pg_isready healthcheck and depends_on: condition: service_healthy so the API never boots against a database that is not ready.'],
  ['A single DATABASE_URL for every environment',
    'Local Docker, a teammate\'s Postgres, Supabase, a managed instance on your host of choice: one connection string covers them all. Parse it once, toggle SSL with a second flag, and stop maintaining five sets of host and port variables.'],
  ['Cold starts on free hosting tiers',
    'A service that sleeps after 15 minutes idle wakes in roughly a minute. For a demo that is fine if you say so up front. We add a note to the README and a health endpoint that is cheap to hit to warm things.'],
  ['Lazy chunk budgets and when to raise them',
    'The Angular budget warns when a bundle crosses a threshold. AG Grid plus PrimeNG plus the sakai theme is legitimately large, so we raise the warning ceiling deliberately rather than shipping with a permanent yellow build.'],
  ['From prompt chain to write-path middleware',
    'The same moderate then summarise then tag sequence that we would run by hand becomes AiService.enrichPost(), executed on every POST /posts before the row is saved. One pass does moderation, excerpt and tags, and the controller stays a two-liner.'],
  ['Stable sort tiebreakers and disappearing rows',
    'Sort by publishedAt alone and two posts sharing a timestamp can swap between page loads, so a row seems to vanish. Add ORDER BY publishedAt, id and the order is total and stable. It is a one-line fix for a confusing bug.'],
];

export interface SeedResult {
  seeded: boolean;
  message: string;
}

/**
 * Populate the database with a demo author + sample posts.
 *
 * @param ds            an initialised DataSource
 * @param onlyIfEmpty   skip when the users table already has rows (used on
 *                      deploy so restarts never wipe real data)
 */
export async function seed(
  ds: DataSource,
  { onlyIfEmpty = false }: { onlyIfEmpty?: boolean } = {},
): Promise<SeedResult> {
  const userRepo = ds.getRepository(User);
  const postRepo = ds.getRepository(Post);

  if (onlyIfEmpty && (await userRepo.count()) > 0) {
    return { seeded: false, message: 'Database already has users — skipping seed.' };
  }

  await postRepo.query('TRUNCATE TABLE "posts" CASCADE');
  await userRepo.delete({ email: In(DEMO_USERS.map((u) => u.email)) });

  const users: User[] = [];
  for (const u of DEMO_USERS) {
    users.push(
      await userRepo.save(
        userRepo.create({
          email: u.email,
          name: u.name,
          passwordHash: await bcrypt.hash(u.password, 10),
        }),
      ),
    );
  }

  let i = 0;
  for (const [title, body] of TOPICS) {
    const author = users[i % users.length];
    await postRepo.save(
      postRepo.create({
        title,
        body: `${body}\n\n${body}`,
        excerpt: body.replace(/\s+/g, ' ').slice(0, 200),
        tags: title
          .toLowerCase()
          .replace(/[^a-z\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 4)
          .slice(0, 4),
        authorId: author.id,
        publishedAt: new Date(Date.now() - i * 86_400_000),
      }),
    );
    i++;
  }

  return {
    seeded: true,
    message:
      `Seeded ${users.length} users and ${TOPICS.length} posts. ` +
      `Login with: ${DEMO_USERS[0].email} / ${DEMO_USERS[0].password}`,
  };
}

/** CLI entrypoint: `npm run seed`. */
if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dataSource: DataSource = require('../../config/typeorm.config').default;
  dataSource
    .initialize()
    .then((ds) => seed(ds))
    .then((res) => {
      console.log(res.message);
      return dataSource.destroy();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
