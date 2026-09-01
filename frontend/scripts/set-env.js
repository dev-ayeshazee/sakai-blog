/**
 * Writes src/environments/environment.prod.ts from build-time env vars so the
 * static bundle can point at whatever API the host assigned.
 *
 *   API_URL   full base URL incl. /api   (takes precedence)
 *   API_HOST  bare host -> https://<host>/api   (e.g. Render service binding)
 *
 * Falls back to "/api" (same-origin reverse proxy) when neither is set.
 */
const fs = require('fs');
const path = require('path');

const apiUrl =
  process.env.API_URL ||
  (process.env.API_HOST ? `https://${process.env.API_HOST}/api` : '/api');

const file = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
const contents = `export const environment = {
  production: true,
  apiUrl: ${JSON.stringify(apiUrl)},
};
`;

fs.writeFileSync(file, contents);
console.log(`[set-env] environment.prod.ts -> apiUrl = ${apiUrl}`);
