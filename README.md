# Time Management System

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

-----

## Getting Started

### Option A — Local Development (recommended for active development)

Create a `.env` file in the project root using `.example.env` as a template:

Install all dependencies:
```bash
  npm install
```

Start the local Postgres database:
```bash
  docker compose up -d postgres
```

Run the Prisma migration:
```bash
  npm run migrate:dev
```

Seed the database:
```bash
  npm run seed
```

Run the development server:
```bash
  npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option B — Full Docker Stack (no local Node.js required)

See the [Running the Full Stack in Docker](#running-the-full-stack-in-docker) section below.

----

## Database Migrations

#### Creating a Migration
When you make changes to your Prisma schema (prisma/schema.prisma), you'll need to create a migration to apply these changes to your database:
```bash
  npx prisma migrate dev --name your_migration_name
```
This command:
- Creates a new migration based on changes to the schema
- Applies the migration to your database
- Regenerates the Prisma client

#### Applying Migrations in Production
For production environments, use:
```bash
  npx prisma migrate deploy
```

----

## Viewing Database
#### Access pgAdmin at http://localhost:5050
- Log in with the credentials: admin@example.com / pgadmin
- Add a new server connection with these details:
- Name: Any name you want
- Host: postgres (the service name in the Docker network)
- Port: 5432
- Username: postgres
- Password: postgres
- Database: timemanagement

----

## Testing — Unit & Component (Vitest)

Unit and component tests use [Vitest](https://vitest.dev) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

#### Prerequisites
Start the test database (isolated from your dev DB — runs on port `5433`):
```bash
  npm run test:db:up
```
Apply migrations and seed the test database:
```bash
  npm run test:db:reset
```

#### Running Tests
Watch mode (re-runs on file changes):
```bash
  npm test
```
Single run (CI-friendly):
```bash
  npm run test:run
```
With coverage report:
```bash
  npm run test:coverage
```

#### File Conventions
- Colocate test files next to the file under test: `my-component.test.tsx` or `my-util.spec.ts`
- Tests live in `src/` alongside source code

#### Tear Down
Stop the test database when you're done:
```bash
  npm run test:db:down
```

----

## Testing — E2E (Playwright)

End-to-end tests use [Playwright](https://playwright.dev) and run against a real browser hitting the Next.js dev server backed by the test database.

#### Prerequisites
Install Playwright browsers (first time only):
```bash
  npx playwright install
```
Start and seed the test database (if not already running):
```bash
  npm run test:db:up
  npm run test:db:reset
```

#### Running Tests
Headless (CI-friendly):
```bash
  npm run test:e2e
```
Interactive UI mode:
```bash
  npm run test:e2e:ui
```
Playwright automatically starts the Next.js dev server against the test database via the `webServer` config in `playwright.config.ts`.

#### Directory Structure
```
tests/playwright/
  specs/     — E2E test files (*.e2e.ts)
  pages/     — Page Object Models (*.ts)
```

----

## Running the Full Stack in Docker

Runs the Next.js app, Postgres, pgAdmin, and a one-shot migration + seed job all together. No local Node.js required.

The startup order is automatic:
1. **postgres** starts and passes its healthcheck
2. **migrate** runs `prisma migrate deploy` then seeds the database, then exits
3. **nextjs** starts only after migrate completes successfully

#### First run (builds image, migrates, seeds, starts app)
```bash
  npm run docker:build
```

#### Open the app
Visit [http://localhost:3000](http://localhost:3000)

#### Subsequent starts (no rebuild)
```bash
  npm run docker:up
```

#### Watch app logs
```bash
  npm run docker:logs
```

#### Stop all services
```bash
  npm run docker:down
```

#### Full reset (wipes DB volume, rebuilds, re-seeds)
```bash
  npm run docker:reset
```

> **Note:** The `nextjs` and `migrate` containers use `postgres` (the Docker service name) as the database host — not `localhost`. This is already configured in `docker-compose.yaml`. Your local `.env` file continues to use `localhost:5432` for running the app outside Docker.

----

# Technology Stack Overview

## Core Technologies

#### Next.js
- **Role**: React framework for building full-stack web applications
- **Usage**: App Router, server components, API routes, middleware for auth
- **Docs**: [Next.js Documentation](https://nextjs.org/docs)

#### React
- **Role**: UI component library
- **Usage**: Building all interactive client-side components
- **Docs**: [React Documentation](https://react.dev)

#### TypeScript
- **Role**: Statically typed JavaScript
- **Usage**: Type safety across the entire codebase — components, API routes, and data access
- **Docs**: [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Database & ORM

#### PostgreSQL
- **Role**: Relational database
- **Usage**: Storing users, time entries, sessions, and pay periods. Runs locally via Docker, hosted on Neon in production.
- **Docs**: [PostgreSQL Documentation](https://www.postgresql.org/docs/)

#### Prisma
- **Role**: ORM for type-safe database access
- **Usage**: Schema definition, migrations, and all database queries
- **Commands**:
  - `npm run migrate:dev`: Create and apply a migration during development
  - `npm run seed`: Seed the database with initial data
  - `npm run studio`: Open Prisma Studio for database inspection
- **Docs**: [Prisma Documentation](https://www.prisma.io/docs)

## UI Framework

#### MUI (Material-UI)
- **Role**: React component library
- **Usage**: DataGrid, modals, buttons, alerts, date pickers — all UI components
- **Docs**: [MUI Documentation](https://mui.com/material-ui/getting-started/)

## Authentication & Security

#### Jose
- **Role**: JSON Web Token library
- **Usage**: Signing and verifying session JWTs in `src/app/lib/sessions.ts`
- **Docs**: [Jose Documentation](https://github.com/panva/jose)

#### bcrypt
- **Role**: Password hashing library
- **Usage**: Hashing user passwords before storage
- **Docs**: [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)

## Development Tools

#### ESLint
- **Role**: Static analysis and linting
- **Usage**: Enforcing code quality and catching common errors
- **Docs**: [ESLint Documentation](https://eslint.org/docs/user-guide/getting-started)

#### Docker
- **Role**: Container runtime
- **Usage**: Local Postgres + pgAdmin via `docker-compose.yaml`, full app stack via `npm run docker:build`
- **Docs**: [Docker Documentation](https://docs.docker.com)

## Testing

#### Vitest
- **Role**: Unit and component test runner
- **Usage**: Fast, Vite-native test runner for unit tests and React component tests with coverage reporting
- **Docs**: [Vitest Documentation](https://vitest.dev)

#### React Testing Library
- **Role**: Component testing utilities
- **Usage**: Querying and interacting with React components the way users do — by role, label, and text
- **Docs**: [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)

#### Playwright
- **Role**: End-to-end testing framework
- **Usage**: Browser-based E2E tests verifying complete user journeys against the running application
- **Docs**: [Playwright Documentation](https://playwright.dev/docs/intro)



