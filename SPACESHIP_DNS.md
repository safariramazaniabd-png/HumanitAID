# Spaceship DNS Configuration — HumanitAID

## Prerequisites

Before configuring DNS, you must have:

1. **Domain purchased** on Spaceship: `humanit-aid.org`
2. **Hosting platform selected** (Recommended: Render.com)
3. **IP address or CNAME** from your hosting provider

---

## DNS Records to Create

Log in to [Spaceship](https://spaceship.com) → My Domains → `humanit-aid.org` → DNS Management.

### Record 1: Root Domain (A Record)

| Type | Host | Value | TTL |
|---|---|---|---|
| A | @ | `<YOUR_RENDER_IP>` | 3600 |

> Get your Render IP from: Render Dashboard → Web Service → Settings → Domains

### Record 2: WWW Subdomain (CNAME)

| Type | Host | Value | TTL |
|---|---|---|---|
| CNAME | www | `humanitaid.onrender.com` | 3600 |

> Replace `humanitaid.onrender.com` with your actual Render URL

### Record 3: Apex Domain Redirect (Optional)

If Spaceship supports URL forwarding, add:

| Type | Host | Value | TTL |
|---|---|---|---|
| URL | @ | `https://www.humanit-aid.org` | 3600 |

### Record 4: Email (Optional — for future)

| Type | Host | Value | TTL |
|---|---|---|---|
| MX | @ | `mx1.spaceship.net` | 3600 |
| TXT | @ | `v=spf1 include:sendgrid.net ~all` | 3600 |

---

## Complete DNS Record Table

| Type | Host | Value | TTL | Purpose |
|---|---|---|---|---|
| A | @ | `<RENDER_IP>` | 3600 | Root domain → Render |
| CNAME | www | `humanitaid.onrender.com` | 3600 | WWW → Render |
| TXT | @ | `v=spf1 include:sendgrid.net ~all` | 3600 | Email sending (optional) |

---

## How to Find Your Render IP

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click on your Web Service
3. Go to **Settings** → **Domains / Certificates**
4. Click **Custom Domains** → **Add Custom Domain**
5. Enter `humanit-aid.org`
6. Render will show you the IP address to point to

---

## DNS Propagation

After creating records:

1. **Wait 15 minutes** for initial propagation
2. **Full propagation**: 24-48 hours
3. **Check status**: Visit https://dnschecker.org
4. **Test resolution**:
   ```bash
   dig humanit-aid.org
   dig www.humanit-aid.org
   ```

---

## SSL/TLS Certificate

Render provides **automatic SSL certificates** via Let's Encrypt:

1. After DNS propagates, Render auto-provisions SSL
2. Visit `https://humanit-aid.org` to verify
3. Certificate renews automatically every 90 days

**If SSL doesn't work:**
1. Verify DNS records are correct
2. Wait for full propagation
3. In Render Dashboard → Settings → Domains → click "Renew Certificate"

---

## Redirect www to non-www (or vice versa)

### Option A: www → non-www (Recommended)

In Render Dashboard:
1. Go to Settings → Domains
2. Add both `humanit-aid.org` and `www.humanit-aid.org`
3. Set `humanit-aid.org` as primary
4. Render auto-redirects www to non-www

### Option B: non-www → www

Same process but set `www.humanit-aid.org` as primary.

---

## Verifying Configuration

### Check DNS Resolution

```bash
# Root domain
dig humanit-aid.org +short
# Should return your Render IP

# WWW subdomain
dig www.humanit-aid.org +short
# Should return Render's CNAME target

# SSL certificate
curl -I https://humanit-aid.org
# Should return HTTP/2 200 with HSTS headers
```

### Check Redirect

```bash
# If www is primary:
curl -I http://humanit-aid.org
# Should return 301 → https://www.humanit-aid.org

# If non-www is primary:
curl -I http://www.humanit-aid.org
# Should return 301 → https://humanit-aid.org
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| DNS not resolving | Wait 48 hours, verify records in Spaceship |
| SSL certificate error | Ensure DNS is propagated, click "Renew" in Render |
| www doesn't work | Check CNAME record, ensure it points to Render URL |
| Root domain 404 | Check A record points to correct Render IP |
| Mixed content warnings | Ensure all resources use HTTPS |

---

## Post-Configuration

After DNS is working:

1. Update `CORS_ORIGIN` in `.env.production` to include both domains
2. Update `SITE_URL` to `https://www.humanit-aid.org`
3. Update `ADMIN_URL` to `https://humanit-aid.org/admin`
4. Redeploy the application
5. Test all functionality
