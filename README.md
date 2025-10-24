# Green Leaf Catering

A production-ready catering platform built with Next.js 14, Prisma, PostgreSQL, Stripe, and Resend. The application powers the full catering workflow: public marketing pages, menu browsing with modifiers, authenticated checkout with scheduling rules, PDF invoicing, transactional email, and an administrative dashboard.

## Tech stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui components
- **Forms & Validation**: React Hook Form + Zod
- **Auth**: NextAuth (email/password + Google OAuth) with JWT sessions and RBAC
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe Payment Element, PaymentIntents, and webhooks
- **Email**: Resend for transactional notifications
- **PDFs & Storage**: @react-pdf/renderer + local storage (configurable for object storage)
- **Tooling**: ESLint, Prettier, Jest, GitHub Actions CI, Docker & docker-compose

## Project structure

```
├── prisma/                 # Prisma schema, migrations, seed
├── src/
│   ├── app/                # App Router routes & APIs
│   ├── components/         # UI and feature components
│   ├── emails/             # Transactional email templates
│   ├── lib/                # Shared utilities (auth, pricing, scheduling, etc.)
│   ├── schemas/            # Zod validation schemas
│   └── __tests__/          # Jest unit tests
├── storage/invoices        # Generated invoice PDFs (mounted volume in Docker)
└── docker-compose.yml      # Local dev stack (web + PostgreSQL)
```

## Prerequisites

- Node.js 18+
- npm 9+ (or pnpm/yarn if you adapt the scripts)
- Docker & docker-compose (for local Postgres and containerised runs)
- Stripe account with test keys
- Google OAuth client (for social login)
- Resend (or compatible SMTP provider) API key

## Environment variables

Duplicate `.env.example` to `.env.local` (for local dev) and populate the values:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32+ char secret for JWT encryption |
| `NEXTAUTH_URL` | Base URL of the app (e.g. http://localhost:3000) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for webhook verification |
| `RESEND_API_KEY` | Resend API key (or configure email provider) |
| `EMAIL_FROM` | From address for transactional email |
| `ADMIN_EMAILS` | Comma-separated list of addresses granted ADMIN role on signup |
| `DEFAULT_TIME_ZONE` | IANA time zone for scheduling (e.g. `America/Los_Angeles`) |
| `NEXT_PUBLIC_DEFAULT_TIME_ZONE` | Exposed time zone for client-side formatting |
| `DEFAULT_TAX_RATE` | Fallback tax rate (decimal) |
| `DELIVERY_FEE` | Default delivery fee |

> :lock: Never commit real secrets. Use `.env.local` for local development and configure production secrets in your hosting provider.

## Initial setup

```bash
npm install
npx prisma generate
```

Run the initial migration and seed the database:

```bash
# Start a local Postgres instance (optional if you already have one)
docker compose up -d db

# Apply migrations (a migration SQL file is included under prisma/migrations)
npx prisma migrate deploy

# Populate seed data (categories, items, modifiers, discount, admin user)
npm run prisma:seed
```

The seed creates an admin account:

- **Email**: `admin@example.com`
- **Password**: `Admin123!`

Update the credentials immediately in production.

## Running the app

### Local development

```bash
npm run dev
```

Visit `http://localhost:3000`.

### Dockerised environment

```bash
docker compose up --build
```

This starts the Next.js app on `http://localhost:3000` and Postgres on port `5432`. The `storage/invoices` directory is mounted so generated invoices persist between restarts.

### Stripe webhook

Expose your local dev server and forward Stripe webhooks to the Next.js handler:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the displayed signing secret into `STRIPE_WEBHOOK_SECRET`.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint + Next lint checks |
| `npm run typecheck` | TypeScript project check |
| `npm test` | Jest unit tests |
| `npm run prisma:seed` | Seed the database with sample data |

## Testing & quality gates

The GitHub Actions workflow (see `.github/workflows/ci.yml`) runs `npm run lint`, `npm run typecheck`, and `npm test` on every push. Locally, run the same commands before committing.

### Current test coverage

- `src/__tests__/pricing.test.ts`: verifies pricing engine calculations (modifiers, discounts, fees)
- `src/__tests__/scheduling.test.ts`: validates scheduling engine lead time, blackout, and capacity rules

Add integration tests (Playwright/RTL) as you expand the feature set.

## Production checklist

- Configure environment variables in your hosting platform (Vercel, Render, etc.)
- Provision persistent storage for invoices (S3, GCS, etc.) and update the storage adapter
- Set Stripe webhook endpoint to `/api/webhooks/stripe`
- Verify Resend domain + from address
- Update `siteConfig` with real business details and support contacts
- Review scheduling settings via the admin dashboard (tax rate, delivery fee, blackout dates)

## Support & contact

Questions or issues? File a GitHub issue or reach the catering team at `catering@example.com`.
