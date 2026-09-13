/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Webhook Stripe
   POST /api/webhooks/stripe

   Reçoit les événements Stripe (mode TEST) et confirme les dons
   dans la base (Supabase/Postgres) de façon idempotente.

   Variables d'environnement (Vercel Dashboard) :
     STRIPE_WEBHOOK_SECRET   (private)  — secret whsec_... du endpoint Vercel
     STRIPE_SECRET_KEY       (private)  — clé TEST sk_test_...
     DATABASE_URL            (private)  — Postgres/Supabase (requis ici)

   Sécurité :
     - Body RAW requis (bodyParser désactivé) pour la vérification de signature.
     - Signature vérifiée via stripe.webhooks.constructEvent.
     - Erreurs génériques côté client, détails uniquement dans les logs serveur.
     - Aucun secret ni détail de payload exposé dans les réponses.
   ═══════════════════════════════════════════════════════════ */

const Stripe = require('stripe');
const { redact, buildPgOptions } = require('../_shared');

const STATUS_COMPLETED = 'completed';

function readRawBody(req) {
  if (req.body && (Buffer.isBuffer(req.body) || typeof req.body === 'string')) {
    return Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function getDonationId(pool, reference, session) {
  const existing = await pool.query(
    'SELECT id, status FROM donations WHERE public_reference = $1',
    [reference]
  );
  if (existing.rows.length) {
    return existing.rows[0];
  }

  const sourceAmount =
    session.amount_total != null ? session.amount_total / 100 : session.amount_subtotal / 100;
  const amount = Number(sourceAmount);
  const currency = (session.currency || 'usd').toUpperCase();
  const txId = session.payment_intent || session.id || null;
  const customer = session.customer_details || {};
  const cause = (session.metadata && session.metadata.cause) || null;

  const inserted = await pool.query(
    `INSERT INTO donations
       (public_reference, provider, provider_transaction_id, amount, currency, cause_slug,
        donor_name, donor_email, frequency, status, payment_method, receipt_url, metadata)
     VALUES ($1,'stripe',$2,$3,$4,$5,$6,$7,'one_time','completed','stripe',$8,$9)
     ON CONFLICT (public_reference) DO NOTHING
     RETURNING id`,
    [reference, txId, amount, currency, cause,
     customer.name || 'Anonyme', customer.email || null, session.receipt_url || null,
     JSON.stringify({ origin: 'webhook', source: 'stripe' })]
  );
  if (inserted.rows.length) {
    return { id: inserted.rows[0].id, status: STATUS_COMPLETED };
  }
  const after = await pool.query('SELECT id, status FROM donations WHERE public_reference = $1', [reference]);
  return after.rows[0] || null;
}

async function confirmDonation(pool, donation, session) {
  const txId = session.payment_intent || session.id || null;
  const sourceAmount =
    session.amount_total != null ? session.amount_total / 100 : session.amount_subtotal / 100;
  const amount = Number(sourceAmount);
  const currency = (session.currency || 'usd').toUpperCase();

  const alreadyTx = await pool.query(
    'SELECT 1 FROM payment_transactions WHERE provider = $1 AND provider_transaction_id = $2 LIMIT 1',
    ['stripe', txId]
  );

  if (donation.status !== STATUS_COMPLETED) {
    await pool.query(
      `UPDATE donations
       SET status = $2, provider_transaction_id = $3, receipt_url = $4, completed_at = now()
       WHERE id = $1 AND status <> $2`,
      [donation.id, STATUS_COMPLETED, txId, session.receipt_url || null]
    );
  }

  if (!alreadyTx.rows.length) {
    await pool.query(
      `INSERT INTO payment_transactions
         (donation_id, provider, provider_transaction_id, amount, currency, status, provider_response)
       VALUES ($1,'stripe',$2,$3,$4,$5,$6)`,
      [donation.id, txId, amount, currency, STATUS_COMPLETED,
       JSON.stringify({ id: session.id, payment_intent: session.payment_intent, success_url: session.success_url })]
    );
  }

  return Number.isFinite(amount) ? amount : null;
}

async function handleCheckoutCompleted(pool, session) {
  const reference = (session.metadata && session.metadata.public_reference) || session.client_reference_id;
  if (!reference) {
    console.warn('[webhooks/stripe] checkout.session.completed sans référence:', session.id);
    return null;
  }

  try {
    const donation = await getDonationId(pool, reference, session);
    if (!donation) {
      throw new Error(`Don introuvable pour la référence ${reference}`);
    }
    const amount = await confirmDonation(pool, donation, session);
    console.log(`[webhooks/stripe] Don ${reference} confirmé (${amount ?? '?'} ${(session.currency || 'usd').toUpperCase()}).`);
    return reference;
  } catch (err) {
    throw new Error(`Échec de confirmation du don ${reference}: ${redact(err.message)}`);
  }
}

module.exports = async function stripeWebhook(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhooks/stripe] STRIPE_WEBHOOK_SECRET non défini.');
    return res.status(500).json({ error: 'Webhook non configuré' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Signature manquante' });
  }

  let stripe;
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_x');
  } catch (_e) {
    return res.status(500).json({ error: 'Webhook non configuré' });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error('[webhooks/stripe] Lecture du body impossible:', redact(err.message));
    return res.status(400).json({ error: 'Webhook invalide' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[webhooks/stripe] Signature invalide:', redact(err.message));
    return res.status(400).json({ error: 'Signature invalide' });
  }

  if (event.type !== 'checkout.session.completed') {
    console.log(`[webhooks/stripe] Événement ignoré (${event.type}).`);
    return res.status(200).json({ received: true });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[webhooks/stripe] DATABASE_URL non défini — impossible de confirmer les dons.');
    return res.status(500).json({ error: 'Base de données non configurée' });
  }

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));

    try {
      const already = await pool.query(
        'SELECT 1 FROM webhook_events WHERE event_id = $1 LIMIT 1',
        [event.id]
      );
      if (already.rows.length) {
        console.log(`[webhooks/stripe] Événement ${event.id} déjà traité (rejeu).`);
        return res.status(200).json({ received: true, deduplicated: true });
      }
    } catch (err) {
      console.error('[webhooks/stripe] Vérification de rejeu impossible:', redact(err.message));
    }

    try {
      await pool.query(
        `INSERT INTO webhook_events (provider, event_type, event_id, payload, processed)
         VALUES ('stripe', $1, $2, $3, false)`,
        [event.type, event.id, JSON.stringify(event.data ? event.data.object : {})]
      );
    } catch (err) {
      if (err.code === '23505') {
        console.log(`[webhooks/stripe] Événement ${event.id} déjà journalisé (course).`);
        return res.status(200).json({ received: true, deduplicated: true });
      }
      console.error('[webhooks/stripe] Journalisation impossible:', redact(err.message));
    }

    await handleCheckoutCompleted(pool, event.data.object);

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhooks/stripe] Erreur de traitement:', redact(err.message));
    return res.status(500).json({ error: 'Erreur interne' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};

module.exports.config = { api: { bodyParser: false } };