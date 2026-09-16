/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   POST /api/donations

   Enregistre une donation 'pending' pour les méthodes
   sans redirection Stripe (Mobile Money, virement) et toutes
   les autres méthodes d'annonce de don. Le webhook officiel
   (POST /api/webhooks/stripe) reste seul autorisé à marquer
   un don 'completed'. Jamais de double traitement.

   Variables d'environnement (Vercel Dashboard) :
     DATABASE_URL  (private) — Postgres/Supabase, requis.

   Sécurité :
     - Allowlist stricte : seuls donor_name, email, amount,
       currency, method, cause, message, provider sont acceptés.
       Aucun champ financier client (status,
       provider_transaction_id, receipt_url, reference, id).
     - Montant/devise/cause/méthode validés côté serveur.
     - Clé Stripe jamais utilisée ici : TEST uniquement du côté
       de donations/checkout et du webhook.
   ═══════════════════════════════════════════════════════════ */

const { buildPgOptions } = require('../_shared');

const ALLOWED_CURRENCIES = ['EUR', 'USD', 'CDF', 'GBP', 'CAD'];
const ALLOWED_METHODS = ['stripe', 'flutterwave', 'paystack', 'wire', 'mpesa', 'airtel', 'orange', 'wave'];
const MOBILE_PROVIDERS = ['mpesa', 'airtel', 'orange', 'wave'];
const METHOD_PROVIDER = { stripe: 'stripe', flutterwave: 'flutterwave', paystack: 'paystack' };
const CAUSE_SLUGS = ['deplaces', 'orphelins', 'veuves', 'victimes', 'handicapes', 'toutes', ''];
const MAX_AMOUNT = 1000000;
const MAX_NAME = 200;
const MAX_MESSAGE = 2000;

function sanitize(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function httpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function validate(body) {
  const errors = [];
  const { donor_name, email, amount, currency, method, cause, provider, message } = body || {};

  const name = sanitize(donor_name);
  if (!name || name.length < 2) {
    errors.push('Nom requis (min 2 caractères)');
  } else if (name.length > MAX_NAME) {
    errors.push(`Nom trop long (max ${MAX_NAME} caractères)`);
  }
  if (!email || !isValidEmail(email)) {
    errors.push('Email invalide');
  }
  const n = Number(amount);
  const isAmountValid =
    amount !== undefined && amount !== null && amount !== '' &&
    typeof amount !== 'boolean' && isFinite(n) && n >= 1 && n <= MAX_AMOUNT;
  if (!isAmountValid) {
    errors.push(`Montant invalide (min 1, max ${MAX_AMOUNT.toLocaleString('fr-FR')})`);
  } else if ((String(amount).split('.')[1] || '').length > 2) {
    errors.push('Montant invalide (max 2 décimales)');
  }
  if (currency && !ALLOWED_CURRENCIES.includes(currency)) {
    errors.push('Devise non supportée');
  }
  if (method && !ALLOWED_METHODS.includes(method)) {
    errors.push('Méthode de paiement non supportée');
  }
  if (provider && !MOBILE_PROVIDERS.includes(provider)) {
    errors.push('Fournisseur Mobile Money non supporté');
  }
  if (cause !== undefined && cause !== null && !CAUSE_SLUGS.includes(cause)) {
    errors.push('Cause non reconnue');
  }
  if (message && sanitize(message).length > MAX_MESSAGE) {
    errors.push(`Message trop long (max ${MAX_MESSAGE} caractères)`);
  }
  return errors;
}

module.exports = async function createDonation(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const errors = validate(req.body || {});
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Données invalides', details: errors });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[donations] DATABASE_URL manquant — enregistrement refusé');
    return res.status(503).json({ error: 'L\'enregistrement des dons est temporairement indisponible.' });
  }

  const { donor_name, email, amount, currency = 'USD', method, cause, message, provider } = req.body;
  const reference = `HAD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const meta = { ...(message ? { message } : {}) };

  let providerColumn = null;
  if (METHOD_PROVIDER[method]) {
    providerColumn = METHOD_PROVIDER[method];
  } else if (method === 'wire') {
    providerColumn = null;
  } else if (MOBILE_PROVIDERS.includes(provider)) {
    meta.mobile_provider = provider;
  }

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));
    const { rows } = await pool.query(
      `INSERT INTO donations (public_reference, donor_name, donor_email, amount, currency, cause_slug, payment_method, provider, status, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        reference,
        sanitize(donor_name),
        email,
        amount,
        currency,
        cause || null,
        method,
        providerColumn,
        'pending',
        meta,
      ]
    );
    const donation = rows[0] || {};
    return res.status(201).json({
      donation: { ...donation, reference },
      message: 'Don enregistré. En attente de confirmation de paiement.',
    });
  } catch (err) {
    console.error('[donations] Create error:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'L\'enregistrement du don a échoué. Veuillez réessayer.' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};