# Domain Setup Guide — ICKAR Platform

---

## Step 1 — Register Your Domain

### Option A: `ickar.ng` — Nigerian Domain (Recommended)

| Item | Detail |
|------|--------|
| Registry | NIRA (Nigeria Internet Registration Association) |
| URL | [https://www.nira.org.ng](https://www.nira.org.ng) or via local registrar (e.g. Web4Africa, QServers) |
| Cost | ₦5,000 – ₦15,000 / year |
| Processing | May take 24–48 hours |
| Requirement | Nigerian entity or individual |

**Recommended registrars for .ng**:
- [QServers.net](https://www.qservers.net) — popular, Nigerian-owned
- [Web4Africa](https://www.web4africa.ng) — reliable, good support
- [Whogohost](https://www.whogohost.com) — Nigerian-focused

### Option B: `ickar.com` — International Domain

| Item | Detail |
|------|--------|
| Registrars | Namecheap, Cloudflare Registrar, Google Domains (Squarespace) |
| Cost | ~$10 / year (~₦15,000 at current rates) |
| Processing | Instant |

> [!TIP]
> Use **Cloudflare Registrar** ([https://cloudflare.com/products/registrar](https://cloudflare.com/products/registrar)) for `.com` — they sell at cost (no markup), and you get Cloudflare DNS automatically. No annual price hike.

---

## Step 2 — Move DNS to Cloudflare (Strongly Recommended)

Cloudflare as your DNS provider gives you:
- **Free CDN** — static assets served from 300+ PoPs globally
- **DDoS protection** — industry-leading, free
- **Analytics** — traffic, threats, bandwidth
- **SSL everywhere** — automatic
- **R2 custom domain** support (required for `media.ickar.ng`)
- **Page Rules / Redirects** — `www` → non-www, etc.

### How to switch DNS to Cloudflare

1. Go to [https://dash.cloudflare.com](https://dash.cloudflare.com) → **Add a Site**.
2. Enter your domain (e.g. `ickar.ng`).
3. Choose the **Free plan**.
4. Cloudflare scans your existing DNS records and imports them.
5. Cloudflare gives you two nameservers, e.g.:
   ```
   alice.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```
6. Log in to your domain registrar → update the **nameservers** to these Cloudflare ones.
7. Wait for propagation: usually 10 minutes – 24 hours.

---

## Step 3 — DNS Records Configuration

Once Cloudflare is managing your DNS, add/verify these records:

### Frontend — Vercel

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | `@` (or `ickar.ng`) | `cname.vercel-dns.com` | ☁️ Proxied |
| CNAME | `www` | `cname.vercel-dns.com` | ☁️ Proxied |

> [!NOTE]
> Vercel requires you to add the domain in your Vercel project settings first. Go to **Project → Settings → Domains → Add Domain** and enter `ickar.ng`. Vercel will give you verification instructions.

**In Vercel dashboard** (Project → Settings → Domains):
- Add `ickar.ng` and `www.ickar.ng`
- Set `ickar.ng` as the primary domain
- Vercel auto-provisions SSL via Let's Encrypt

### Backend API — Render

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | `api` | `ickar-api.onrender.com` | 🔘 DNS only (not proxied) |

This makes `api.ickar.ng` point to your Render backend.

> [!IMPORTANT]
> Set the CNAME to **DNS only** (grey cloud, not orange) for the `api` subdomain. Render handles SSL directly; Cloudflare proxying can interfere with Render's SSL provisioning.

**In Render dashboard** (Service → Settings → Custom Domains):
- Add `api.ickar.ng`
- Render auto-provisions SSL via Let's Encrypt

### Media CDN — Cloudflare R2

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | `media` | *(auto-created by Cloudflare R2)* | ☁️ Proxied |

This is created automatically when you connect `media.ickar.ng` to your R2 bucket in the Cloudflare dashboard (see `docs/cloudflare-r2-setup.md` Step 7).

---

## Step 4 — SSL Certificates

| Service | SSL Provider | Action Required |
|---------|-------------|-----------------|
| Frontend (Vercel) | Let's Encrypt via Vercel | None — auto-provisioned |
| API (Render) | Let's Encrypt via Render | None — auto-provisioned |
| Media CDN (Cloudflare R2) | Cloudflare Universal SSL | None — auto-provisioned |
| Cloudflare (root domain) | Cloudflare Universal SSL | None — auto-provisioned |

> [!TIP]
> All SSL certificates are provisioned and renewed automatically. You do not need to buy or manage certificates. This is one of the main benefits of using Vercel + Render + Cloudflare.

---

## Step 5 — Update Environment Variables

After domain setup, update:

```env
# packages/api/.env
CORS_ORIGIN=https://ickar.ng

# packages/web/.env
VITE_API_URL=https://api.ickar.ng

# packages/mobile/.env
EXPO_PUBLIC_API_URL=https://api.ickar.ng
```

Also update `render.yaml`:
```yaml
- key: CORS_ORIGIN
  value: https://ickar.ng
```

---

## Step 6 — Verify Everything

```bash
# Check frontend
curl -I https://ickar.ng
# Expected: HTTP/2 200

# Check API
curl https://api.ickar.ng/health
# Expected: { "status": "ok" }

# Check media (if custom domain set up)
curl -I https://media.ickar.ng/audio/test.mp3
# Expected: HTTP/2 403 (private file — good, signing required)
```

---

## DNS Summary Table

| Subdomain | Points To | Purpose |
|-----------|-----------|---------|
| `ickar.ng` | Vercel | Frontend web app |
| `www.ickar.ng` | Vercel | www redirect |
| `api.ickar.ng` | Render | Backend API |
| `media.ickar.ng` | Cloudflare R2 | Audio CDN (optional) |

---

## Estimated Costs

| Item | Annual Cost |
|------|------------|
| `.ng` domain | ₦5,000–15,000 / year |
| `.com` domain (alternative) | ~$10 / year (~₦15,000) |
| Cloudflare DNS | Free |
| SSL certificates | Free |
| Cloudflare CDN | Free |
