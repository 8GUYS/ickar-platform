# Apple App Store — Asset & Submission Checklist

## App Identity
- **App Name (30 chars max):** ICKAR — Audiobooks & eBooks
- **Subtitle (30 chars max):** Stream. Read. Listen. Nigeria.
- **Bundle ID:** ng.ickar.app
- **SKU:** ICKAR-IOS-001
- **Primary Language:** English (Nigeria)
- **Category:** Books → Audiobooks

---

## App Store Description (4,000 chars max)

```
ICKAR is Nigeria's premier digital media library.

🎧 AUDIOBOOKS
Stream unlimited audiobooks — Nigerian fiction, self-development, business, and
academic titles. Full-screen player with Control Center integration, variable speed,
and sleep timer. Keeps playing when your screen is off.

📖 eBOOKS & PDFs
Beautiful in-app reader with dark, sepia, and light modes. Adjustable text size for
comfortable reading anywhere.

📚 ONE SUBSCRIPTION, EVERYTHING
₦2,500/month unlocks the entire library. No per-title fees. Cancel anytime in Settings.

🇳🇬 BUILT FOR NIGERIA
• Pay with Nigerian cards via Paystack
• Nigerian authors and publishers
• Works on iPhone 12 and newer

✨ KEY FEATURES
• Catalog browse with search and category filters
• Personal library — your content, always available
• Offline downloads — listen without data
• Background audio with Lock Screen and Control Center controls
• Push notifications for new titles

🔒 SECURE
Payments via Paystack (PCI-DSS). Streams use 15-minute signed URLs to protect content.

Privacy Policy: https://ickar.ng/privacy
Support: support@ickar.ng
```

---

## Keywords (100 chars, comma-separated)
```
audiobook,ebook,nigeria,naija,books,reading,listening,fiction,nonfiction,pdf,library,stories
```

---

## App Store Assets

