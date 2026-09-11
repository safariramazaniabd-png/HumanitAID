const env = require('../config/env');

async function initializeTransaction({ amount, email, name, cause }) {
  if (env.demoMode) {
    return {
      status: true,
      data: {
        authorization_url: 'https://checkout.paystack.com/demo-link',
        reference: 'psk_test_demo_' + Date.now(),
      },
    };
  }

  // TODO: implement with real Paystack SDK
  // const Paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);
  // return Paystack.transaction.initialize({ ... });
  throw new Error('Paystack non configuré. Définissez PAYSTACK_SECRET_KEY.');
}

async function verifyTransaction(reference) {
  if (env.demoMode) {
    return {
      status: true,
      data: {
        reference,
        amount: 10000,
        status: 'success',
      },
    };
  }

  // TODO: implement with real Paystack SDK
  // const Paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);
  // return Paystack.transaction.verify({ reference });
  throw new Error('Paystack non configuré. Définissez PAYSTACK_SECRET_KEY.');
}

module.exports = { initializeTransaction, verifyTransaction };
