# Production Checklist — HumanitAID

## Before Deployment

### Environment & Secrets
- [ ] `.env.production` created from `.env.example`
- [ ] `NODE_ENV=production`
- [ ] `DEMO_MODE=false`
- [ ] `JWT_SECRET` = 64-char random hex (not the dev fallback)
- [ ] `DATABASE_URL` points to production PostgreSQL (with `sslmode=require`)
- [ ] `CORS_ORIGIN` = `https://www.humanit-aid.org,https://humanit-aid.org`
- [ ] `SITE_URL` = `https://www.humanit-aid.org`
- [ ] `ADMIN_URL` = `https://humanit-aid.org/admin`
- [ ] No real secrets committed to git (verify with `git log -p`)

### Database
- [ ] PostgreSQL provisioned (Supabase, Railway, or Render)
- [ ] `uuid-ossp` extension enabled: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- [ ] `schema.sql` executed
- [ ] Admin user created via seed or first registration
- [ ] Connection pooling configured (PgBouncer or built-in)
- [ ] Backups enabled (daily minimum)

### Payments — Stripe
- [ ] Stripe account created and verified
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...` set
- [ ] `STRIPE_PUBLISHABLE_KEY` = `pk_live_...` set
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` set
- [ ] Webhook endpoint registered: `https://humanit-aid.org/api/webhooks/stripe`
- [ ] Webhook events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Test mode payments verified before switching to live keys

### Payments — Mobile Money (Optional)
- [ ] Flutterwave account created (if needed)
- [ ] `FLUTTERWAVE_SECRET_KEY` set
- [ ] Paystack account created (if needed)
- [ ] `PAYSTACK_SECRET_KEY` set

### Email
- [ ] Email provider configured (SendGrid / Mailgun / SMTP)
- [ ] `EMAIL_API_KEY` set
- [ ] `EMAIL_FROM` = `noreply@humanit-aid.org`
- [ ] Donation receipt emails tested
- [ ] Admin notification emails tested

### Security
- [ ] CSP headers enabled (production mode)
- [ ] HSTS enabled (production mode)
- [ ] HTTPS enforced (HSTS preload)
- [ ] Rate limiting active (auth: 20/15min, general: 200/15min)
- [ ] File upload limits enforced (10MB max)
- [ ] Input validation on all POST endpoints
- [ ] CORS restricted to production origins only
- [ ] JWT secret not hardcoded (falls back to crypto.randomBytes in dev)
- [ ] Server refuses to start if `DEMO_MODE=true` in production

### SEO & PWA
- [ ] `sitemap.xml` updated with production URLs
- [ ] `robots.txt` allows crawling
- [ ] Open Graph meta tags present
- [ ] Twitter Cards meta tags present
- [ ] JSON-LD schema present
- [ ] `manifest.webmanifest` configured
- [ ] PWA icons generated (192x192, 512x512)
- [ ] Service worker registered
- [ ] Favicon created

### Frontend
- [ ] API URL auto-detected (no hardcoded localhost)
- [ ] Theme switcher works (Light / Dark / System)
- [ ] Mobile menu works (< 900px)
- [ ] Donation form functional
- [ ] All sections load data from API
- [ ] Demo data fallback works if API is down

### Admin
- [ ] `/admin` accessible only with valid credentials
- [ ] Login calls server API (not client-side only)
- [ ] All CRUD operations functional
- [ ] File upload works
- [ ] User management with RBAC

### Infrastructure
- [ ] Domain `humanit-aid.org` configured
- [ ] DNS records set (see SPACESHIP_DNS.md)
- [ ] SSL/TLS certificate active (auto via hosting)
- [ ] Health check endpoint responding: `/api/health`
- [ ] Uptime monitoring configured
- [ ] Error tracking configured (Sentry or similar)
- [ ] Log aggregation configured

### CI/CD
- [ ] GitHub Actions workflow runs on push
- [ ] Linting passes
- [ ] Syntax checks pass
- [ ] Secret scanning passes
- [ ] Deployment pipeline configured

## Post-Deployment

- [ ] Homepage loads correctly
- [ ] All sections render with real data
- [ ] Donation flow works end-to-end (Stripe test mode)
- [ ] Admin panel accessible and functional
- [ ] Mobile responsive on real devices
- [ ] Theme switcher persists across page reloads
- [ ] Service worker caches correctly
- [ ] Health check returns 200
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] DNS propagation complete
- [ ] SSL certificate valid
- [ ] Page speed acceptable (Lighthouse > 80)
