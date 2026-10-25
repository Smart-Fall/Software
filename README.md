# SmartFall - Fall Detection System

SmartFall is a fall detection and health monitoring system. An IoT device detects falls and streams sensor data to a web app, where patients, caregivers, and admins can follow alerts, health trends, and device status.

Built with **Next.js 16** (App Router), **React 19**, **TypeScript**, **Convex** for the backend, and **Tailwind CSS** with Radix UI.

**Live demo:** https://smartfall.vercel.app/

## Start Here

- **Documentation site:** `content/docs/` (served by fumadocs). It covers architecture, the IoT pipeline, API reference, and deployment.
- **Architecture:** [`content/docs/architecture/`](content/docs/architecture/index.mdx)
- **Local setup:** [`content/docs/getting-started/`](content/docs/getting-started/index.mdx)

## Project Structure

```
app/                   Next.js routes only
  api/                 Route handlers (auth, admin, caregiver, patient, device, falls, messages)
  <route>/             Pages: login, signup, user-dashboard, caregiver-dashboard, admin, profile, devices
components/            Shared UI
  ui/                  shadcn/ui primitives
  dashboard/           Dashboard widgets
  profile/, docs/      Profile forms and docs rendering
lib/                   Shared server and client code
  db/                  Database service and Convex adapter
  auth.ts              JWT session helpers
convex/                Convex schema and backend functions
content/docs/          Documentation source
scripts/               One-off and verification scripts
public/                Static assets
```

## Getting Started

### Prerequisites

- Node.js 20 or later
- A Convex project (https://dashboard.convex.dev)

### Installation

```bash
npm install
cp .env.example .env
```

### Environment Variables

Fill in `.env` using `.env.example` as the template:

| Variable | Purpose |
| --- | --- |
| `CONVEX_DEPLOYMENT` | Convex deployment name, e.g. `dev:happy-panda-123` |
| `NEXT_PUBLIC_CONVEX_URL` | Convex HTTP URL, e.g. `https://happy-panda-123.convex.cloud` |
| `JWT_SECRET` | Required. Signs session tokens. Use a long random string. |
| `DEVICE_INGEST_API_KEY` | Shared secret the device firmware sends with fall events |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

Never commit `.env`. Secrets must come from the environment, not from source files.

### Development

```bash
npm run dev        # Runs `convex dev` and `next dev` together
```

Open http://localhost:3000.

### Production Build

```bash
npm run build
npm run start
```

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Convex and Next.js in development mode |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run tsc` | Type-check the project |
| `npm run seed:admin` | Create an admin account |
| `npm run verify:fall-pipeline` | Check the fall detection pipeline end to end |
| `npm run generate:keys` | Generate the device firmware key |

## Authentication

Sessions are JWTs signed with `JWT_SECRET` and stored in an HTTP-only cookie. Passwords are hashed with bcrypt. Three account types exist: `user` (patient), `caregiver`, and `admin`. See `content/docs/architecture/auth-flow.mdx` for the full flow.

## Contributing

1. Create a branch from `main`.
2. Run `npm run tsc` and `npm run lint` before opening a pull request.
3. Keep secrets out of the repo. Use `.env` locally and environment variables in deployment.

## License

ISC
