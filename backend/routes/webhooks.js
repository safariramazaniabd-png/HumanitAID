const express = require('express');
const env = require('../config/env');
const { query } = require('../config/database');
const { PAYMENT_STATUS } = require('../../shared/constants');

const router = express.Router();

async function recordWebhookEvent(event) {
  const { rows } = await query(
    'INSERT INTO webhook_events (provider, event_type, payload, processed) VALUES ($1,$2,$3,$4) RETURNING id',
    ['stripe', event.type, JSON.stringify(event.data?.object || {}), false]
  );
  return rows[0]?.id;
}

async function handleCheckoutCompleted(session) {
  const reference = session.client_reference_id || (session.metadata && session.metadata.public_reference);
  if (!reference) {
    console.warn('[Webhook:Stripe] checkout.session.completed sans reference:', session.id);
    return;
  }

  const { rows } = await query('SELECT id FROM donations WHERE public_reference = $1', [reference]);
  if (!rows.length) {
    console.warn('[Webhook:Stripe] Aucun don pour la référence:', reference);
    return;
  }
  const donationId = rows[0].id;
  const providerTransactionId = session.payment_intent || session.id || null;
  const amount = session.amount_total != null ? Number(session.amount_total) / 100 : null;
  const currency = (session.currency || 'usd').toUpperCase();

  await query(
    `UPDATE donations
     SET status = $2, provider_transaction_id = $3, receipt_url = $4, completed_at = now()
     WHERE id = $1`,
    [donationId, PAYMENT_STATUS.COMPLETED, providerTransactionId, session.receipt_url || null]
  );

  await query(
    `INSERT INTO payment_transactions (donation_id, provider, provider_transaction_id, amount, currency, status, provider_response)
     VALUES ($1,'stripe',$2,$3,$4,$5,$6)`,
    [donationId, providerTransactionId, amount, currency, PAYMENT_STATUS.COMPLETED, JSON.stringify(session)]
  );

  console.log(`[Webhook:Stripe] Don ${reference} confirmé (${amount} ${currency}).`);
}

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (env.demoMode) {
    const payload = req.body && Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body || {});
    console.log('[Webhook:Stripe] Événement reçu (mode démo):', payload.slice(0, 200));
    return res.json({ received: true });
  }

  if (!env.stripe.webhookSecret) {
    console.error('[Webhook:Stripe] STRIPE_WEBHOOK_SECRET non défini.');
    return res.status(500).json({ error: 'Webhook non configuré' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'Signature manquante' });
  }

  try {
    const stripeService = require('../services/stripeService');
    const event = stripeService.constructWebhookEvent(req.body, sig);
    let recordId = null;
    try {
      recordId = await recordWebhookEvent(event);
    } catch (err) {
      console.error('[Webhook:Stripe] Impossible de journaliser l\'événement:', err.message);
    }

    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object);
    }

    if (recordId) {
      await query('UPDATE webhook_events SET processed = true WHERE id = $1', [recordId]);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[Webhook:Stripe] Erreur:', err.message);
    return res.status(400).json({ error: 'Webhook invalide' });
  }
});

router.post('/flutterwave', express.json(), async (req, res) => {
  if (env.demoMode) {
    console.log('[Webhook:Flutterwave] Événement reçu (mode démo):', req.body?.event || 'unknown');
    return res.json({ status: 'success', message: 'Webhook accepted (demo)' });
  }

  try {
    const flutterwaveService = require('../services/flutterwaveService');
    const verified = await flutterwaveService.verifyTransaction(req.body?.data?.id);
    console.log('[Webhook:Flutterwave] Transaction vérifiée:', verified);
    // TODO: update donation status in database
    return res.json({ status: 'success', message: 'Webhook accepted' });
  } catch (err) {
    console.error('[Webhook:Flutterwave] Erreur:', err.message);
    return res.status(400).json({ error: 'Webhook invalide' });
  }
});

router.post('/paystack', express.json(), async (req, res) => {
  if (env.demoMode) {
    console.log('[Webhook:Paystack] Événement reçu (mode démo):', req.body?.event || 'unknown');
    return res.json({ status: true, message: 'Webhook accepted (demo)' });
  }

  try {
    const paystackService = require('../services/paystackService');
    const reference = req.body?.data?.reference;
    const verified = await paystackService.verifyTransaction(reference);
    console.log('[Webhook:Paystack] Transaction vérifiée:', verified);
    // TODO: update donation status in database
    return res.json({ status: true, message: 'Webhook accepted' });
  } catch (err) {
    console.error('[Webhook:Paystack] Erreur:', err.message);
    return res.status(400).json({ error: 'Webhook invalide' });
  }
});

module.exports = router;