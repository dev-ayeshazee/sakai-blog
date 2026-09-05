/**
 * Central typed configuration, sourced from environment variables.
 * A single DATABASE_URL is used so the same code runs against local
 * Docker Postgres or a hosted provider (e.g. Supabase) with no changes.
 */
export interface AppConfig {
  env: string;
  port: number;
  database: {
    url: string;
    ssl: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  corsOrigin: string;
  ai: {
    provider: 'heuristic' | 'anthropic';
    anthropicApiKey?: string;
    model: string;
  };
  mcp: {
    /** When set, the AI service proxies tool calls to this MCP server URL. */
    serverUrl?: string;
  };
}

const toBool = (v: string | undefined, fallback = false): boolean =>
  v === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    url:
      process.env.DATABASE_URL ??
      'postgres://blog:blog@localhost:5432/blog',
    ssl: toBool(process.env.DATABASE_SSL, false),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-only-insecure-secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  ai: {
    provider:
      (process.env.AI_PROVIDER as 'heuristic' | 'anthropic') ??
      (process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'heuristic'),
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    // Required when AI_PROVIDER is not "heuristic"; empty otherwise.
    model: process.env.AI_MODEL ?? '',
  },
  mcp: {
    serverUrl: process.env.MCP_SERVER_URL,
  },
});
