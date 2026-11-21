# ICKAR Design System: Foundation & Tokens
**Version:** 1.0.0  
**Theme:** Premium Modern Dark-First with Restrained Glassmorphism & High-Contrast Readability

---

## 1. Color Palette & Tokens

### Primary Brand Accents
* **Brand Primary (Electric Indigo):** `#6366F1` (`rgb(99, 102, 241)`) — Call-to-actions, active playback states, primary buttons.
* **Brand Primary Hover:** `#4F46E5` (`rgb(79, 70, 229)`)
* **Brand Accent (Vibrant Amber/Gold):** `#F59E0B` (`rgb(245, 158, 11)`) — Premium badges, creator verification, ratings.
* **Brand Secondary (Deep Cyan):** `#06B6D4` (`rgb(6, 182, 212)`) — Secondary indicators, interactive links.

### Dark-First Neutral Surfaces
* **Canvas / Body Background:** `#0B0F17` (`rgb(11, 15, 23)`) — Deep obsidian black.
* **Surface Card (Level 1):** `#131B2B` (`rgb(19, 27, 43)`) — Media cards, catalog items.
* **Surface Elevated (Level 2):** `#1E293B` (`rgb(30, 41, 59)`) — Modals, dropdowns, navigation bar.
* **Surface Glass (Translucent):** `rgba(19, 27, 43, 0.75)` with `backdrop-filter: blur(16px)` and `border: 1px solid rgba(255, 255, 255, 0.08)`.

### Typography Colors
* **Text Primary (High Contrast):** `#F8FAFC` (`rgb(248, 250, 252)`) — Titles, active text, headers.
* **Text Secondary:** `#94A3B8` (`rgb(148, 163, 184)`) — Author names, metadata, subtitles.
* **Text Muted:** `#64748B` (`rgb(100, 116, 139)`) — Timestamps, chapter numbers, inactive icons.

### Feedback & Status
* **Success:** `#10B981` (`rgb(16, 185, 129)`) — Payment verified, download ready.
* **Warning:** `#F59E0B` (`rgb(245, 158, 11)`) — Subscription expiring soon.
* **Error / Destructive:** `#EF4444` (`rgb(239, 68, 68)`) — Payment failed, access revoked.

---

## 2. Typography Hierarchy

* **Font Family (Display & UI):** `Plus Jakarta Sans`, `Inter`, -apple-system, sans-serif
* **Font Family (Reader / Long-form Content):** `Merriweather`, `Lora`, Georgia, serif

| Token | Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-display` | 36px (2.25rem) | 44px | 800 (Extrabold) | Hero banners, landing headers |
| `text-h1` | 28px (1.75rem) | 36px | 700 (Bold) | Section titles, book titles |
| `text-h2` | 22px (1.375rem) | 28px | 600 (Semibold) | Category headers, modal titles |
| `text-h3` | 18px (1.125rem) | 24px | 600 (Semibold) | Card titles, chapter headers |
| `text-body` | 15px (0.9375rem) | 22px | 400 (Regular) | General UI, descriptions |
| `text-small` | 13px (0.8125rem) | 18px | 400 (Regular) | Metadata, timestamps, badges |
| `text-caption` | 11px (0.6875rem) | 14px | 500 (Medium) | Small badges, sub-labels |

---

## 3. UI Component Standards

### 1. Media Card (Audiobook & Ebook)
* **Dimensions:** 180px width $\times$ 260px height.
* **Border Radius:** 12px (`rounded-xl`).
* **Visual Treatment:** High-resolution cover artwork with subtle gradient overlay (`linear-gradient(to top, rgba(0,0,0,0.8), transparent)`).
* **Hover State:** Translate Y (-4px), border glow (`border-indigo-500/50`), elevation shadow.
* **Badges:** Top-left badge for format (e.g., "🎧 Audio", "📖 Ebook", "Bundle").

### 2. Persistent Audio Player Bar (Docked Bottom)
* **Height:** 76px.
* **Position:** Fixed bottom (`bottom-0 left-0 right-0`), z-index: 50.
* **Styling:** Glassmorphism surface (`#131B2B` with 85% opacity, `backdrop-blur-md`), 1px top border (`rgba(255, 255, 255, 0.1)`).
* **Controls:** 
  * Left: Thumbnail, Track Title, Author Name.
  * Center: Skip -15s, Play/Pause (circular primary button), Skip +15s, scrubber progress bar with elapsed/total time.
  * Right: Playback speed (1.0x, 1.25x, 1.5x, 2.0x), volume slider, chapter drawer toggle.

### 3. Entitlement & Purchase CTA
* **Action Button:** Full-width or inline rounded-lg button, background gradient (`from-indigo-600 to-indigo-500`), white bold text.
* **States:**
  * If user has entitlement: **"Listen Now"** or **"Read Now"** (Emerald green accent).
  * If user needs subscription: **"Unlock with Subscription (₦2,500/mo)"** (Indigo accent).
  * If one-off purchase available: **"Buy for ₦2,000"** (Subtle outlined secondary button).
