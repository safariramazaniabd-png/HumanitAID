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

async function createCheckoutSession({ amount, currency, donorEmail, cause, publicReference, successUrl, cancelUrl }) {
  if (env.demoMode || !env.stripe.secretKey) {
    return { id: 'cs_test_demo_' + Date.now(), url: successUrl || 'https://humanit-aid.org/?donation=success', demo: true };
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    locale: 'fr',
    client_reference_id: String(publicReference),
    customer_email: donorEmail || undefined,
    line_items: [
      {
        price_data: {
          currency: (currency || 'USD').toLowerCase(),
          unit_amount: Math.round(Number(amount) * 100),
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