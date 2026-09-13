const express = require('express');
const env = require('../config/env');

const router = express.Router();

router.post('/stripe', (_req, res) => {
  // Le webhook Stripe officiel est hébergé en serverless Vercel.
  // 410 Gone : non-2xx => jamais consommé ici => aucun double traitement.
  return res.status(410).json({
    error: 'Endpoint déplacé — le webhook Stripe officiel est hébergé en serverless Vercel.',
    endpoint: 'https://www.humanit-aid.org/api/webhooks/stripe',
  });
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