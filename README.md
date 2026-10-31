This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Railway

Production runs on Railway in the "FranPadelProject App" project, production environment.
Pushes to `main` deploy automatically from GitHub.

Every deploy runs `bin/rails db:prepare` before the new release goes live, so migrations run first and a failing migration stops the deploy. The command is set in [`railway.json`](railway.json), which Railway reads on each deploy, and mirrored in `.railway/railway.ts`; keep the two the same.

### Infrastructure as code

The whole Railway project is defined in [`.railway/railway.ts`](.railway/railway.ts): the app service, Postgres and its volume, the `bundled-wardrobe` storage bucket, the custom domain, and every service variable. Secret values such as `RAILS_MASTER_KEY` stay on Railway through `preserve()` and are never committed.

The file manages the whole project. Anything missing from it, including a service variable, is deleted on apply. Add new variables to the file, not only in the dashboard.

One-time setup:

```bash
npm install
railway login
railway link
```

Change infrastructure by editing the file, then preview and apply:

```bash
railway config plan
railway config apply
```

`plan` only reads Railway. `apply` shows the plan again and asks for confirmation, and it marks destructive changes. A dashboard edit made outside the file shows up as a pending change in the next plan, so either copy it into the file or let the apply revert it.

To check for drift, `railway config plan --detailed-exit-code` exits `0` when the file matches Railway and `2` when changes are pending.

See [`.railway/README.md`](.railway/README.md) for the full command reference.

### Database access

```bash
railway connect Postgres --tunnel-only
```

## Demo Club

`rails demo:club` builds the Club shown to prospective clients: a Club Manager, three Coaches at different points of the Beginner Course, a pending Coach invitation, 18 Players, the coming Christmas, Easter and August Break Periods, and five Class Groups (in progress, finished, and starting next week). Every date is relative to the day it runs, so the first Coach always has a Class today and past Classes are done.

Run it again to reset the demo after a presentation: it keeps the accounts and Players and rebuilds the groups, plans, progress and Break Periods.

```bash
rails demo:club
```

The demo accounts (`demo.manager@franpadelproject.com`, `demo.coach@franpadelproject.com`, `demo.coach2@…`, `demo.coach3@…`) get the password `demo-padel-2026` in development. In production the password is required, and the task runs inside the app service's container, since `DATABASE_URL` points at Railway's private network:

```bash
railway ssh -- env DEMO_PASSWORD=choose-one bin/rails demo:club
```

The Course Modules and Exercises must already be imported (`rails course_modules:import` and `rails exercises:import`).
