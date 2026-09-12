/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   POST /api/donations/checkout

   Crée une session Stripe Checkout (mode TEST uniquement)
   et la renvoie au frontend pour redirection.

   Variables d'environnement (Vercel Dashboard) :
     STRIPE_SECRET_KEY       (private)  — clé TEST sk_test_...
     STRIPE_PUBLISHABLE_KEY  (public)   — non obligatoire pour l'API
     DATABASE_URL            (private)  — Postgres/Supabase, optionnel
                                          (enregistre le don 'pending' avant redirection)
     SITE_URL                (public)   — origine de retour (ex: https://www.humanit-aid.org). Par défaut
                                          https://www.humanit-aid.org. L'origine frontend n'est acceptée
                                          que si elle appartient aux domaines autorisés.

   Sécurité :
     - Aucun secret exposé côté client.
     - Les clés sk_live_ sont refusées (point 4 = TEST uniquement).
     - Montant/devise/cause validés côté serveur.
     - Redirection de retour limitée aux domaines autorisés (anti open-redirect).
     - Les clés Stripe sont masquées dans les logs et les erreurs.
   ═══════════════════════════════════════════════════════════ */

const Stripe = require('stripe');
const { redact, buildPgOptions, resolveReturnOrigin } = require('../_shared');

const ALLOWED_CURRENCIES = ['EUR', 'USD', 'CDF', 'GBP', 'CAD'];
const ALLOWED_METHODS = ['stripe', 'flutterwave', 'paystack', 'wire'];
const CAUSE_SLUGS = ['deplaces', 'orphelins', 'veuves', 'victimes', 'handicapes', 'toutes', ''];
const CAUSE_LABELS = {
  deplaces: 'Déplacés & Réfugiés de guerre',
  orphelins: 'Enfants orphelins en zones de conflit',
  veuves: 'Veuves & Femmes survivantes de violences',
  victimes: 'Victimes de violences armées',
  handicapes: 'Personnes handicapées en zones de guerre',
};
const MAX_AMOUNT = 1000000;

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

function assertTestMode(secretKey) {
  if (!secretKey) {
    throw httpError(503, 'Les paiements en ligne sont temporairement indisponibles.', 'STRIPE_NOT_CONFIGURED');
  }
  if (/^sk_live_/i.test(secretKey)) {
    throw httpError(503, 'Les paiements Stripe live sont désactivés. Veuillez réessayer plus tard.', 'STRIPE_LIVE_NOT_ALLOWED');
  }
}

function toMinorUnits(amount) {
  const n = Number(amount);
  if (!isFinite(n) || n < 1) throw httpError(400, 'Montant invalide', 'INVALID_AMOUNT');
  return Math.round(n * 100);
}

function causeLabel(cause) {
  if (!cause || !CAUSE_LABELS[cause]) return 'Soutien humanitaire — HumanitAID Foundation';
  return CAUSE_LABELS[cause];
}

function validate(body) {
  const errors = [];
  const { donor_name, email, amount, currency, method, cause } = body || {};

  if (!donor_name || sanitize(donor_name).length < 2) {
    errors.push('Nom requis (min 2 caractères)');
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

  if (cause !== undefined && cause !== null && !CAUSE_SLUGS.includes(cause)) {
    errors.push('Cause non reconnue');
  }

  return errors;
}

async function recordPendingDonation({ publicReference, donorName, email, amount, currency, cause, metadata, sessionId }) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));
    const insertMeta = metadata && metadata.message ? { message: metadata.message } : {};
    const result = await pool.query(
      `INSERT INTO donations (public_reference, donor_name, donor_email, amount, currency, cause_slug, payment_method, provider, status, provider_transaction_id, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,'stripe','stripe','pending',$7,$8) RETURNING id`,
      [publicReference, donorName, email, amount, currency, cause || null, sessionId || null, insertMeta]
    );
    return result.rows[0] ? result.rows[0].id : null;
  } catch (err) {
    console.error("[donations/checkout] Enregistrement 'pending' ignoré:", redact(err && err.message ? err.message : err));
    return null;
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}

module.exports = async function checkout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const body = req.body || {};
  const errors = validate(body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Données invalides', details: errors });
  }

  const { donor_name, email, amount, currency = 'USD', cause, reference, message } = body;
  const publicReference = reference || `HAD-${Date.now()}`;
  const origin = resolveReturnOrigin(req);
  const successUrl = `${origin}?donation=success&ref=${encodeURIComponent(publicReference)}&amount=${amount}`;
  const cancelUrl = `${origin}?donation=cancelled`;

  let stripe;
  try {
    assertTestMode(process.env.STRIPE_SECRET_KEY);
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'fr',
      client_reference_id: String(publicReference),
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: toMinorUnits(amount),
            product_data: {
              name: `Don — ${causeLabel(cause)}`,
              description: 'Don ponctuel à la Fondation HumanitAID — Aide humanitaire en RDC.',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        public_reference: String(publicReference),
        cause: cause || '',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    await recordPendingDonation({
      publicReference,
      donorName: donor_name,
      email,
      amount,
      currency,
      cause,
      metadata: message ? { message } : null,
      sessionId: session.id,
    });

    return res.status(200).json({ url: session.url, reference: publicReference, demo: false });
  } catch (err) {
    if (err && err.status) {
      console.error('[donations/checkout] Refusé:', redact(err.message));
      return res.status(err.status).json({ error: err.message });
    }
    const safeMsg = redact(err && err.message ? err.message : err);
    console.error('[donations/checkout] Erreur:', safeMsg);
    return res.status(500).json({ error: 'Le paiement n\'a pas pu être initié. Veuillez réessayer.' });
  }
};