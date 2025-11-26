# Webhooks – Monorepo (API + Web)

Monorepo managed with pnpm workspaces, containing:

- api/ – API with Fastify + TypeScript, PostgreSQL database, and Drizzle ORM
- web/ – Front-end with React + Vite

## Requirements

- Node.js (LTS recommended)
- pnpm (packageManager: pnpm@10.19.0)
- Docker (for PostgreSQL via docker-compose)

## Installation

1. Install dependencies at the monorepo root:

```bash
pnpm install
```

2. Start PostgreSQL with Docker (file `api/docker-compose.yml`):

```bash
# in the api/ folder
docker compose up -d
```

3. Create the API environment file `api/.env` (minimal example):

```bash
# api/.env
DATABASE_URL=postgres://docker:docker@localhost:5432/webhooks
```

4. Generate/migrate the database schema with Drizzle:

```bash
pnpm -F api db:generate
pnpm -F api db:migrate
```

## Usage

- API (development mode):

```bash
pnpm -F api dev
```

- Web (development mode):

```bash
pnpm -F web dev
```

- Web build:

```bash
pnpm -F web build
```

- Web preview (after build):

```bash
pnpm -F web preview
```

- Other API utilities:

```bash
# Open Drizzle Studio (DB inspection)
pnpm -F api db:studio

# Formatter (Biome)
pnpm -F api format
```

## Technologies

- Fastify (API) – Fast, typed HTTP server
- TypeScript – Static typing
- Drizzle ORM + drizzle-kit – Mapping and migrations
- PostgreSQL – Relational database
- React + Vite – Modern front-end
- pnpm workspaces – Monorepo management
- Docker + docker-compose – Local DB infrastructure

## Structure

```
webhook/
├─ api/
│  ├─ docker-compose.yml
│  ├─ package.json
│  └─ src/
│     └─ db/
│        └─ schema/
│           └─ webhooks.ts
├─ web/
│  └─ package.json
├─ package.json
├─ pnpm-workspace.yaml
└─ pnpm-lock.yaml
```

## Notes

- Adjust `DATABASE_URL` as needed (user/password/host/port/database).
- The project uses pnpm’s `-F` (filter) flag to target commands per package.
