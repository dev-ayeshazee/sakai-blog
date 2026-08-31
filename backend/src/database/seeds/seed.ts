import 'reflect-metadata';
import { In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import dataSource from '../../config/typeorm.config';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

/** Idempotent-ish seed: wipes posts + demo users, then reinserts. */
const DEMO_USERS = [
  { email: 'demo@blog.test', name: 'Demo Author', password: 'password123' },
  { email: 'jane@blog.test', name: 'Jane Rivera', password: 'password123' },
];

const TOPICS = [
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
];

async function run() {
  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);
  const postRepo = dataSource.getRepository(Post);

  await postRepo.query('TRUNCATE TABLE "posts" CASCADE');
  await userRepo.delete({ email: In(DEMO_USERS.map((u) => u.email)) });

  const users: User[] = [];
  for (const u of DEMO_USERS) {
    const user = await userRepo.save(
      userRepo.create({
        email: u.email,
        name: u.name,
        passwordHash: await bcrypt.hash(u.password, 10),
      }),
    );
    users.push(user);
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

  await dataSource.destroy();

  console.log(
    `Seeded ${users.length} users and ${TOPICS.length} posts.\n` +
      `Login with: ${DEMO_USERS[0].email} / ${DEMO_USERS[0].password}`,
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
