# Time Management System

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

-----
## Getting Started
Install all dependencies:
```bash
  npm install
```

Install Deno using the docs at: https://docs.deno.com/runtime/getting_started/installation/

Run docker compose
```bash
  docker compose up -d
```

Run the Prisma migration:
```bash
  npm run migrate:dev
```
Seed the database:
```bash
  npm run seed
```
Check the database for seeded data:
```bash
  npm run studio
```
Run the development server:
```bash
  deno task dev
```

## Environment Setup

Create a `.env` file in the project root using the .example.env file as a template. This file will contain your environment variables.

### Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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

#### Applying Migartions in Production
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

# Technology Stack Overview

## Core Technologies

#### Deno
- **Role**: Runtime environment for JavaScript and TypeScript
- **Usage**: Running your Next.js application with deno task dev
- **Docs**: [Deno Documentation](https://deno.land/manual/getting_started/installation)

#### Next.js
- **Role**: React framework for building client or server rendered applications.
- **Usage**: Provides the structure for your application, including routing and server-side rendering.
- **Docs**: [Next.js Documentation](https://nextjs.org/docs/getting-started)

## Database & ORM

#### PostgreSQL
- **Role**: Relational database management system
- **Usage**: Storing users, time entries, sessions, and pay periods
- **Docs**: [PostgreSQL Documentation](https://www.postgresql.org/docs/)

#### Neon
- **Role**: Serverless PostgreSQL provider
- **Usage**: Cloud database service (via @neondatabase/serverless)
- **Docs**: [Neon Documentation](https://neon.tech/docs)

#### Prisma
- **Role**: ORM (Object-Relational Mapping) for database access
- **Usage**: Database schema definition, migrations, and type-safe queries
- **Commands**:**
  - `npm run migrate:dev`: Run database migrations
  - `npm run seed`: Seed the database with initial data
  - `npm run studio`: Open Prisma Studio for database management
- **Docs**: [Prisma Documentation](https://www.prisma.io/docs)

## UI Framework

#### React
- **Role**: JavaScript library for building user interfaces
- **Usage**: Building the frontend of your application
- **Docs**: [React Documentation](https://reactjs.org/docs/getting-started.html)

#### MUI (Material-UI)
- **Role**: React component library
- **Usage**: Providing pre-styled components like DataGrid, Buttons, and Paper ensure standardized UI accross the application.
- **Docs**: [MUI Documentation](https://mui.com/material-ui/getting-started/overview/)

#### Tailwind CSS
- **Role**: Utility-first CSS framework
- **Usage**: Styling your application with utility classes
- **Docs**: [Tailwind CSS Documentation](https://tailwindcss.com/docs/installation)

## Authentication & Security

#### Jose
- **Role**: JavaScript implementation of JSON Web Tokens
- **Usage**: Handling authentication tokens
- **Docs**: [Jose Documentation](https://github.com/panva/jose)

#### bcrypt
- **Role**: Password hashing library
- **Usage**: Hashing user passwords for secure storage
- **Docs**: [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)

# Development Tools

## TypeScript
- **Role**: Superset of JavaScript that adds static typing
- **Usage**: Type safety and better tooling in your Next.js application
- **Docs**: [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## EsLint
- **Role**: Linter for identifying and fixing problems in JavaScript and TypeScript code
- **Usage**: Ensuring code quality and consistency
- **Docs**: [EsLint Documentation](https://eslint.org/docs/user-guide/getting-started)

## Prettier
- **Role**: Code formatter
- **Usage**: Ensuring consistent code style across the project
- **Docs**: [Prettier Documentation](https://prettier.io/docs/en/index.html)
