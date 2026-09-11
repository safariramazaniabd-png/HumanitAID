const express = require('express');
const env = require('../config/env');

const router = express.Router();

router.get('/public', (_req, res) => {
  res.json({
    demoMode: env.demoMode,
    stripePublishableKey: env.stripe.publishableKey || null,
    flutterwavePublicKey: env.flutterwave.publicKey || null,
    paystackPublicKey: env.paystack.publicKey || null,
    stripeEnabled: Boolean(env.stripe.secretKey),
  });
});

module.exports = router;