# Google Play Store — Asset & Submission Checklist

## App Identity
- **App Name:** ICKAR — Audiobooks & eBooks
- **Short Description (80 chars max):**
  > Stream unlimited audiobooks, eBooks & PDFs. Nigerian stories, global knowledge.
- **Full Description (4,000 chars max):**

```
ICKAR is Nigeria's premier digital media library — your gateway to unlimited audiobooks,
eBooks, and PDF publications.

🎧 AUDIOBOOKS
Listen to bestselling Nigerian fiction, non-fiction, self-development, business, and
academic titles. Stream instantly or download for offline listening. Full-screen player
with 15s skip, variable speed (0.5x–2x), and sleep timer.

📖 eBOOKS & PDFs
Read in-app with our beautiful dark, sepia, and light reading modes. Adjustable font
sizes. Watermarked for security, beautiful for reading.

📚 UNLIMITED ACCESS
Subscribe for ₦2,500/month and access everything — no per-title fees. Cancel anytime.

🇳🇬 MADE FOR NIGERIA
• Paystack payment — pay with Nigerian debit/credit cards or bank transfer
• Content by Nigerian authors and publishers
• Works great on Tecno, Infinix, Samsung, and all Android phones

✨ FEATURES
• Browse by category: Fiction, Non-Fiction, Self-Help, Business, Academic
• Search by title or author
• Personal library — all your content in one place
• Offline mode — download titles for offline access
• Background audio — keep listening while using other apps
• Lock screen controls — play/pause without unlocking your phone
• Push notifications — new title alerts

🔒 SECURE & PRIVATE
Your data is protected. Payments processed by Paystack (PCI-DSS compliant).
Audio streams are signed and expire every 15 minutes to prevent piracy.

Download ICKAR today and start reading and listening smarter.
```

---

## Store Listing Assets

### App Icon
- **Size:** 512 × 512 px
- **Format:** PNG (no alpha/transparency allowed on Play Store)
- **Style:** White ICKAR wordmark on Electric Indigo (#6366F1) background
- **Source:** Export from Figma/Canva at 512px

### Feature Graphic
- **Size:** 1024 × 500 px (required)
- **Format:** PNG or JPG
- **Content:** Dark background (#0B0F17), ICKAR logo centered, tagline "Stream. Read. Listen." — book/headphone imagery on right side

### Screenshots (Phone — required)
- **Device:** 6.9" display (Pixel 9 Pro XL size works)
- **Resolution:** 1080 × 2400 px minimum
- **Format:** PNG or JPG
- **Minimum:** 2 screenshots, maximum 8
- **Required screens:**
  1. Home screen (catalog grid with featured audiobooks)
  2. Audio player (full-screen now-playing)
  3. eBook reader (dark mode reading view)
  4. Library (personal collection)
  5. Auth screen (subscription offer)

### Screenshots (7" Tablet — optional but recommended)
- Same content, tablet layout (1200 × 1920 px)

### Promo Video (optional)
- **Length:** 30–120 seconds
- **Format:** YouTube URL (not uploaded directly)
- **Script idea:** "Open app → browse catalog → tap audiobook → audio plays while commuting → open library → see all your content"

---

## Content Rating (Play Console → Policy → App Content)

| Question | Answer |
|---|---|
| Does the app contain violence? | No |
| Does the app contain sexual content? | No |
| Does the app contain profanity? | Depends on content — select "Mild" to cover fiction |
| Does the app contain drugs/alcohol references? | Depends on content |
| Interactive elements: users interact? | No |
| Location sharing? | No |
| Digital purchases? | Yes (subscription) |
| **Resulting rating** | **Everyone (E) or Teen (T)** |

---

## Data Safety Form (Play Console → Policy → Data Safety)

| Data Type | Collected? | Purpose | Shared? |
|---|---|---|---|
| Email address | Yes | Account creation | No |
| Name | Yes | Account display | No |
| Payment info | No (Paystack handles it) | — | — |
| App activity (titles played) | Yes | Personalization | No |
| Device or other IDs | Yes | Analytics, crash reporting | No |
| Audio files | No (streamed, not stored on our servers) | — | — |

**Is data encrypted in transit?** Yes (HTTPS/TLS everywhere)
**Can users request deletion?** Yes (via Profile → Delete Account — implement this endpoint)

---

## Play Console Setup Steps

1. Create Google Play Developer account — **\$25 one-time fee** (₦37,500)
2. Create new app → Android → Free → Nigeria (and other countries)
3. Set up app signing (EAS handles this — use "Google Play App Signing")
4. Fill in store listing (use copy above)
5. Upload APK/AAB (from `eas build --platform android --profile production`)
6. Set content rating (complete the questionnaire)
7. Set up pricing: Free app + ₦2,500/month subscription product
   - Product ID: `ng.ickar.monthly_2500`
   - Billing period: Monthly
   - Base plan: ₦2,500 (auto-renewing)
8. Configure internal testing track → invite 5–10 testers
9. After internal testing passes → promote to closed testing (100 testers)
10. After closed testing (2 weeks min) → submit for production review
11. Play Store review: typically 1–3 business days

---

## Google Play Real-Time Developer Notifications (RTDN) Setup

1. Go to Play Console → Monetize → Subscriptions → Set up Pub/Sub
2. Create a Google Cloud Pub/Sub topic: `ickar-play-rtdn`
3. Create a push subscription pointing to: `https://api.ickar.ng/api/webhooks/google-play`
4. Grant the service account `pubsub@system.gserviceaccount.com` Pub/Sub publisher role
5. Test with the "Send test notification" button in Play Console

---

## Subscription Setup in Play Console

1. Play Console → Monetize → Products → Subscriptions → Create subscription
2. Product ID: `ng.ickar.monthly_2500`
3. Name: ICKAR Monthly Unlimited
4. Benefits: "Unlimited access to all audiobooks, eBooks and PDFs"
5. Base plan: Monthly, ₦2,500, auto-renewing
6. Add a free trial: 7 days (optional — boosts conversion)
7. Status: Active

---

## Localization (bonus — boosts Nigerian installs)

Add descriptions in:
- **Yoruba** — 42M speakers (SW Nigeria)
- **Igbo** — 24M speakers (SE Nigeria)  
- **Hausa** — 25M speakers (N Nigeria)

Use Google Translate as a starting point, then verify with native speakers.