### App Icon
- **Size:** 1024 × 1024 px
- **Format:** PNG, no alpha, no rounded corners (Apple adds them)
- **Design:** Electric Indigo (#6366F1) background, white ICKAR wordmark

### Screenshots — 6.9" iPhone (required, was 6.7" previously)
- **Resolution:** 1290 × 2796 px
- **Format:** PNG or JPG
- **Count:** 3–10 screenshots
- **Required:**
  1. Home screen — catalog grid
  2. Audio player — full-screen, artwork, controls
  3. eBook reader — dark mode
  4. Library screen
  5. Subscription screen (shows ₦2,500/month offer)

### Screenshots — 12.9" iPad Pro (optional but unlocks iPad audience)
- **Resolution:** 2048 × 2732 px

### App Preview Video (optional — 15–30 seconds)
- **Format:** .mp4 or .mov, up to 500MB
- Shows first 15 seconds of actual in-app experience
- Must be recorded from a real device (not simulator)

---

## App Store Connect Metadata

| Field | Value |
|---|---|
| Support URL | https://ickar.ng/support |
| Marketing URL | https://ickar.ng |
| Privacy Policy URL | https://ickar.ng/privacy |
| Copyright | © 2026 ICKAR Digital Media |
| Rating | 4+ (adjust if content includes mature themes) |
| App Review Notes | "This is a subscription-based audiobook and eBook reader app for the Nigerian market. Test account: test@ickar.ng / Test1234! — this account has an active subscription. No real payment is needed to test." |

---

## Content Rating (App Store Connect → App Information → Content Rating)

| Question | Answer |
|---|---|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Sexual Content or Nudity | None |
| Profanity or Crude Humour | Infrequent/Mild (cover fiction content) |
| Mature/Suggestive Themes | None |
| Horror/Fear Themes | None |
| Medical/Treatment Information | None |
| **Resulting rating** | **4+ or 12+** |

---

## In-App Purchases Setup (App Store Connect)

1. App Store Connect → My Apps → ICKAR → In-App Purchases
2. Create new: **Auto-Renewable Subscription**
3. Reference Name: ICKAR Monthly Unlimited
4. Product ID: `ng.ickar.monthly_2500`
5. Subscription Group: "ICKAR Subscriptions"
6. Duration: 1 Month
7. Price: ₦2,500 (Tier NGN 2500 — set in Pricing and Availability)
8. Localized Display Name: "Monthly Unlimited"
9. Localized Description: "Unlimited access to all audiobooks, eBooks and PDFs"
10. Review Screenshot: Show the subscription paywall screen from MediaDetailScreen
11. Free Trial: 7 days (add an Introductory Offer)

---

## Reader App Classification (Critical for App Store Approval)

ICKAR qualifies as a **Reader App** (like Kindle, Audible, Spotify). Reader apps:
- Are allowed to offer subscriptions without Apple's 30% commission IF:
  - They have an external purchase link in-app (linking to your website)
  - OR they don't offer in-app purchase at all and direct users to website

**Decision for MVP:** Use `expo-in-app-purchases` (Apple takes 15–30%). This is simpler for launch. After gaining 1,000+ subscribers, evaluate switching to Reader App entitlement (requires Apple approval and linking to ickar.ng/subscribe).

**Apple Review Letter Template:**
```
Dear App Review Team,

ICKAR is a digital media reader app that provides Nigerian users access to 
audiobooks, eBooks, and PDF publications via subscription.

The app falls under Apple's Reader App guidelines as it is primarily used 
to access previously purchased or subscribed content (audiobooks and eBooks).

Test Account: test@ickar.ng / Test1234!
This account has an active subscription. All content is accessible without 
requiring a new purchase during review.

The subscription is processed through Apple's in-app purchase system.
No external payment links are present.

Thank you for reviewing our app.
```

---

## Apple App Store Server Notifications v2

1. App Store Connect → My Apps → ICKAR → App Information → App Store Server Notifications
2. Production URL: `https://api.ickar.ng/api/webhooks/apple-iap`
3. Sandbox URL: `https://api.ickar.ng/api/webhooks/apple-iap` (same endpoint handles both)
4. Notification version: Version 2
5. Click "Send Test Notification" and verify your API logs it

---

## TestFlight Setup

1. App Store Connect → TestFlight → Add Build (after EAS build completes)
2. Internal Testing: Add up to 100 Apple IDs (Developer team members)
3. External Testing (requires Beta App Review):
   - Add a test group
   - Upload 5 required screenshots
   - Write "What to Test" notes
   - Submit for Beta App Review (usually 1 business day)
4. External testers receive an email with TestFlight link

**What to Test notes template:**
```
Please test the following:
1. Create a new account with any email
2. Browse the catalog — tap any audiobook
3. Subscribe using the test payment (sandbox — no real charge)
4. Play the audiobook — test background audio when you lock your phone
5. Open an eBook — test dark/light reading modes
6. Download a title for offline access
7. Test the Library screen — your downloads should appear

Report any issues to: dev@ickar.ng
```

---

## App Store Submission Checklist

- [ ] EAS production build completed (`eas build --platform ios --profile production`)
- [ ] Build uploaded to App Store Connect (`eas submit --platform ios`)
- [ ] All metadata filled (description, keywords, URLs)
- [ ] All screenshots uploaded (6.9" required, iPad optional)
- [ ] Privacy policy live at ickar.ng/privacy
- [ ] In-app purchase product created and approved
- [ ] Content rating questionnaire completed
- [ ] Apple Sign-In implemented (required if any social login offered)
- [ ] App Review notes written (include test credentials)
- [ ] Export compliance: No encryption beyond HTTPS → select "No" on encryption questions
- [ ] Submit for review — expect 1–2 business days

---

## Cost Summary

| Item | Cost |
|---|---|
| Apple Developer Program | \$99/yr (₦148,500/yr) |
| TestFlight (unlimited) | Included |
| App Store commission | 30% of IAP (15% after Year 1 if < \$1M revenue) |
| At ₦2,500/month × 500 subs | ₦312,500 net to you after 15% commission |
