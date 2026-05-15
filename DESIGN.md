# Design Brief — Phase 2 Extension

## Tone & Purpose
Professional, trustworthy minimalism for secure P2P crypto transactions. Dark-mode-first interface for crypto-savvy users. Phase 2 adds: payment verification flow, jury voting UI, carrier comparison, admin metrics dashboard, and bilingual (Ukrainian/English) interface with automatic system detection.

## Color Palette

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| Background | 0.97 0 0 | 0.145 0 0 | Main canvas |
| Foreground | 0.15 0 0 | 0.92 0 0 | Primary text |
| Card | 0.99 0 0 | 0.18 0 0 | Elevated surfaces (listings, chat, jury cards) |
| Primary | 0.42 0.08 255 | 0.52 0.08 255 | Form inputs, secondary UI |
| Accent | 0.75 0.15 90 | 0.72 0.18 145 | CTAs, trust indicators (teal-gold), active jury votes |
| Verified | — | 0.65 0.15 130 | Payment verification success (green-tint) |
| Pending-Verification | — | 0.72 0.18 90 | Payment verification pending (amber animation) |
| Warning-Verification | — | 0.55 0.18 30 | Payment verification failed (warm red) |
| Destructive | 0.55 0.22 25 | 0.65 0.19 22 | Warnings, cancellations, dispute indicators |
| Border | 0.92 0.01 255 | 0.25 0.02 255 | Dividers, input outlines, card borders |
| Muted | 0.88 0 0 | 0.22 0 0 | Disabled, ghost text, neutral badges |

## Typography
- **Display & Body**: GeneralSans + Figtree (Figtree extended glyph support for Ukrainian Cyrillic)
- **Mono**: GeistMono (timestamps, token amounts, wallet addresses, amounts)
- **Scale**: 12px (xs), 14px (sm), 16px (base), 20px (lg), 24px (xl)

## Structural Zones
- **Header**: border-b border-border, bg-background, sticky top, language toggle (uk/en) top-right
- **Sidebar (Navigation)**: bg-sidebar, border-r border-sidebar-border, 240px, collapsible on mobile
- **Main Content**: bg-background, grid layout mobile-first, responsive columns
- **Cards/Sections**: bg-card with rounded-lg border-border, shadow-sm base, shadow-md on hover
- **Admin Dashboard**: 2-row grid — metrics chart (line chart), error log table below
- **Jury Interface**: 3-card voting grid + jury reputation score header
- **Carrier Comparison**: 3-column card grid (Nova Poshta, Ukrposhta, Meest)
- **Payment Verification**: Inline status indicator with animated pending state
- **Footer**: border-t border-border, bg-muted/20, text-center

## Elevation & Depth
- **Surface 0**: background (no shadow)
- **Surface 1**: card, jury-vote-card, carrier-card (shadow-sm, border-border)
- **Surface 2**: popover, dropdown (shadow-md)
- **Surface 3+**: modal, tooltip, expanded admin filters (shadow-elevated)

## Component Patterns — Phase 2

| Component | Pattern |
|-----------|---------|
| Payment Verification Indicator | `.verification-indicator` — inline badge with status (pending/verified/failed), animated pulse-subtle if pending |
| Jury Vote Card | `.jury-vote-card` — 3 cards (for buyer, for seller, abstain) with vote count + weight display, active state border-accent bg-accent/5 |
| Carrier Card | `.carrier-card` — 3-column grid showing provider name, estimated price (USDT/USDC), delivery days, reliability %, click to select |
| Admin Metrics Chart | `.metric-chart-container` — h-64 line chart with 5 chart-token colors, legend, KPI labels (swap success %, settlement time avg, dispute rate) |
| Error Log Table | Sortable table: timestamp (mono), error code, message, status (resolved/open), user/trade ID links |
| Language Toggle | Top-right dropdown/toggle: 🇺🇦 UA / 🇬🇧 EN, auto-detect system locale on first load |
| Jury Reputation Score | Header badge: jury level + total cases + success rate %, color-coded tier |
| Listing Card (Phase 1 extended) | Existing pattern + payment verification status sub-label |
| Trade Status Button (Phase 1 extended) | Existing button-primary/secondary + loading state for payment verification flow |

## Spacing & Rhythm
- **Gaps**: 4px (xs), 8px (sm), 12px (md), 16px (lg), 24px (xl)
- **Padding**: Cards 16px, Sections 24px, Page 32px, Dashboard grid gap 16px
- **Density**: Compact on mobile (12px gaps), moderate on tablet (16px), relaxed on desktop (24px)
- **Admin table rows**: 12px vertical padding, 16px horizontal

## Motion & Animation
- **Smooth Transition**: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) for interactive elements
- **Pulse-Subtle**: 2s cubic-bezier(0.4, 0, 0.6, 1) infinite for pending verification states (softer than default pulse)
- **Hover States**: opacity 0.9 on buttons, shadow-md on cards, border-accent on inputs, jury cards glow accent on active
- **Loading**: pulse-subtle on pending verification badges, loading spinner on admin chart refresh

## Responsive Breakpoints
- **Mobile** (sm 640px): 1-column layout, no sidebar (drawer), bottom nav, single card jury votes stacked
- **Tablet** (md 768px): 2-column, collapsible sidebar, 2-column carrier grid
- **Desktop** (lg 1024px+): 3-column, persistent sidebar, full admin dashboard 2-row grid, 3-column carrier grid

## Bilingual Support (Phase 2)
- **Language Detection**: Auto-detect system locale (navigator.language), fallback to English
- **Storage**: Save user language choice in localStorage
- **UI Labels**: All text (buttons, headers, status labels, table headers) use i18n keys
- **Cyrillic Rendering**: Figtree font covers Ukrainian characters, no fallback needed
- **Direction**: Both languages left-to-right

## Signature Details — Phase 2
- Payment verification uses animation (pulse-subtle opacity) to draw attention to pending confirmations, not visual noise
- Jury voting UI emphasizes clarity: each card shows single action (vote for/against/abstain) with vote weight visible
- Carrier comparison uses consistent metric layout (price / time / reliability %) for quick scanning
- Admin dashboard line charts use chart-token color palette (5 colors) for distinct data series
- Error log uses monospace timestamps and status color coding (green=resolved, orange=open)
- Language toggle is always visible, minimalist (flags or text), top-right corner
- Jury reputation badge uses existing tier system (new/bronze/silver/gold) extended with success %

## Anti-Patterns Avoided — Phase 2
- No animated confetti, bouncing, or excessive easing on verification states — pulse-subtle only
- No color shift on jury card hover — border-accent highlight only
- No full-page refresh on language change — state persists, i18n keys update
- No dropdown overlays blocking content — modals for filter panels
- No rainbow-colored chart legends — stick to chart-1 through chart-5
- No auto-advance in verification flow — user confirms each step

## Dark Mode (Default)
- Elevated card surfaces (bg-card 0.18 L) ensure legibility against deep background (0.145 L)
- Text foreground (0.92 L) has 7.7:1 contrast on background, 4.8:1 on card (AA+)
- Accent (0.72 0.18 145) vibrant for CTAs & jury voting, 4.5:1 contrast on dark surfaces
- Verification states (verified 0.65, pending 0.72) maintain ≥4:1 contrast on dark card
- Charts use full chart-token palette for differentiation; text overlays use foreground or muted-foreground as appropriate
