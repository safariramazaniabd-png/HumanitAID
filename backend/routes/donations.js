const express = require('express');
const env = require('../config/env');
const auth = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { query } = require('../config/database');
const { ROLES, PAYMENT_STATUS } = require('../../shared/constants');
const { validateDonation, validationMiddleware, sanitize } = require('../middleware/validation');
const stripeService = require('../services/stripeService');

const router = express.Router();

const DEMO_STATS = {
  total: 1036000,
  today: 4200,
  month: 87500,
  count: 1247,
  average: 831,
  displaced: 7200000,
  orphans: 2100000,
};

const DEMO_DONATIONS = [
  { id: '40000001-0000-4000-c000-000000000001', donor_name: 'Sophie Laurent', email: 'sophie.laurent@email.com', amount: 50, currency: 'EUR', method: 'stripe', status: PAYMENT_STATUS.COMPLETED, cause: 'orphelins', message: 'Pour les enfants de Goma.', created_at: '2026-09-03T14:22:00Z' },
  { id: '40000002-0000-4000-c000-000000000002', donor_name: 'Pierre Dupont', email: 'pierre.dupont@email.com', amount: 100, currency: 'USD', method: 'flutterwave', status: PAYMENT_STATUS.COMPLETED, cause: 'deplaces', message: '', created_at: '2026-09-03T11:45:00Z' },
  { id: '40000003-0000-4000-c000-000000000003', donor_name: 'Anonyme', email: 'anonyme@email.com', amount: 25, currency: 'USD', method: 'paystack', status: PAYMENT_STATUS.COMPLETED, cause: 'veuves', message: 'Bon courage à toute l\'équipe.', created_at: '2026-09-02T19:10:00Z' },
  { id: '40000004-0000-4000-c000-000000000004', donor_name: 'Marie-Claire Dupuis', email: 'mc.dupuis@email.com', amount: 200, currency: 'EUR', method: 'stripe', status: PAYMENT_STATUS.COMPLETED, cause: 'victimes', message: 'Soutien total aux victimes de violences.', created_at: '2026-09-02T08:30:00Z' },
  { id: '40000005-0000-4000-c000-000000000005', donor_name: 'Jean Tremblay', email: 'jean.tremblay@email.com', amount: 500, currency: 'CAD', method: 'stripe', status: PAYMENT_STATUS.COMPLETED, cause: 'handicapes', message: '', created_at: '2026-09-01T15:00:00Z' },
  { id: '40000006-0000-4000-c000-000000000006', donor_name: 'Fatima Ben Ali', email: 'fatima.ba@email.com', amount: 75, currency: 'USD', method: 'flutterwave', status: PAYMENT_STATUS.PENDING, cause: 'deplaces', message: 'Pour les familles déplacées.', created_at: '2026-09-01T10:00:00Z' },
];

