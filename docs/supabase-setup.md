# Supabase Setup Guide — ICKAR Platform

> [!IMPORTANT]
> Supabase is used as the **PostgreSQL host** for ICKAR. We use our own JWT auth, not Supabase Auth. Supabase gives us a managed Postgres instance + dashboard + RLS + storage for cover images.

---

## Free Tier Limits (as of 2024)

| Resource | Limit |
|----------|-------|
| Database storage | 500 MB |
| Bandwidth | 5 GB / month |
| File storage | 1 GB |
| Projects | 2 |
| Pausing | Projects pause after 7 days inactivity on free tier |

---

## Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and click **Start your project**.
2. Sign up / log in with GitHub (recommended).
3. Click **New Project**.
4. Fill in:
   - **Organization**: Create one if needed (e.g. `ickar-team`)
   - **Project name**: `ickar-production`
   - **Database password**: Generate a strong password — **save this immediately** (you will need it for the DATABASE_URL)
   - **Region**: Choose `West EU (Ireland)` or `US East (N. Virginia)` — closest to your users
5. Click **Create new project** and wait ~2 minutes for provisioning.

---

## Step 2 — Get the DATABASE_URL (Session Mode Pooler)

Supabase provides two connection modes. For Node.js with Prisma, use the **Session mode pooler** (port 5432 via pgBouncer).

1. In your project dashboard, go to **Settings → Database**.
2. Scroll to **Connection string** → select **URI** tab.
3. Toggle **Use connection pooling** ON.
4. Set **Mode** to `Session` (not Transaction — Prisma needs session mode for prepared statements).
5. Copy the URI — it will look like:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual database password.
7. This is your `DATABASE_URL` environment variable.

> [!TIP]
> If you use **Transaction mode** (port 6543), Prisma will fail with prepared statement errors. Always use Session mode (port 5432) for Prisma.

---

## Step 3 — Apply the Prisma Schema

Run this from the **monorepo root**:

```bash
cd packages/api
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  npx prisma db push
```

Or set `DATABASE_URL` in your `packages/api/.env` file first, then:

```bash
cd packages/api
npx prisma db push
```

This creates all tables (`users`, `albums`, `tracks`, `subscriptions`, `purchases`, etc.) in your Supabase database.

Expected output:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres" at "aws-0-us-east-1.pooler.supabase.com:5432"
✔ Generated Prisma Client
The database is now in sync with your Prisma schema.
```

---

## Step 4 — Seed the Database

```bash
cd packages/api
npx ts-node prisma/seed.ts
```

If you get a TypeScript error, add `--esm` flag or run with `tsx`:

```bash
npx tsx prisma/seed.ts
```

This populates initial data (admin user, sample content categories, etc.).

---

## Step 5 — Enable Row Level Security (RLS)

RLS must be enabled on each table to prevent direct API access bypassing your Node.js backend.

1. In Supabase dashboard, go to **SQL Editor**.
2. Open a new query.
3. Copy and paste the contents of `packages/api/prisma/rls_policies.sql`.
4. Click **Run** (▶).
5. Verify: Go to **Table Editor** → click any table → **RLS** tab should show policies listed.

> [!WARNING]
> Until RLS is enabled, any user with the Supabase anon key can read **all** data directly from the database. Enable RLS before going live.

To enable RLS on a table manually if needed:
```sql
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "albums" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tracks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchases" ENABLE ROW LEVEL SECURITY;
```

---

## Step 6 — Set Up Supabase Storage for Cover Images

Supabase Storage hosts **cover art images** (public). Audio files go to Cloudflare R2 (private, signed URLs).

1. In the dashboard, go to **Storage**.
2. Click **New bucket**.
3. Name: `covers`
4. Toggle **Public bucket** ON (cover images are always public).
5. Click **Create bucket**.
6. Set the **MIME type** policy if desired: `image/*`

Access pattern — your API uploads covers to this bucket. The public URL format is:
```
https://xxxxxxxxxxxx.supabase.co/storage/v1/object/public/covers/{albumId}/{filename}.jpg
```

---

## Step 7 — Get the API Keys

1. Go to **Settings → API**.
2. Under **Project API keys**, copy:
   - **anon (public)**: Safe to expose in frontend/mobile. Used for unauthenticated reads (if RLS allows). Store as `SUPABASE_ANON_KEY`.
   - **service_role (secret)**: **Never expose publicly.** Bypasses RLS. Used in your Node.js backend for admin operations. Store as `SUPABASE_SERVICE_ROLE_KEY`.
3. Also copy **Project URL** (e.g. `https://xxxxxxxxxxxx.supabase.co`) → `SUPABASE_URL`.

---

## Step 8 — Auth Users Sync (Optional)

ICKAR uses its own JWT authentication system (not Supabase Auth). However, you can optionally view registered users in the Supabase dashboard:

- Since we store users in our `users` table (not `auth.users`), no special sync is needed.
- If you later want Supabase Auth as a provider, you would add a trigger to sync `auth.users` → `public.users` on sign-up.
- For now: manage users entirely through the ICKAR admin panel / API.

---

## Step 9 — Prevent Project Pausing (Free Tier)

Supabase pauses free-tier projects after **7 days of inactivity**.

Options to prevent this:
- **Upgrade to Pro** ($25/month) — recommended before launch.
- **Set up a cron ping**: Use Render's cron job (or GitHub Actions) to hit your `/health` endpoint every 3 days, which keeps the DB connection active.

```yaml
# Add to render.yaml as a cron service:
  - type: cron
    name: keep-alive
    runtime: node
    schedule: "0 12 */3 * *"
    buildCommand: "echo 'ok'"
    startCommand: "node -e \"fetch('https://ickar-api.onrender.com/health')\""
```

---

## Quick Reference

| Item | Where to find |
|------|--------------|
| DATABASE_URL | Settings → Database → Connection string (Session mode) |
| SUPABASE_URL | Settings → API → Project URL |
| SUPABASE_ANON_KEY | Settings → API → anon public |
| SUPABASE_SERVICE_ROLE_KEY | Settings → API → service_role secret |
| Storage bucket URL | Storage → covers → bucket URL |
