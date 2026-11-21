# ICKAR: Core Wireframe Specifications & User Journeys
**Sprint 1 Technical Specification & Layout Architecture**  
*Covers: Public Discovery, Media Detail & Purchase, Streaming Player, In-Browser Reader, and Admin Operations*

---

## Wireframe 1: Discovery & Catalog Home (`/`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [LOGO: ICKAR]    [Discover]  [Audiobooks]  [Ebooks]  [Pricing]     [Search 🔍]  [Sign In] [Get Started]│
├─────────────────────────────────────────────────────────────────────────────┤
│ HERO CAROUSEL: FEATURED MEDIA                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  [COVER ART]   THE WEALTH OF THE DIGITAL AFRICAN                        │ │
│ │                By Dr. Emmanuel Adeyemi | 🎧 Audio & 📖 Ebook            │ │
│ │                "An eye-opening masterclass on distribution & scale."    │ │
│ │                [▶ Start Listening]  [Preview Chapter]  [Save to Library] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ TRENDING AUDIOBOOKS (HORIZONTAL SCROLL)                                     │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│ │ [Cover Art]  │  │ [Cover Art]  │  │ [Cover Art]  │  │ [Cover Art]  │  >   │
│ │ Kingdom Mind │  │ Tech Dynasty │  │ African Voice│  │ Grace Found  │      │
│ │ P. Johnson   │  │ K. Bello     │  │ M. Danladi   │  │ S. Okafor    │      │
│ │ ₦2,500 / Sub │  │ ₦1,800 / Buy │  │ ₦2,500 / Sub │  │ ₦2,500 / Sub │      │
│ └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                                             │
│ CURATED COLLECTIONS & NEW RELEASES                                          │
│ [Faith & Leadership]   [Tech & Business]   [African Heritage]   [Self-Growth]│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Wireframe 2: Media Detail & Purchase Screen (`/media/[slug]`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← Back to Discover]                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────┐  THE PURPOSE DRIVEN LEADER                               │
│ │                │  Author: Rev. Tunde Bakare | Narrator: Studio Voices      │
│ │                │  Format: 🎧 Audiobook (4 hrs 12 mins) + 📖 EPUB          │
│ │   COVER ART    │  Rating: ★★★★★ (4.9 / 5.0) | Category: Leadership        │
│ │                │  ─────────────────────────────────────────────────────   │
│ │                │  SYNOPSIS:                                               │
│ │                │  A definitive guide to ethical leadership, resilience,   │
│ │                │  and driving long-term transformation in modern Africa.  │
│ │                │                                                          │
│ └────────────────┘  PURCHASE & ACCESS OPTIONS:                              │
│                     ┌─────────────────────────────────────────────────────┐ │
│                     │ (●) UNLIMITED ACCESS (Recommended)                  │ │
│                     │     ₦2,500 / month (Unlimited audiobooks & ebooks)  │ │
│                     │     [★ Subscribe with Paystack - Instant Unlock]     │ │
│                     └─────────────────────────────────────────────────────┘ │
│                     ┌─────────────────────────────────────────────────────┐ │
│                     │ ( ) BUY JUST THIS AUDIOBOOK                         │ │
│                     │     ₦3,000 one-time payment (Lifetime ownership)     │ │
│                     │     [Buy Now via Card / Transfer]                   │ │
│                     └─────────────────────────────────────────────────────┘ │
│                                                                             │
│ CHAPTER LIST & AUDIO PREVIEW:                                               │
│ [▶ Play Sample (3:45 Free Preview)]                                         │
│ • Chapter 1: The Calling (42 mins) .............................. [🔒 Locked]│
│ • Chapter 2: The Fire of Crisis (38 mins) ....................... [🔒 Locked]│
│ • Chapter 3: Building The Inner Circle (55 mins) ................ [🔒 Locked]│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Wireframe 3: Docked Audio Player & Reader View (`/read/[id]` & `/play/[id]`)

```
AUDIOBOOK PLAYER DOCKED BOTTOM BAR:
┌─────────────────────────────────────────────────────────────────────────────┐
│ [THUMB] Kingdom Mind    [⏮ 15s]  [ ▶ PLAY / ⏸ PAUSE ]  [⏭ 15s]    [1.25x] 🔊───│
│         04:12 / 42:30   ═════════════●══════════════════════════   [Chapters ≡]│
└─────────────────────────────────────────────────────────────────────────────┘

IN-BROWSER DOCUMENT / EPUB READER VIEW:
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← Library]  Kingdom Mind: Chapter 2                   [Aa Font] [☼ Theme] [🔖 Bookmark]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        CHAPTER 2: THE INNER CIRCLE                          │
│                                                                             │
│   Leadership is not exercised in a vacuum. The greatest leaders throughout  │
│   history recognized that their vision was only as potent as the character │
│   and conviction of the five people closest to them...                      │
│                                                                             │
│   [Page 24 of 188]  ══════════════●═══════════════════════════  [Next Page →]│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Wireframe 4: Administrative Management Portal (`/admin`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [ICKAR ADMIN]   [Catalog]   [Upload Media]   [Subscribers]   [Payouts] [Logs]│
├─────────────────────────────────────────────────────────────────────────────┤
│ OPERATIONAL METRICS (LAST 30 DAYS)                                          │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────┐ │
│ │ Active Subs     │  │ Monthly Gross   │  │ Streaming Hours │  │ Server R2│ │
│ │ 342 Users       │  │ ₦855,000        │  │ 2,410 Hours     │  │ $18.40   │ │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘  └──────────┘ │
│                                                                             │
│ UPLOAD & MEDIA INGESTION QUEUE:                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [+ Upload New Title (PDF / EPUB / MP3 / M4A)]                           │ │
│ │ Drag & drop high-res audio or manuscript. Triggers automated HLS worker.│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ Recent Media Ingestion:                                                     │
│ • "Walking in Power.mp3"     → [100% Transcoded HLS]  → [Published]         │
│ • "African Economics.pdf"    → [Watermarking Ready]   → [Published]         │
│ • "Faith That Moves.m4a"     → [Transcoding 64%...]   → [Processing]        │
└─────────────────────────────────────────────────────────────────────────────┘
```