router.get('/', auth, requireMinRole(ROLES.FINANCE), async (req, res) => {
  if (env.demoMode) {
    let donations = [...DEMO_DONATIONS];
    const { status, method, page = 1, limit = 20 } = req.query;
    if (status) donations = donations.filter((d) => d.status === status);
    if (method) donations = donations.filter((d) => d.method === method);
    const start = (page - 1) * limit;
    return res.json({ donations: donations.slice(start, start + Number(limit)), total: donations.length, page: Number(page), limit: Number(limit) });
  }

  try {
    const { status, method, page = 1, limit = 20 } = req.query;
    let where = [];
    let params = [];
    let idx = 1;
    if (status) { where.push(`status = $${idx++}`); params.push(status); }
    if (method) { where.push(`payment_method = $${idx++}`); params.push(method); }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (page - 1) * limit;
    const countRes = await query(`SELECT COUNT(*) FROM donations ${whereClause}`, params);
    const { rows } = await query(`SELECT * FROM donations ${whereClause} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`, [...params, Number(limit), offset]);
    return res.json({ donations: rows, total: Number(countRes.rows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[Donations] List error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/stats', async (req, res) => {
  if (env.demoMode) {
    return res.json(DEMO_STATS);
  }

  try {
    const stats = {};
    const totalRes = await query("SELECT COALESCE(SUM(amount), 0) AS total FROM donations WHERE status = 'completed'");
    stats.total = Number(totalRes.rows[0].total);
    const todayRes = await query("SELECT COALESCE(SUM(amount), 0) AS today FROM donations WHERE status = 'completed' AND created_at >= CURRENT_DATE");
    stats.today = Number(todayRes.rows[0].today);
    const monthRes = await query("SELECT COALESCE(SUM(amount), 0) AS month FROM donations WHERE status = 'completed' AND created_at >= DATE_TRUNC('month', NOW())");
    stats.month = Number(monthRes.rows[0].month);
    const countRes = await query("SELECT COUNT(*) AS count FROM donations");
    stats.count = Number(countRes.rows[0].count);
    stats.average = stats.count > 0 ? Math.round(stats.total / stats.count) : 0;
    return res.json(stats);
  } catch (err) {
    console.error('[Donations] Stats error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/checkout', validationMiddleware(validateDonation), async (req, res) => {
  const { donor_name, email, amount, currency = 'USD', cause, reference, message } = req.body;
  const publicReference = reference || `HAD-${Date.now()}`;
  const successUrl = `${env.siteUrl}?donation=success&ref=${encodeURIComponent(publicReference)}&amount=${amount}`;
  const cancelUrl = `${env.siteUrl}?donation=cancelled`;

  if (env.demoMode || !env.stripe.secretKey) {
    try {
      const session = await stripeService.createCheckoutSession({
        amount,
        currency,
        donorEmail: email,
        cause,
        publicReference,
        successUrl,
        cancelUrl,
      });
      const url = session.url.includes('?') ? `${session.url}&demo=1` : `${session.url}?demo=1`;
      console.log('[Donations] Checkout (démo):', publicReference);
      return res.json({ url, reference: publicReference, demo: true, message: 'Redirect Stripe (mode démo).' });
    } catch (err) {
      console.error('[Donations] Checkout demo error:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  try {
    const meta = { ...(message ? { message } : {}) };
    const insert = await query(
      `INSERT INTO donations (public_reference, donor_name, donor_email, amount, currency, cause_slug, payment_method, provider, status, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,'stripe','stripe',$7,$8) RETURNING *`,
      [publicReference, donor_name, email, amount, currency, cause || null, PAYMENT_STATUS.PENDING, meta]
    );

    const session = await stripeService.createCheckoutSession({
      amount,
      currency,
      donorEmail: email,
      cause,
      publicReference,
      successUrl,
      cancelUrl,
    });

    await query('UPDATE donations SET provider_transaction_id = $2 WHERE id = $1', [insert.rows[0].id, session.id]);

    return res.json({ url: session.url, reference: publicReference, demo: false });
  } catch (err) {
    console.error('[Donations] Checkout error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', validationMiddleware(validateDonation), async (req, res) => {
  if (env.demoMode) {
    return res.json({
      donation: {
        id: '40000007-0000-4000-c000-000000000007',
        ...req.body,
        status: PAYMENT_STATUS.PENDING,
        created_at: new Date().toISOString(),
      },
      demo: true,
      message: 'Don enregistré avec succès (mode démo).',
    });
  }

  try {
    const { donor_name, email, amount, currency, method, cause, reference, provider, message } = req.body;
    const PROVIDER_ENUM = ['stripe', 'flutterwave', 'paystack'];
    const meta = { ...(message ? { message } : {}) };
    let providerColumn = null;
    if (provider && PROVIDER_ENUM.includes(provider)) {
      providerColumn = provider;
    } else if (provider) {
      meta.mobile_provider = provider;
    }
    const { rows } = await query(
      `INSERT INTO donations (public_reference, donor_name, donor_email, amount, currency, cause_slug, payment_method, provider, status, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        reference || `HAD-${Date.now()}`,
        donor_name,
        email,
        amount,
        currency,
        cause || null,
        method,
        providerColumn,
        PAYMENT_STATUS.PENDING,
        meta,
      ]
    );
    return res.status(201).json({ donation: rows[0], message: 'Don enregistré. En attente de confirmation de paiement.' });
  } catch (err) {
    console.error('[Donations] Create error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
