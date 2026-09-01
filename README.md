# TechScrum

TechScrum is a project management tool which helps companies prevent delays.

This is a yarn workspaces monorepo with two packages:

- [`backend`](backend) — Express/TypeScript API (`be.techscrum`)
- [`frontend`](frontend) — React/TypeScript app (`fe.techscrum`)

## Prerequisites

- Node 22.x
- Yarn (classic, 1.x)
- MongoDB running locally (or update the connection strings in `backend/.env` to point elsewhere)

## Setup

One-time setup after cloning:

```bash
yarn setup
```

This installs dependencies for both workspaces, builds the backend, and runs its interactive init script (creates the default tenant/admin user). Before running it, copy the env files and fill in the values (ask a Kitman for real secrets):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

## Running locally

```bash
yarn dev
```

- By default Frontend: http://localhost:3000
- By default Backend: http://localhost:8000

## Other useful scripts

| Script        | Description                                     |
| ------------- | ----------------------------------------------- |
| `yarn build`  | Build both workspaces                           |
| `yarn lint`   | Lint both workspaces                            |
| `yarn test`   | Run backend tests                               |
| `yarn deploy` | Deploy frontend to S3                           |
| `yarn cdn`    | Invalidate the frontend CloudFront distribution |

## Where to find more docs

- [`backend/README.md`](backend/README.md) — backend setup details, folder structure, logs, coding standard
- [`backend/DEVOPS_README.md`](backend/DEVOPS_README.md) — environments, database, and infra requirements for DevOps
- [`frontend/README.md`](frontend/README.md) — frontend environments and deployment
- [Backend architecture (Notion)](https://lilac-dancer-737.notion.site/Backend-8d15124cec444344bbd41935ed697b1e)
- [Coding guidelines (Notion)](https://lilac-dancer-737.notion.site/Coding-Guidelines-bfa77d75476a4b19a195ddb20b02bb33)
- [Frontend deployment (Notion)](https://www.notion.so/Frontend-React-e424fc3e001d432eb15b4407a9fac588)

## License

© 2025 Kitman Yiu. All Rights Reserved. Unauthorized copying of this file is strictly prohibited.
