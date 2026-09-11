# Deployment Guide — HumanitAID

## Recommended Architecture

```
User Browser
    ↓
humanitaid.org (DNS → Spaceship)
    ↓
Render.com (Web Service — single Node.js process)
    ├── Frontend (static files served by Express)
    ├── Backend API (/api/*)
    └── Admin Panel (/admin)
    ↓
PostgreSQL (Render Managed Database or Supabase)
    ↓
Stripe / Flutterwave / Paystack (Payment Providers)
```

**Why Render?**
- Single platform for frontend + backend (no separate hosting needed)
- Native Node.js support with `render.yaml`
- Managed PostgreSQL included
- Free tier available for testing
- Automatic SSL certificates
- Git-based deployment (push to deploy)

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
3. Set `STRIPE_SECRET_KEY` (starts with `sk_live_`)
4. Set `STRIPE_PUBLISHABLE_KEY` (starts with `pk_live_`)
5. Create webhook endpoint:
   - URL: `https://humanitaid.org/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
6. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Step 5: Deploy to Render

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
2. Navigate to DNS Management for `humanitaid.org`
3. Add DNS records (see SPACESHIP_DNS.md)
4. Wait for DNS propagation (1-48 hours)
5. Verify with: `dig humanitaid.org`

## Step 7: Verify SSL

1. After DNS propagates, visit `https://humanitaid.org`
2. SSL certificate should be auto-provisioned by Render
3. Verify with: `curl -I https://humanitaid.org`

## Step 8: Run Database Migrations

```bash
# If using Render, connect to your database and run schema.sql
# Or use the Render shell to run:
psql $DATABASE_URL < database/schema.sql
```

## Step 9: Create Admin User

```bash
# Connect to your database and insert the admin user
psql $DATABASE_UUID << 'SQL'
INSERT INTO users (email, name, password_hash, role)
VALUES (
  'admin@humanitaid.org',
  'Admin HumanitAID',
  '$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YOUR_STRONG_PASSWORD', 12))")',
  'super_admin'
)
ON CONFLICT (email) DO NOTHING;
SQL
```

## Step 10: Test Everything

1. Visit `https://humanitaid.org` — homepage loads
2. Visit `https://humanitaid.org/admin` — admin login works
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
| `CORS_ORIGIN` | Yes | `https://www.humanitaid.org` |
| `SITE_URL` | Yes | `https://www.humanitaid.org` |
| `STRIPE_SECRET_KEY` | Yes | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Yes | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_...` |
| `EMAIL_API_KEY` | Recommended | `SG...` |
| `EMAIL_FROM` | Recommended | `noreply@humanitaid.org` |
