# Mirrorful PM

Internal project management for weekly status, delivered items, milestones, and client reports.

The app is a Next.js frontend on Vercel. Auth, PostgreSQL, and file storage run on Supabase. Project data is **not** stored in localStorage.

## Sign in

Use the email and password of a Supabase Auth user. There is no hardcoded admin password in the app.

## Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Then in the [Supabase SQL editor](https://supabase.com/dashboard), run:

`supabase/migrations/001_initial_schema.sql`

Create the first user under **Authentication → Users → Add user**. Disable public sign-ups under **Authentication → Providers → Email**.

```bash
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

If this browser still has old localStorage projects, the Projects page offers an import into Supabase. The local copy is kept until import succeeds.

## Architecture

- Next.js UI on Vercel
- Supabase Auth (email + password)
- Supabase PostgreSQL (`projects`, `project_dashboard`, `project_prerequisites`, `project_milestones`, `project_delivered_items`)
- Supabase Storage bucket `project-assets` for logos and dashboard images
- Row Level Security: authenticated users can read/write workspace data; anonymous users cannot

## Deploy on Vercel

1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Vercel project.
2. Redeploy:

```bash
npx vercel --yes --prod --project mrfl-pm --scope mirrorful
```

Production URL: [https://mrfl-pm.vercel.app](https://mrfl-pm.vercel.app)

Do not put `SUPABASE_SERVICE_ROLE_KEY` in client env vars. This app does not need the service role key.
