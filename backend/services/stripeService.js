const env = require('../config/env');
const { DEFAULT_CAUSES } = require('../../shared/constants');

let stripe = null;

function getStripe() {
  if (!stripe) {
    const Stripe = require('stripe');
    stripe = new Stripe(env.stripe.secretKey);
  }
  return stripe;
}

function causeLabel(cause) {
  if (!cause) return 'Soutien humanitaire — HumanitAID Foundation';
  const match = DEFAULT_CAUSES.find((c) => c.slug === cause);
  return match ? match.title : 'Soutien humanitaire — HumanitAID Foundation';
}

function assertTestMode() {
  if (/^sk_live_/i.test(env.stripe.secretKey)) {
    const err = new Error('Stripe en mode LIVE refusé (point 4 = mode TEST uniquement). Configurez une clé sk_test_.');
    err.code = 'STRIPE_LIVE_NOT_ALLOWED';
    throw err;
  }
}

function toMinorUnits(amount) {
  const n = Number(amount);
  if (!isFinite(n) || n < 1) {
    const err = new Error('Montant invalide (non fini ou nul)');
    err.code = 'INVALID_AMOUNT';
    throw err;
  }
  return Math.round(n * 100);
}

async function createCheckoutSession({ amount, currency, donorEmail, cause, publicReference, successUrl, cancelUrl }) {
  if (env.demoMode || !env.stripe.secretKey) {
    return { id: 'cs_test_demo_' + Date.now(), url: successUrl || 'https://humanit-aid.org/?donation=success', demo: true };
  }

  assertTestMode();

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    locale: 'fr',
    client_reference_id: String(publicReference),
    customer_email: donorEmail || undefined,
    line_items: [
      {
        price_data: {
          currency: (currency || 'USD').toLowerCase(),
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

  return { id: session.id, url: session.url, demo: false };
}

function constructWebhookEvent(payload, signature) {
  return getStripe().webhooks.constructEvent(payload, signature, env.stripe.webhookSecret);
}

module.exports = { createCheckoutSession, constructWebhookEvent };