# HumanitAID Foundation

> Plateforme humanitaire numérique internationale pour mobiliser des dons en faveur des victimes des conflits en République Démocratique du Congo.

[![CI](https://github.com/humanitaid/foundation/actions/workflows/ci.yml/badge.svg)](https://github.com/humanitaid/foundation/actions/workflows/ci.yml)

---

## Table of Contents

- [Presentation](#presentation)
- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [Admin CMS](#admin-cms)
- [API Endpoints](#api-endpoints)
- [Payment Architecture](#payment-architecture)
- [Database](#database)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## Presentation

### What is HumanitAID

HumanitAID Foundation is a full-stack humanitarian fundraising platform built to collect and manage donations for victims of armed conflicts in the Democratic Republic of the Congo. It provides a modern public-facing website, a dynamic CMS admin panel, and a secure REST API — all designed to ensure transparency and traceability of every donation.

### Mission

Mobiliser des ressources financières et matérielles pour secourir les populations affectées par les conflits armés en RDC : déplacés, orphelins, veuves, victimes de violences et personnes handicapées. 100% des dons sont reversés aux bénéficiaires.

### Who it serves

| Audience | Role |
|---|---|
| **Diaspora congolaise** | Donors — give securely via card, Mobile Money, or wire transfer |
| **Philanthropes & entreprises** | Major donors and corporate sponsors |
| **Institutions & ONG** | Strategic partners (ONU, UNICEF, Croix-Rouge, etc.) |
| **Équipe HumanitAID** | Editors, finance staff, administrators (CMS admin panel) |
| **Bénéficiaires** | Read stories, testimonials, and news about ongoing programs |

---

## Architecture

```
HumanitAID/
├── prototype/              ← Single-file testable prototype (humanitaid.html)
├── frontend/               ← Production public site (HTML/CSS/JS)
│   ├── index.html          ← Main page
│   ├── css/                ← variables, base, components, sections, responsive
│   ├── js/                 ← api, app, carousel, donation, theme
│   ├── assets/             ← Images and static assets
│   ├── sw.js               ← Service Worker (PWA)
│   ├── manifest.webmanifest
│   ├── sitemap.xml
│   └── robots.txt
├── admin/                  ← CMS Admin panel (SPA)
│   ├── index.html
│   ├── css/
│   └── js/
├── backend/                ← Express.js REST API
│   ├── server.js           ← Entry point
│   ├── config/             ← env.js, database.js
│   ├── routes/             ← 11 route modules
│   ├── middleware/          ← auth, rbac, security, upload
│   ├── services/           ← stripe, flutterwave, paystack, email, storage
│   └── uploads/            ← Local file storage
├── shared/                 ← Shared constants (roles, statuses, enums)
├── database/
│   └── schema.sql          ← PostgreSQL schema (16 tables, triggers, seeds)
├── .github/workflows/
│   └── ci.yml              ← GitHub Actions CI
├── package.json            ← Root workspace (npm workspaces)
├── .env.example            ← Environment template
└── .gitignore
```

---

## Features

### Public Site (Frontend)

- **Responsive design** — 320px to 1920px, single breakpoint at 900px
- **Dark / Light / System theme** — persisted in localStorage, inline anti-flash script
- **Hero slideshow** — auto-rotating carousel (5.5s interval)
- **Animated stats** — counters and progress bars on scroll (IntersectionObserver)
- **Donation form** — multi-tab (Card / Mobile Money / Wire transfer)
- **Testimonials carousel** — beneficiary, volunteer, donor, partner stories
- **News section** — urgent alerts, field reports, advocacy
- **Ticker bar** — seamless CSS animation loop for live updates
- **SEO optimized** — Open Graph, Twitter Card, JSON-LD (NGO schema)
- **PWA** — service worker, manifest.webmanifest, sitemap.xml
- **Demo mode** — works without any backend

### Admin CMS

- **Full CRUD** — publications, media, slideshows, news, testimonials, causes
- **Media library** — image upload with thumbnail generation (Sharp)
- **Slide management** — reorder, activate/deactivate, hero vs field stories
- **User management** — create, edit, delete, role assignment
- **Settings panel** — site name, contact info, social links, donation goals
- **Donation tracking** — list, filter by status/method, aggregate statistics
- **Audit logging** — immutable trail of all sensitive operations
- **JWT authentication** — token-based login with role-based access control

### Backend API

- **11 route modules** — auth, posts, media, slides, causes, testimonials, news, donations, settings, users, webhooks
- **Payment orchestrator** — Stripe, Flutterwave, Paystack integration
- **Webhook endpoints** — Stripe, Flutterwave, Paystack verification
- **Demo mode** — full API works without database (hardcoded mock data)
- **File uploads** — Multer + Sharp for image processing
- **Rate limiting** — separate limiters for auth (5 req/15min) and general (100 req/15min)
- **Security headers** — Helmet with CSP, HSTS

---

## Quick Start

### Prototype (simplest — zero dependencies)

```bash
# Open directly in browser — no server needed
open prototype/humanitaid.html
```

### Frontend

```bash
# Serve with any static server
npx serve frontend
# Then open http://localhost:3000
```

### Admin Panel

```bash
# Serve with any static server
npx serve admin
# Login: admin@humanit-aid.org / admin
```

### Full Stack (Backend + Frontend)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start backend (with demo mode by default)
npm run dev
# → API starts on http://localhost:3000

# 4. Serve frontend in another terminal
npx serve frontend

# 5. Serve admin in another terminal
npx serve admin
```

### Production (with PostgreSQL)

```bash
# 1. Create PostgreSQL database and run schema
psql -U your_user -d humanitaid -f database/schema.sql

# 2. Update .env with real credentials
#    DEMO_MODE=false
#    DATABASE_URL=postgresql://user:pass@localhost:5432/humanitaid

# 3. Start backend
npm start
```

---

## Admin CMS

**Login URL:** `http://localhost:3000` (serve `admin/` directory)

| Credentials | Value |
|---|---|
| Email | `admin@humanit-aid.org` |
| Password | `admin` |

### Dashboard Sections

| Section | Description | Required Role |
|---|---|---|
| Publications | Blog articles, field reports | Editor+ |
| Médias | Image/document library | Editor+ |
| Diaporamas | Hero banners, field stories | Admin+ |
| Actualités | News, alerts, reports | Editor+ |
| Témoignages | Beneficiary/partner testimonials | Editor+ |
| Causes | Fundraising campaigns | Admin+ |
| Donations | Donation list & statistics | Finance+ |
| Paramètres | Site configuration | Admin+ |
| Utilisateurs | User management | Admin+ (create/delete: Super Admin) |

---

## API Endpoints

Base URL: `http://localhost:3000/api`

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | No | Login → JWT token |
| `GET` | `/auth/me` | Yes | Current user profile |

### Posts (Publications)

| Method | Endpoint | Auth | Min Role | Description |
|---|---|---|---|---|
| `GET` | `/posts` | No | — | List posts (paginated, filterable) |
| `GET` | `/posts/:id` | No | — | Get post by ID or slug |
| `POST` | `/posts` | Yes | Editor | Create post |
| `PUT` | `/posts/:id` | Yes | Editor | Update post |
| `DELETE` | `/posts/:id` | Yes | Admin | Delete post |

### Media

| Method | Endpoint | Auth | Min Role | Description |
|---|---|---|---|---|
| `GET` | `/media` | No | — | List media (filterable by category) |
| `POST` | `/media/upload` | Yes | Editor | Upload file (multipart) |
| `DELETE` | `/media/:id` | Yes | Admin | Delete media |

### Slides (Diaporamas)

| Method | Endpoint | Auth | Min Role | Description |
|---|---|---|---|---|
| `GET` | `/slides` | No | — | List active slides (filterable by type) |
| `POST` | `/slides` | Yes | Admin | Create slide |
| `PUT` | `/slides/reorder` | Yes | Admin | Reorder slides |
| `PUT` | `/slides/:id` | Yes | Admin | Update slide |
| `DELETE` | `/slides/:id` | Yes | Admin | Delete slide |

### Causes

| Method | Endpoint | Auth | Min Role | Description |
|---|---|---|---|---|
| `GET` | `/causes` | No | — | List all causes |
| `GET` | `/causes/:slug` | No | — | Get cause by slug |
| `PUT` | `/causes/:id` | Yes | Admin | Update cause |

### Testimonials

| Method | Endpoint | Auth | Min Role | Description |
|---|---|---|---|---|
| `GET` | `/testimonials` | No | — | List testimonials (paginated, filterable) |
| `POST` | `/testimonials` | Yes | Editor | Create testimonial |
| `PUT` | `/testimonials/:id` | Yes | Editor | Update testimonial |
| `DELETE` | `/testimonials/:id` | Yes | Admin | Delete testimonial |

### News

| Method | Endpoint | Auth | Min Role | Description |
|---|---|---|---|---|
| `GET` | `/news` | No | — | List news (paginated, filterable) |
| `GET` | `/news/:slug` | No | — | Get article by slug |
| `POST` | `/news` | Yes | Editor | Create article |
| `PUT` | `/news/:id` | Yes | Editor | Update article |
| `DELETE` | `/news/:id` | Yes | Admin | Delete article |

### Donations

| Method | Endpoint | Auth | Min Role | Description |
|---|---|---|---|---|
| `GET` | `/donations` | Yes | Finance | List donations (paginated, filterable) |
| `GET` | `/donations/stats` | Yes | Finance | Aggregate donation statistics |
| `POST` | `/donations` | No | — | Create a donation |

### Settings

| Method | Endpoint | Auth | Min Role | Description |
|---|---|---|---|---|
| `GET` | `/settings` | No | — | Get settings (public subset or full for admins) |
| `PUT` | `/settings` | Yes | Admin | Update settings |

### Users

| Method | Endpoint | Auth | Min Role | Description |
|---|---|---|---|---|
| `GET` | `/users` | Yes | Admin | List all users |
| `POST` | `/users` | Yes | Super Admin | Create user |
| `PUT` | `/users/:id` | Yes | Admin | Update user |
| `DELETE` | `/users/:id` | Yes | Super Admin | Delete user |

### Webhooks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/webhooks/stripe` | Signature | Stripe event handler |
| `POST` | `/webhooks/flutterwave` | Signature | Flutterwave event handler |
| `POST` | `/webhooks/paystack` | Signature | Paystack event handler |

### Health Check

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | Server status + demo mode flag |

---

## Payment Architecture

HumanitAID uses a **Payment Orchestrator** pattern to support multiple providers:

```
Donor → Frontend Form → Backend /api/donations → Payment Service → Provider API
                                                            ↓
                              Webhook ← Provider ← Payment Confirmation
```

### Supported Providers

| Provider | Methods | Status | Use Case |
|---|---|---|---|
| **Stripe** | Credit/Debit cards, Apple Pay, Google Pay | Architecture ready | International donors |
| **Flutterwave** | Mobile Money (M-Pesa, Airtel, MTN) | Architecture ready | African donors |
| **Paystack** | Mobile Money, Bank transfer | Architecture ready | West/Central Africa |

### Donation Flow

1. Donor fills form on frontend (amount, cause, name, email, message)
2. Backend creates donation record with status `pending`
3. Payment service initiates transaction with the chosen provider
4. Provider confirms payment via webhook
5. Backend updates donation status to `completed`
6. Cause `collected` amount is updated

### Currencies Supported

USD, EUR, GBP, CAD, CDF (Congolese Franc)

---

## Database

PostgreSQL with **16 tables**:

| Table | Purpose |
|---|---|
| `users` | Platform admins, editors, finance staff |
| `categories` | Reusable taxonomy (posts, news, media, testimonials) |
| `posts` | Blog articles, field reports, editorial content |
| `media` | Uploaded images, videos, documents |
| `slides` | Hero banners and field-story carousel items |
| `causes` | Fundraising campaigns with goals and progress |
| `testimonials` | Beneficiary, volunteer, donor, partner stories |
| `news` | News articles, alerts, reports, advocacy |
| `donations` | Donation records with payment provider references |
| `payment_transactions` | Raw payment events ledger |
| `webhook_events` | Raw webhook payloads for audit and replay |
| `impact_metrics` | Quantitative humanitarian impact data |
| `partners` | Institutional, NGO, corporate, government partners |
| `audit_logs` | Immutable audit trail for sensitive operations |
| `settings` | Key-value application configuration |
| `newsletter_subscribers` | Email list with double opt-in |

### Schema Features

- UUID primary keys (pgcrypto)
- Enum types for roles, statuses, providers
- Automatic `updated_at` triggers
- Comprehensive indexes for query performance
- JSONB fields for flexible metadata
- Foreign key constraints with cascade/set null
- Seed data: admin user, default causes, categories, settings, impact metrics

### Roles (RBAC)

| Role | Level | Permissions |
|---|---|---|
| `viewer` | 0 | Read-only access |
| `finance` | 1 | View donations and statistics |
| `editor` | 2 | Create/edit posts, news, media, testimonials |
| `admin` | 3 | Full CMS access, slide management, settings |
| `super_admin` | 4 | User management, system admin |

---

## Security

| Feature | Implementation |
|---|---|
| **Authentication** | JWT tokens (7-day expiry), bcrypt password hashing (12 rounds) |
| **RBAC** | 5-role hierarchy (viewer → super_admin), middleware-enforced |
| **Rate Limiting** | Auth: 5 req/15min, General: 100 req/15min |
| **Security Headers** | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| **File Uploads** | Multer validation, Sharp processing, size limits |
| **CORS** | Configurable origin, credentials support |
| **Demo Mode** | No database required, hardcoded mock data |
| **Audit Logging** | Immutable trail of all create/update/delete operations |
| **Webhook Verification** | Stripe signature, Flutterwave/Paystack verification |
| **Input Validation** | Parameterized SQL queries (no injection) |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | `dev-secret-change-me` | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `DEMO_MODE` | `true` | Enable/disable demo mode |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed CORS origin |
| `STRIPE_SECRET_KEY` | — | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | — | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | — | Stripe webhook signing secret |
| `FLUTTERWAVE_SECRET_KEY` | — | Flutterwave secret key |
| `FLUTTERWAVE_PUBLIC_KEY` | — | Flutterwave public key |
| `PAYSTACK_SECRET_KEY` | — | Paystack secret key |
| `PAYSTACK_PUBLIC_KEY` | — | Paystack public key |
| `EMAIL_API_KEY` | — | Email service API key (optional) |
| `EMAIL_FROM` | `noreply@humanit-aid.org` | Sender email address |
| `STORAGE_PROVIDER` | `local` | Storage backend (local / s3 / r2) |
| `STORAGE_BUCKET` | — | Storage bucket name |
| `STORAGE_ACCESS_KEY` | — | Storage access key |
| `STORAGE_SECRET_KEY` | — | Storage secret key |
| `STORAGE_URL` | — | Storage public URL |
| `ADMIN_DEFAULT_EMAIL` | `admin@humanit-aid.org` | Default admin email |
| `ADMIN_DEFAULT_PASSWORD` | `changeme123` | Default admin password |

---

## Development

### Project Commands

```bash
npm run dev          # Start backend with hot-reload (node --watch)
npm start            # Start backend in production mode
npm run build        # No-op (static site, no build step)
npm run lint         # No-op (no linter configured yet)
```

### Adding a New API Route

1. Create `backend/routes/newfeature.js`
2. Import in `backend/server.js` and mount: `app.use('/api/newfeature', newFeatureRoutes)`
3. Add constants to `shared/constants.js` if needed
4. Add database table to `database/schema.sql`

### Adding a New Frontend Section

1. Add HTML to `frontend/index.html`
2. Add styles to `frontend/css/sections.css` or create a new file in `frontend/css/`
3. Add JS to `frontend/js/app.js` or create a new file in `frontend/js/`
4. Use CSS variables from `frontend/css/variables.css`

### Code Conventions

- **Language**: All user-facing text is in French (`lang="fr"`)
- **Colors**: Use CSS custom properties (`--rouge`, `--or`, `--noir`), never hardcoded hex
- **Fonts**: Playfair Display (headings), Crimson Pro (body), Space Mono (labels)
- **JS**: Vanilla only — no frameworks, no bundler
- **Backend**: Express.js with async/await, parameterized SQL queries
- **Naming**: kebab-case for files, camelCase for JS variables

### CI/CD Pipeline

GitHub Actions runs on push/PR to `main`:

1. **Lint** — JavaScript syntax check (`node -c`) on all `.js` files
2. **HTML validity** — checks for `<!DOCTYPE html>` in key files
3. **Backend verification** — starts server in demo mode, hits health endpoints
4. **Security scan** — checks for hardcoded secrets
5. **Build check** — confirms no build step needed (static site)

---

## Deployment

| Component | Recommended Services |
|---|---|
| **Frontend** | Vercel, Netlify, Cloudflare Pages |
| **Admin** | Same as frontend (static SPA) |
| **Backend** | Railway, Render, Google Cloud Run, Fly.io |
| **Database** | Supabase, Railway, Neon, AWS RDS |
| **Storage** | AWS S3, Cloudflare R2, Supabase Storage |

### Vercel / Netlify (Frontend + Admin)

```bash
# Just deploy the static directories
# frontend/ → humanit-aid.org
# admin/ → admin.humanit-aid.org
```

### Railway / Render (Backend)

```bash
# Set environment variables in the dashboard
# Point to your PostgreSQL database
# Deploy from the backend/ directory
```

### Environment Setup

```bash
# 1. Create .env from template
cp .env.example .env

# 2. Set DEMO_MODE=false for production
# 3. Configure real Stripe/Flutterwave/Paystack keys
# 4. Set DATABASE_URL to your PostgreSQL instance
# 5. Set CORS_ORIGIN to your frontend domain
# 6. Change JWT_SECRET to a strong random value
# 7. Change ADMIN_DEFAULT_PASSWORD
```

---

## Roadmap

| Phase | Feature | Status |
|---|---|---|
| **Phase 1** | CMS Admin panel with full CRUD | ✅ Complete |
| **Phase 2** | Dynamic frontend (API-driven content) | ✅ Complete |
| **Phase 3** | Stripe integration (cards, Apple Pay, Google Pay) | 🚧 Architecture ready |
| **Phase 4** | Mobile Money (Flutterwave + Paystack) | 🚧 Architecture ready |
| **Phase 5** | Email system (receipts, newsletters) | 📋 Planned |
| **Phase 6** | Analytics dashboard (donation trends, impact) | 📋 Planned |
| **Phase 7** | Internationalization (FR / EN / SW) | 📋 Planned |
| **Phase 8** | Automated tests (unit + integration) | 📋 Planned |
| **Phase 9** | Mobile app (React Native / Flutter) | 💡 Future |

---

## License

Proprietary — **HumanitAID Foundation**. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

---

<p align="center">
  <strong>HumanitAID Foundation</strong><br>
  <em>Ensemble pour les oubliés du monde</em><br>
  Goma, Nord-Kivu, République Démocratique du Congo<br>
  <a href="mailto:contact@humanit-aid.org">contact@humanit-aid.org</a>
</p>
