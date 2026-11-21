# ICKAR Production Deployment Checklist

> [!IMPORTANT]
> Follow these steps **in order**. Each step depends on the previous. Do not deploy the API before you have the DATABASE_URL.

**Total estimated time**: 4–8 hours for first deployment  
**Total estimated first-year cost**: ~₦35,000–65,000 (~$30–55)

---

## Pre-flight: One-time Account Setup

Before starting, create accounts at:
- [ ] [Supabase](https://supabase.com) — free
- [ ] [Cloudflare](https://cloudflare.com) — free
- [ ] [Render](https://render.com) — free
- [ ] [Vercel](https://vercel.com) — free
- [ ] [Paystack](https://paystack.com) — free (Nigerian business account)
- [ ] [Expo](https://expo.dev) — free
- [ ] [Google Play Console](https://play.google.com/console) — $25 one-time
- [ ] [Apple Developer Program](https://developer.apple.com) — $99/year (~₦150,000)

---

## Step 1 — Supabase Setup → Get DATABASE_URL

**Estimated time**: 20–30 min  
**Cost**: Free (or $25/month Pro to avoid pausing)

- [ ] Create Supabase project (`ickar-production`)
- [ ] Copy **DATABASE_URL** (Session mode pooler, port 5432)
- [ ] Copy **SUPABASE_URL**, **SUPABASE_ANON_KEY**, **SUPABASE_SERVICE_ROLE_KEY**
- [ ] Save all keys to your password manager

📖 See: [docs/supabase-setup.md](./supabase-setup.md)

---

## Step 2 — Cloudflare R2 Setup → Get R2 Credentials

**Estimated time**: 15–20 min  
**Cost**: Free (within free tier limits)

- [ ] Create Cloudflare account
- [ ] Create R2 bucket: `ickar-media`
- [ ] Create R2 API Token (Object Read & Write on `ickar-media`)
- [ ] Copy **R2_ACCOUNT_ID**, **R2_ACCESS_KEY_ID**, **R2_SECRET_ACCESS_KEY**
- [ ] Set CORS policy on bucket
- [ ] Save all credentials to password manager

📖 See: [docs/cloudflare-r2-setup.md](./cloudflare-r2-setup.md)

---

## Step 3 — Paystack → Get Live API Keys

**Estimated time**: 10–30 min (account verification may take longer)  
**Cost**: Free (Paystack takes a transaction fee: 1.5% + ₦100 per transaction)

- [ ] Log in to [Paystack Dashboard](https://dashboard.paystack.com)
- [ ] Complete business verification (required for live keys)
- [ ] Go to **Settings → API Keys & Webhooks**
- [ ] Copy **Secret Key** (`sk_live_...`) → `PAYSTACK_SECRET_KEY`
- [ ] Copy **Public Key** (`pk_live_...`) → `VITE_PAYSTACK_PUBLIC_KEY` and `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY`
- [ ] Note the webhook URL input field (you'll fill it in Step 7)

---

## Step 4 — API Deploy to Render → Set Env Vars → Verify /health

**Estimated time**: 20–30 min  
**Cost**: Free (Render free tier spins down after 15 min inactivity; $7/month for always-on)

- [ ] Push your code to GitHub (Render deploys from GitHub)
- [ ] Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
- [ ] Connect your GitHub repo
- [ ] Render detects `render.yaml` automatically and creates the `ickar-api` service
- [ ] Go to service → **Environment** → add all secret env vars:
  - [ ] `JWT_SECRET` — generate with `openssl rand -base64 64`
  - [ ] `DATABASE_URL` — from Step 1
  - [ ] `PAYSTACK_SECRET_KEY` — from Step 3
  - [ ] `R2_ACCOUNT_ID` — from Step 2
  - [ ] `R2_ACCESS_KEY_ID` — from Step 2
  - [ ] `R2_SECRET_ACCESS_KEY` — from Step 2
  - [ ] `R2_BUCKET_NAME` — `ickar-media`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` — from Step 1
- [ ] Trigger a deploy (or it auto-deploys on push)
- [ ] Wait for build to complete (~2–5 min)
- [ ] Verify: `curl https://ickar-api.onrender.com/health` → `{ "status": "ok" }`
- [ ] Note your Render URL (e.g. `ickar-api.onrender.com`) for next steps

---

## Step 5 — Frontend Deploy to Vercel → Set VITE_API_URL → Verify

**Estimated time**: 10–15 min  
**Cost**: Free (Vercel Hobby plan)

- [ ] Go to [Vercel Dashboard](https://vercel.com/new) → Import Git Repository
- [ ] Select your monorepo → set **Root Directory** to `packages/web`
- [ ] Vercel detects `vercel.json` → framework Vite auto-detected
- [ ] In Vercel project settings → **Environment Variables** → add:
  - [ ] `VITE_API_URL` = `https://api.ickar.ng` (or `https://ickar-api.onrender.com` before custom domain)
  - [ ] `VITE_PAYSTACK_PUBLIC_KEY` = `pk_live_...`
- [ ] Also set the Vercel secret: `vercel env add VITE_API_URL production` → paste your API URL
- [ ] Deploy (auto-deploys on push)
- [ ] Verify: open the Vercel preview URL — app should load
- [ ] Add custom domain `ickar.ng` in Vercel project settings → Domains

---

## Step 6 — Run Prisma DB Push + Seed on Production Database

**Estimated time**: 10 min  
**Cost**: Free

- [ ] In `packages/api`, set `DATABASE_URL` in your local `.env` to the **production** Supabase URL
- [ ] Run:
  ```bash
  cd packages/api
  npx prisma db push
  ```
- [ ] Verify output: `The database is now in sync with your Prisma schema.`
- [ ] Run seed:
  ```bash
  npx tsx prisma/seed.ts
  ```
- [ ] Verify in Supabase Table Editor: tables are populated
- [ ] Run RLS policies:
  - Open Supabase SQL Editor
  - Paste contents of `packages/api/prisma/rls_policies.sql`
  - Click Run

> [!CAUTION]
> After running this step, switch your local `.env` DATABASE_URL back to your development database. Never develop against the production database.

---

## Step 7 — Configure Paystack Webhook URL

**Estimated time**: 5 min  
**Cost**: Free

- [ ] Go to Paystack Dashboard → **Settings → API Keys & Webhooks**
- [ ] Under **Webhook URL**, enter:
  ```
  https://api.ickar.ng/api/payments/webhook/paystack
  ```
- [ ] Save
- [ ] In Paystack, test the webhook (Send Test Event) → verify your API logs show the event

---

## Step 8 — Configure Google Play RTDN Pub/Sub

**Estimated time**: 30–45 min  
**Cost**: Free

Google Play Real-Time Developer Notifications (RTDN) sends subscription events to your backend.

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create a project (or use existing)
- [ ] Enable the **Google Play Android Developer API**
- [ ] Create a **Pub/Sub topic** named `ickar-play-notifications`
- [ ] Create a **Pub/Sub subscription** with endpoint:
  ```
  https://api.ickar.ng/api/payments/webhook/google-play
  ```
- [ ] Grant Pub/Sub Publisher role to `google-play-developer-notifications@system.gserviceaccount.com`
- [ ] In Google Play Console → App → **Monetization → Subscriptions**
- [ ] Enter your Pub/Sub topic path and save
- [ ] Create a Service Account with `Pub/Sub Subscriber` role → download JSON key
- [ ] Add `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` to Render env vars

---

## Step 9 — Configure Apple App Store Server Notifications

**Estimated time**: 15 min  
**Cost**: Free (requires Apple Developer Program subscription)

- [ ] Go to [App Store Connect](https://appstoreconnect.apple.com) → Your App → **App Information**
- [ ] Under **App-Specific Shared Secret**, generate and copy the secret
- [ ] Add `APPLE_SHARED_SECRET` to Render env vars
- [ ] Under **Subscriptions → Server Notifications**, enter:
  - **Production URL**:
    ```
    https://api.ickar.ng/api/payments/webhook/apple
    ```
  - **Sandbox URL** (for testing):
    ```
    https://api.ickar.ng/api/payments/webhook/apple
    ```
- [ ] Save → Apple will send a test notification

---

## Step 10 — Mobile: Update EXPO_PUBLIC_API_URL to Production

**Estimated time**: 5 min  
**Cost**: Free

- [ ] Update `packages/mobile/.env`:
  ```env
  EXPO_PUBLIC_API_URL=https://api.ickar.ng
  EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
  ```
- [ ] Update EAS secrets:
  ```bash
  eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.ickar.ng"
  eas secret:create --scope project --name EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY --value "pk_live_xxx"
  ```
- [ ] Verify the app connects to the correct API (check network tab or logs)

---

## Step 11 — EAS Build Android Production → Submit to Play Store

**Estimated time**: 45–90 min (build takes 20–30 min on EAS cloud)  
**Cost**: Google Play Console: $25 one-time | EAS: Free tier (30 builds/month)

- [ ] Log in to EAS: `eas login`
- [ ] Configure EAS: `eas build:configure` (creates/updates `eas.json` if needed)
- [ ] Build production AAB:
  ```bash
  cd packages/mobile
  npm run build:android
  # or: eas build --platform android --profile production
  ```
- [ ] Download the `.aab` file from EAS dashboard
- [ ] Submit to Play Store:
  ```bash
  npm run submit:android
  # or: eas submit --platform android
  ```
  - Or upload manually in Google Play Console → **Production** → Create new release
- [ ] Fill in Play Store listing (see `docs/play-store-assets.md`)
- [ ] Submit for review (3–7 days for first review)

---

## Step 12 — EAS Build iOS Production → Submit to App Store

**Estimated time**: 60–120 min (build takes 20–40 min; App Store review 1–3 days)  
**Cost**: Apple Developer Program: $99/year (~₦150,000)

- [ ] Ensure Apple Developer account is active
- [ ] Create App ID in [Apple Developer Portal](https://developer.apple.com/account)
- [ ] Create App in [App Store Connect](https://appstoreconnect.apple.com)
- [ ] Configure EAS credentials:
  ```bash
  eas credentials
  ```
  EAS can manage provisioning profiles and signing certificates automatically.
- [ ] Build production IPA:
  ```bash
  cd packages/mobile
  npm run build:ios
  # or: eas build --platform ios --profile production
  ```
- [ ] Submit to App Store:
  ```bash
  npm run submit:ios
  # or: eas submit --platform ios
  ```
- [ ] In App Store Connect: fill in app metadata, screenshots, privacy policy
- [ ] Submit for review (1–3 days typically)

---

## Cost Summary

| Item | Cost (₦) | Cost ($) | Recurrence |
|------|----------|----------|------------|
| Domain `.ng` | ₦5,000–15,000 | — | Annual |
| Domain `.com` (alternative) | ~₦15,000 | ~$10 | Annual |
| Cloudflare (DNS + CDN + R2) | Free | Free | — |
| Supabase | Free / ₦40,000 Pro | Free / $25 | Monthly |
| Render (API hosting) | Free / ₦11,000 Starter | Free / $7 | Monthly |
| Vercel (frontend) | Free | Free | — |
| EAS Build | Free (30/month) | Free | — |
| Google Play Console | ₦40,000 | $25 | One-time |
| Apple Developer Program | ~₦150,000 | $99 | Annual |
| Paystack | Free (1.5% + ₦100/txn) | — | Per transaction |

**Minimal viable launch (no Apple)**: ~₦45,000–55,000 one-time + ₦0/month  
**Full launch (with iOS)**: ~₦195,000–205,000 one-time + ₦0/month

---

## Post-Launch Monitoring

- [ ] Set up Render alerts (Service → Notifications)
- [ ] Set up Supabase alerts (Settings → Notifications)
- [ ] Monitor Cloudflare R2 usage (R2 → Overview → Usage)
- [ ] Monitor Paystack transactions (Dashboard → Transactions)
- [ ] Check `/health` endpoint regularly (or set up UptimeRobot — free)

```bash
# Quick health check
curl https://api.ickar.ng/health
```
