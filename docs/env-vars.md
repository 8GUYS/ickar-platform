# Environment Variables Master List — ICKAR Platform

> [!CAUTION]
> Never commit secret variables to Git. Use `.env` files locally (they are in `.gitignore`). Set secrets via the Render dashboard, Vercel dashboard, and EAS Secrets — never in source code.

---

## packages/api — Backend (Node.js / Express)

File: `packages/api/.env`

| Variable | Example Value | Secret? | Where to Get |
|----------|--------------|---------|-------------|
| `NODE_ENV` | `production` | No | Hard-code to `production` in deployment |
| `PORT` | `10000` | No | Render sets this automatically; use `10000` to match |
| `DATABASE_URL` | `postgresql://postgres.xxx:pass@aws-0-us-east-1.pooler.supabase.com:5432/postgres` | **YES** | Supabase → Settings → Database → Connection string (Session mode) |
| `JWT_SECRET` | `a-very-long-random-string-64-chars` | **YES** | Generate: `openssl rand -base64 64` |
| `CORS_ORIGIN` | `https://ickar.ng` | No | Your production frontend URL |
| `PAYSTACK_SECRET_KEY` | `sk_live_xxxxxxxxxxxxxx` | **YES** | Paystack Dashboard → Settings → API Keys |
| `R2_ACCOUNT_ID` | `a1b2c3d4e5f6a1b2c3d4` | **YES** | Cloudflare Dashboard → right sidebar |
| `R2_ACCESS_KEY_ID` | `your_r2_access_key` | **YES** | Cloudflare R2 → Manage R2 API Tokens |
| `R2_SECRET_ACCESS_KEY` | `your_r2_secret_key` | **YES** | Cloudflare R2 → API Token creation (once only) |
| `R2_BUCKET_NAME` | `ickar-media` | No | The name you gave the R2 bucket |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | No | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | **YES** | Supabase → Settings → API → service_role key |
| `GOOGLE_PLAY_PACKAGE_NAME` | `ng.ickar.app` | No | Your Android package name |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` | `{ "type": "service_account", ... }` | **YES** | Google Cloud Console → Service Accounts → JSON key |
| `APPLE_SHARED_SECRET` | `xxxxxxxxxxxxxxxx` | **YES** | App Store Connect → Your App → App Information → App-Specific Shared Secret |

### Local development `.env` template

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
JWT_SECRET=dev-secret-change-in-production
CORS_ORIGIN=http://localhost:5173
PAYSTACK_SECRET_KEY=YOUR_PAYSTACK_TEST_SECRET_KEY_HERE
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=ickar-media-dev
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## packages/web — Frontend (React / Vite)

File: `packages/web/.env`

| Variable | Example Value | Secret? | Where to Get |
|----------|--------------|---------|-------------|
| `VITE_API_URL` | `https://api.ickar.ng` | No | Your backend URL (Render custom domain) |
| `VITE_PAYSTACK_PUBLIC_KEY` | `pk_live_xxxxxxxxxxxxxxxx` | No (public) | Paystack Dashboard → Settings → API Keys |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | No | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | No (public) | Supabase → Settings → API → anon key |

> [!NOTE]
> All `VITE_*` variables are **bundled into the browser JavaScript** at build time. Never put secrets (private keys, JWT secrets) in `VITE_*` variables — they will be visible to anyone who downloads your app.

### In Vercel Dashboard

Set these in **Project → Settings → Environment Variables**:
- `VITE_API_URL` → `https://api.ickar.ng`
- `VITE_PAYSTACK_PUBLIC_KEY` → your live public key

Alternatively, `vercel.json` already has:
```json
"env": {
  "VITE_API_URL": "@ickar_api_url"
}
```
This references a Vercel secret named `ickar_api_url`. Set it via:
```bash
vercel env add VITE_API_URL production
```

---

## packages/mobile — React Native / Expo

File: `packages/mobile/.env`

| Variable | Example Value | Secret? | Where to Get |
|----------|--------------|---------|-------------|
| `EXPO_PUBLIC_API_URL` | `https://api.ickar.ng` | No | Your backend URL |
| `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` | `pk_live_xxxxxxxxxxxxxxxx` | No (public) | Paystack Dashboard → Settings → API Keys |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | No | Supabase → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | No (public) | Supabase → Settings → API → anon key |

> [!NOTE]
> `EXPO_PUBLIC_*` variables are embedded in the app bundle — treat them as public. For EAS builds, set secrets in the EAS dashboard (not in `.env`), so they don't end up in the git repo.

### Setting EAS Secrets (for CI/CD builds)

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.ickar.ng"
eas secret:create --scope project --name EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY --value "pk_live_xxx"
```

---

## Generating a Strong JWT Secret

```bash
# macOS / Linux
openssl rand -base64 64

# Windows (PowerShell)
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Store the result as `JWT_SECRET`. It should be at least 32 characters; 64+ is recommended.

---

## Secret Management Summary

| Environment | How Secrets Are Set |
|-------------|-------------------|
| Local development | `packages/api/.env`, `packages/web/.env`, `packages/mobile/.env` (gitignored) |
| Render (API) | Render Dashboard → Service → Environment |
| Vercel (Web) | Vercel Dashboard → Project → Settings → Environment Variables |
| EAS (Mobile) | `eas secret:create` or EAS Dashboard |
| GitHub Actions (CI) | Repository → Settings → Secrets and Variables → Actions |
