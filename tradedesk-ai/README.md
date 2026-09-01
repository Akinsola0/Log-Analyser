# TradeDesk AI — frontend

The marketing site, the tradesman dashboard and the homeowner marketplace for TradeDesk AI: an AI front desk that answers a trade's phone, books the job into their calendar and confirms it on WhatsApp or SMS.

**This repository folder is the frontend only.** Supabase schema and RLS, the AI voice tool contract, Twilio, and the booking rules are owned by the backend team. Everything the UI needs from them is defined as a typed function in [`lib/api/`](lib/api) and documented in [`docs/api-contract.md`](docs/api-contract.md); every screen runs today on mock fixtures with no backend running.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

No environment variables are needed. Sign-up and sign-in work out of the box against browser-local demo accounts (see **Auth** below).

```bash
npm run build    # production build + typecheck
npm run lint
```

## Auth

Without a Supabase project the app runs on **demo auth**: accounts are created and checked in your browser's `localStorage`, so you can sign up, sign in, stay signed in across reloads, and sign out. The dashboard is gated on it — visiting `/dashboard` signed out sends you to `/login`.

There's a ready-made account on the sign-in screen (the **Use the demo account** button):

```
dermot@kellyplumbing.ie / tradedesk
```

Sign up with your own name, business name and trade instead and the dashboard uses them — it's the same mock leads and calls underneath.

This is a stand-in, not a security boundary: the accounts live in one browser, and clearing site data removes them.

**Switching to real Supabase auth** is two environment variables, no code change. Copy `.env.example` to `.env.local`, fill in the project URL and anon key, restart `npm run dev`, and the same screens render Supabase Auth UI instead. `lib/api/auth.ts` documents which Supabase call each function becomes.

## What's here

| Route                                  | What it is                                                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                    | Marketing homepage: dual "I need a tradesman" / "I am a tradesman" split, category grid with indicative prices, real reviews, cost-of-a-missed-call comparison, visible tiered pricing, FAQ |
| `/login`, `/signup`                    | Sign-in and sign-up — demo auth today, Supabase Auth UI once the project exists                                                                                                             |
| `/dashboard`                           | Overview: week counters and the "needs you" queue (failed calls, unsent confirmations, untouched leads)                                                                                     |
| `/dashboard/leads`                     | Leads from the phone, the marketplace and by hand, filterable, with status changes                                                                                                          |
| `/dashboard/calendar`                  | Week view of booked jobs against the business's working hours                                                                                                                               |
| `/dashboard/calls`                     | Call log with the AI's outcome, its summary, and a one-click correction                                                                                                                     |
| `/dashboard/messages`                  | Booking confirmations, including failures and a re-send on the other channel                                                                                                                |
| `/dashboard/availability`              | Weekly working-hours editor, split days supported                                                                                                                                           |
| `/dashboard/settings`                  | Business profile and confirmation-channel preferences                                                                                                                                       |
| `/find`, `/find/[category]/[location]` | Marketplace browse and search                                                                                                                                                               |
| `/pro/[slug]`                          | Public tradesman profile with services, prices and reviews                                                                                                                                  |

## How the data layer works

```
components  →  lib/api/*  →  lib/api/mock/*      (today)
                         →  /api/... routes      (once the backend lands)
```

1. Shapes live in [`lib/api/types.ts`](lib/api/types.ts) and mirror the Supabase columns exactly.
2. Mock fixtures live in `lib/api/mock/` and are never imported by a component.
3. Every screen calls a wrapper (`getLeads()`, `saveAvailability()`, `createMarketplaceLead()`, …). Swapping one to a real route is a one-line change inside that function.
4. Anything the backend still owes us is marked in code:

```bash
grep -rn "TODO(backend)" lib app components
```

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui components (vendored in `components/ui`) · lucide-react · Supabase Auth UI · deployed on Vercel.

## Conventions

- One polished dark theme, defined as tokens in `app/globals.css`: a near-black warmed towards red, one crimson-to-magenta accent kept for emphasis and glow, and `.section-invert` for the light bands that break up a long page. Don't hardcode colours in components.
- Headlines use the `.display` class (Archivo, uppercase, tight tracking); small letterspaced labels use `.kicker`. Body copy stays in Geist.
- Status badges are keyed on the database enums (`components/status-badge.tsx`) — if the backend adds a value, add it there and nowhere else.
- Money is integer euro cents everywhere; format with `formatEuro()` in `lib/format.ts`.
- Copy is written for a tradesman, in plain language: "missed call", "booked job", "burst pipe" — never "leverage your workflow".
