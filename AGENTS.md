# AGENTS.md — HumanitAID

## Project overview

Fundraising site for HumanitAID Foundation (DRC humanitarian crisis). Real app is split across `frontend/` (SPA vanilla), `backend/` (Express + admin JWT) and `frontend/api/` (Vercel serverless: donations checkout + Stripe webhook). `humanitaid.html` at the repo root and `prototype/humanitaid.html` are out-of-scope single-file prototypes — do not edit them. `lang="fr"` on user-facing text.

## Key conventions

- **Language**: French (`lang="fr"`). All user-facing text is in French. Keep new content in French.
- **Fonts**: Google Fonts loaded externally — Playfair Display (headings), Crimson Pro (body), Space Mono (labels/monospace). Do not introduce new font families without replacing existing ones.
- **Color system**: CSS custom properties in `:root` (e.g. `--rouge`, `--or`, `--noir`). Use these variables, not hardcoded hex values.
- **Layout**: Vanilla CSS Grid + Flexbox. No CSS framework. Responsive breakpoint at 900px.
- **JS**: Vanilla — no frameworks or libraries. Functions like `submitDon()`, `switchTab()` in `frontend/js/*`. IntersectionObserver for scroll animations.

## Architecture notes

- **Stack** : frontend statique (`frontend/`) + Serverless Vercel (`frontend/api/`, modules `checkout.js`, `webhooks/stripe.js`, `_shared.js`) + backend Express (`backend/`) + admin SPA (`admin/`). No build system for the frontend.
- **Sections (frontend/index.html)**: ticker bar → nav → hero slideshow → stats strip → progress bars (fundraising) → causes grid → testimonials → quotes carousel → news → donation form → footer → confirmation modal. The hero slideshow auto-rotates (5.5s `setInterval`, data in `heroData` JS array).
- **Dons** : le formulaire dialogue avec le serverless `POST /api/donations/checkout` (Stripe Checkout TEST) ; le webhook officiel `POST /api/webhooks/stripe` (serverless) confirme les dons écrits en PostgreSQL. Le backend Express répond **410 Gone** sur `/api/webhooks/stripe` (endpoint déplacé — jamais de double traitement).
- **Paiements**: onglets Card / Mobile Money / Wire transfer, panneaux togglés par `switchTab()`.
- **Persistance**: PostgreSQL via `pg` (DSN `DATABASE_URL`). Supabase = hôte Postgres uniquement — aucun SDK Supabase, aucune RLS, aucune connexion navigateur directe.
- **Compte admin**: initialisé au boot Express par `backend/services/bootstrapAdmin.js` depuis `ADMIN_DEFAULT_PASSWORD` (jamais loggé ; refuse de démarrer en prod si manquant/faible).

## Gotchas

- The ticker bar HTML is **duplicated** (items 1–7 repeated) for seamless CSS animation loop. If you edit ticker items, edit both copies.
- Progress bar animation uses `data-target` attribute on `.bar-fill` elements — width is set via JS on scroll intersection, not CSS.
- Animated stat counters use `data-count` and optional `data-prefix` attributes.
- Webhook idempotence : la base `webhook_events` porte `event_id` (index unique partiel, migration `database/migrations/001_stripe_webhook_idempotency.sql`). Ne jamais supprimer l'écriture de `event_id` dans `frontend/api/webhooks/stripe.js`.
- Ne jamais accepter de champs financiers d'un client (`status`, `provider_transaction_id`, `receipt_url`, `reference`) dans `POST /api/donations` — allowlist stricte dans `backend/routes/donations.js`.
- Stripe en **TEST uniquement** : tout `sk_live_`/`pk_live_` est rejeté (`assertTestMode`). Ne jamais rediger/utiliser de vraies clés.

## Validation

- `npm run verify` (racine) = `node --check` sur tous les `.js` + build no-op.
- Pas de test suite unitaire ; vérifier en ouvrant `frontend/index.html` dans un navigateur (API de fallback démo si nécessaire).

## How to preview

- **Frontend/public site** : `cd frontend && python3 -m http.server 8080` (le frontend appelle l'API même-origine) — ou ouvrir directement `frontend/index.html`.
- **Backend/admin (dev)** : `cd backend && npm run dev` (mode démo si `DEMO_MODE=true`, sans base de données). Base locale quand `DATABASE_URL` est défini.