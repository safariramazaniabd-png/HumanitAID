# Deployment Guide — HumanitAID

## Recommended Architecture

```
User Browser
    ↓
www.humanit-aid.org (DNS → Spaceship, apex redirigé vers www)
    ├── Vercel
    │     ├── Frontend (static files : frontend/)
    │     └── Serverless API (frontend/api/ : dons + webhooks Stripe)
    └── Render.com (Web Service express — admin JWT uniquement)
          ├── Backend API (/api/admin*, /api/donations, ...)
          └── Admin Panel (/admin)
    ↓
PostgreSQL (Supabase — simple hôte; pas de SDK Supabase, pas de RLS)
    ↓
Stripe (TEST) / Flutterwave / Paystack (Payment Providers)
```

**Pourquoi ce découpage?**
- Le webhook Stripe officiel est hébergé en **serverless Vercel** (`frontend/api/webhooks/stripe.js`) — aucun Render, aucune URL `BACKEND_URL` requise par le frontend.
- L'Express (Render) sert **uniquement** l'admin JWT et l'API de contenu ; son webhook `/api/webhooks/stripe` répond **410 Gone** (déplacé) pour empêcher tout double traitement.
- PostgreSQL hébergé sur Supabase : simple DSN `postgresql://…` (transaction pooler pour le serverless, `DIRECT_URL` pour les migrations).
- Clés Stripe **TEST uniquement** (`sk_test_` / `pk_test_`) tant que le go-live n'est pas validé : l'API **rejette** les clés LIVE (`assertTestMode`).

---

## Step 1: Prepare the Repository

```bash
# Clone the repository
git clone <your-repo-url> humanitaid
cd humanitaid

# Install dependencies
npm install

# Verify the project starts
npm start
# → Server runs on http://localhost:3000
```

## Step 2: Create Production Environment File

```bash
cp .env.example .env.production
```

Edit `.env.production` with your real values:

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output to JWT_SECRET in .env.production
```

**Never commit `.env.production` to git.**

## Step 3: Set Up Database

### Option A: Supabase (Recommended)
1. Create account at https://supabase.com
2. Create new project
3. Go to SQL Editor
4. Paste contents of `database/schema.sql`
5. Enable `uuid-ossp` extension
6. Copy connection string to `DATABASE_URL`

### Option B: Render Managed PostgreSQL
1. Create PostgreSQL instance in Render dashboard
2. Copy internal connection string to `DATABASE_URL`
3. Add `?sslmode=require` to the URL

### Option C: Railway
1. Create account at https://railway.app
2. Add PostgreSQL service
3. Copy connection string

## Step 4: Configure Stripe

1. Go to https://dashboard.stripe.com
2. Get API keys from Developers → API Keys
3. Set `STRIPE_SECRET_KEY` (starts with `sk_test_` — mode TEST uniquement; les clés `sk_live_` sont rejetées par l'API)
4. Set `STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)
5. Create webhook endpoint:
   - URL: `https://www.humanit-aid.org/api/webhooks/stripe`
   - Events: `checkout.session.completed` (les autres événements reçus sont ignorés)
6. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Step 5: Deploy to Render (Express — admin)

### Option A: Render Blueprint (Recommended)

1. Push code to GitHub
2. Go to https://dashboard.render.com
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will detect `render.yaml` and configure automatically
6. Add environment variables in Render dashboard (from `.env.production`)
7. Deploy

### Option B: Manual Setup

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/mo) or higher
4. Add environment variables from `.env.production`
5. Create a **Managed PostgreSQL** database
6. Add the database connection string to `DATABASE_URL`
7. Deploy

## Step 6: Configure Domain

1. Go to https://spaceship.com
2. Navigate to DNS Management for `humanit-aid.org`
3. Add DNS records (see SPACESHIP_DNS.md)
4. Wait for DNS propagation (1-48 hours)
5. Verify with: `dig humanit-aid.org`

## Step 7: Verify SSL

1. After DNS propagates, visit `https://humanit-aid.org`
2. SSL certificate should be auto-provisioned by Render
3. Verify with: `curl -I https://humanit-aid.org`

## Step 8: Run Database Migrations

```bash
# Connect to your database and apply schema, then migrations:
psql "$DATABASE_URL" < database/schema.sql
psql "$DIRECT_URL" < database/migrations/001_stripe_webhook_idempotency.sql
```

> Après `schema.sql`, **toujours** appliquer `database/migrations/001_stripe_webhook_idempotency.sql`
> (colonne `event_id` + index uniques d'idempotence). Le compte admin seed de `schema.sql`
> est désactivé : son vrai mot de passe est posé au 1er démarrage par
> `backend/services/bootstrapAdmin.js` (Phase suivante).

## Step 9: Bootstrap Admin User

Le compte admin est initialisé automatiquement au démarrage du serveur Express
(`backend/services/bootstrapAdmin.js`), plus besoin d'INSERT manuel :

1. Définir `ADMIN_DEFAULT_PASSWORD` (≥ 12 caractères, non-placeholder) dans l'environnement de production.
2. Au premier boot, si le compte seed est présent, son hash est remplacé par celui de ce mot de passe ;
   si le compte est absent, il est créé (super_admin).
3. Le serveur **refuse de démarrer** en production si `ADMIN_DEFAULT_PASSWORD` est manquant ou faible.
4. Le mot de passe n'est jamais loggé ni renvoyé par une API.

## Step 10: Test Everything

1. Visit `https://www.humanit-aid.org` — homepage loads
2. Visit `https://www.humanit-aid.org/admin` — admin login works
3. Test donation flow with Stripe test card: `4242 4242 4242 4242`
4. Check `/api/health` returns `{"status":"ok"}`
5. Test on mobile device
6. Test theme switching

## Step 11: Monitor

1. Check Render logs for errors
2. Set up uptime monitoring (UptimeRobot, BetterStack)
3. Monitor Stripe dashboard for failed payments
4. Review error tracking (Sentry recommended)

---

## Rollback Procedure

If something goes wrong:

1. **Render Dashboard** → Your Web Service → "Manual Deploy" → select previous commit
2. **Database**: If schema changes were made, restore from backup
3. **Stripe**: Revert webhook endpoint to previous URL if needed

## Environment Variables Quick Reference

| Variable | Required | Example |
|---|---|---|
| `NODE_ENV` | Yes | `production` |
| `DEMO_MODE` | Yes | `false` |
| `JWT_SECRET` | Yes | 64-char hex string |
| `DATABASE_URL` | Yes | `postgresql://...` |
| `CORS_ORIGIN` | Yes | `https://www.humanit-aid.org` |
| `SITE_URL` | Yes | `https://www.humanit-aid.org` |
| `STRIPE_SECRET_KEY` | Yes | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Yes | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_...` |
| `EMAIL_API_KEY` | Recommended | `SG...` |
| `EMAIL_FROM` | Recommended | `noreply@humanit-aid.org` |
