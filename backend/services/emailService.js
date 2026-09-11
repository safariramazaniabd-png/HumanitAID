const env = require('../config/env');

async function sendDonationReceipt({ donorEmail, donorName, amount, currency, cause }) {
  if (env.demoMode) {
    console.log(`[Email:Demo] Reçu envoyé à ${donorEmail} — ${amount} ${currency} pour "${cause}"`);
    return { success: true, messageId: 'demo-email-' + Date.now() };
  }

  // TODO: implement with real email provider (SendGrid, Mailgun, etc.)
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.EMAIL_API_KEY);
  // await sgMail.send({ ... });
  console.warn('[Email] Service non configuré. Définissez EMAIL_API_KEY.');
  return { success: false, error: 'Email service not configured' };
}

async function sendDonationFailed({ donorEmail, donorName, amount, currency, reason }) {
  if (env.demoMode) {
    console.log(`[Email:Demo] Échec notifié à ${donorEmail} — ${amount} ${currency} — ${reason}`);
    return { success: true, messageId: 'demo-email-' + Date.now() };
  }

  console.warn('[Email] Service non configuré.');
  return { success: false, error: 'Email service not configured' };
}

async function sendAdminAlert({ subject, message }) {
  if (env.demoMode) {
    console.log(`[Email:Demo] Alerte admin: ${subject}`);
    return { success: true, messageId: 'demo-email-' + Date.now() };
  }

  console.warn('[Email] Service non configuré.');
  return { success: false, error: 'Email service not configured' };
}

module.exports = { sendDonationReceipt, sendDonationFailed, sendAdminAlert };
