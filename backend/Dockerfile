# Single-stage image: keeps dev dependencies so `npm run seed` and the
# TypeORM CLI work via `docker compose exec api ...`. Fine for a take-home;
# a production build would use a multi-stage prune.
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["node", "dist/main"]
