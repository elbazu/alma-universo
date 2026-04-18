# Mi Alma en el Universo

Branded community hub for Alma's courses — one hub, many courses, single creator. Built with Next.js 14 (App Router) + PocketBase, deployed via Nixpacks on EasyPanel.

## Stack

- **Next.js 14.2.5** — App Router, TypeScript, React 18
- **Tailwind CSS** — theming via CSS variables (light/dark/system)
- **PocketBase 0.26.8** — auth, database, file storage
- **EasyPanel + Nixpacks** — build + deploy on Hostinger VPS
- **Content seeds** — JSON files in `content/` for early prototyping; migrating to PocketBase per Sprint 1+

## Local development

```bash
npm install
npm run dev            # http://localhost:3000
```

You need a `.env.local` with at minimum:

```
NEXT_PUBLIC_POCKETBASE_URL=https://momatwork-pocketbase-alma-staging.weupli.easypanel.host
```

(Staging URL is fine for local development. `.env.production` is committed because Nixpacks can't reliably pass build-time env vars.)

## Deploy

EasyPanel watches the `staging` branch and the `main` branch:

- Push to `staging` → deploys to the staging app
- Push to `main` → deploys to production

Nixpacks drives the build (`nixpacks.toml`): `npm run build` then `npm start`. The `Dockerfile` in the repo is not used.

## Project layout

```
alma-universo/
├── app/                    # Next.js App Router pages
├── components/
│   ├── auth/               # SignInCard, Google + magic link
│   ├── community/          # Feed components
│   ├── layout/             # Navbar, Sidebar
│   └── settings/           # Settings modal (Profile, Appearance, etc.)
├── context/
│   ├── AuthContext.tsx     # PocketBase auth singleton
│   ├── FlagsContext.tsx    # Feature-flag provider (DB-backed)
│   ├── SettingsContext.tsx # Open/close settings modal from anywhere
│   └── ThemeContext.tsx    # light / dark / system
├── content/                # JSON seeds for early prototyping
├── lib/
│   ├── flags.ts            # Flag keys + safe defaults
│   ├── pocketbase.ts       # Singleton PB client
│   └── types.ts            # Shared TS types
├── pb_schema/              # PocketBase collection definitions (import via admin UI)
│   ├── collections.json
│   ├── seed_feature_flags.json
│   └── README.md
├── middleware.ts           # JWT expiry guard on protected routes
├── nixpacks.toml
└── tailwind.config.js      # Alma palette: terracotta, gold, cream
```

## Feature flags

All beta features default to **off**. The app reads flags from the `feature_flags` PocketBase collection at mount; flip a flag in the admin UI and the change applies on next page load — no deploy required.

Current keys:

- `paywall_enabled` — gates paid courses behind enrollment
- `stripe_enabled` — shows billing UI and Stripe checkout
- `analytics_enabled` — shows admin dashboard stats (not placeholders)
- `chat_enabled` — 1:1 direct messages between members
- `affiliates_enabled` — affiliate tracking and payouts

## PocketBase schema

See `pb_schema/README.md` for import instructions. The schema covers: courses, enrollments, categories, rules, posts, comments, reactions, notifications, chat threads + messages, user preferences, payment methods, transactions, and feature flags.

## Branding

Palette: terracotta `#B3322B`, gold `#D4A574`, cream `#FAF8F5`. See `tailwind.config.js` and `app/globals.css`. Dark mode uses softer warm tones on a deep warm-black surface.

Fonts: Playfair Display (display/headings), DM Sans (body).
