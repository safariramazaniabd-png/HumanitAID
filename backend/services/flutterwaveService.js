const env = require('../config/env');

async function initializePayment({ amount, currency, email, name, cause }) {
  if (env.demoMode) {
    return {
      status: 'success',
      data: {
        link: 'https://checkout.flutterwave.com/demo-link',
        id: Math.floor(Math.random() * 1000000),
      },
    };
  }

  // TODO: implement with real Flutterwave SDK
  // const Flutterwave = require('flutterwave-node-v3');
  // const flw = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY, process.env.FLUTTERWAVE_SECRET_KEY);
  // return flw.Charges.create({ ... });
  throw new Error('Flutterwave non configuré. Définissez FLUTTERWAVE_SECRET_KEY.');
}

async function verifyTransaction(transactionId) {
  if (env.demoMode) {
    return {
      status: 'successful',
      data: { id: transactionId, amount: 100, currency: 'USD' },
    };
  }

  // TODO: implement with real Flutterwave SDK
  // const Flutterwave = require('flutterwave-node-v3');
  // const flw = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY, process.env.FLUTTERWAVE_SECRET_KEY);
  // return flw.Transaction.verify({ id: transactionId });
  throw new Error('Flutterwave non configuré. Définissez FLUTTERWAVE_SECRET_KEY.');
}

module.exports = { initializePayment, verifyTransaction };
