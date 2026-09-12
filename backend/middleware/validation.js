const { CAUSE_SLUGS } = require('../../shared/constants');

const MAX_TITLE = 500;
const MAX_CONTENT = 50000;
const MAX_SLUG = 200;
const MAX_EMAIL = 254;
const MAX_NAME = 200;
const MAX_PASSWORD = 128;
const MIN_PASSWORD = 8;
const MAX_MESSAGE = 2000;
const MAX_URL = 2048;
const MAX_DONATION_AMOUNT = 1000000;

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateDonation(body) {
  const errors = [];
  const { donor_name, email, amount, currency, method, cause } = body;

  if (!donor_name || sanitize(donor_name).length < 2) {
    errors.push('Nom requis (min 2 caractères)');
  }
  if (donor_name && sanitize(donor_name).length > MAX_NAME) {
    errors.push(`Nom trop long (max ${MAX_NAME} caractères)`);
  }
  if (!email || !isValidEmail(email)) {
    errors.push('Email invalide');
  }

  const amountNum = Number(amount);
  const amountValid =
    amount !== undefined && amount !== null && amount !== '' &&
    !(typeof amount === 'boolean') &&
    isFinite(amountNum) && amountNum >= 1 && amountNum <= MAX_DONATION_AMOUNT;
  if (!amountValid) {
    errors.push('Montant invalide (min 1, max 1 000 000)');
  } else {
    const amountString = String(amount);
    const decimalPart = amountString.split('.')[1] || '';
    if (decimalPart.length > 2) {
      errors.push('Montant invalide (max 2 décimales)');
    }
  }

  const allowedCurrencies = ['EUR', 'USD', 'CDF', 'GBP', 'CAD'];
  if (currency && !allowedCurrencies.includes(currency)) {
    errors.push('Devise non supportée');
  }
  const allowedMethods = ['stripe', 'flutterwave', 'paystack', 'wire'];
  if (method && !allowedMethods.includes(method)) {
    errors.push('Méthode de paiement non supportée');
  }
  const allowedCauses = [...CAUSE_SLUGS, 'toutes', ''];
  if (cause !== undefined && cause !== null && !allowedCauses.includes(cause)) {
    errors.push('Cause non reconnue');
  }
  return errors;
}

function validatePost(body) {
  const errors = [];
  const { title, content, type } = body;

  if (!title || sanitize(title).length < 3) {
    errors.push('Titre requis (min 3 caractères)');
  }
  if (title && sanitize(title).length > MAX_TITLE) {
    errors.push(`Titre trop long (max ${MAX_TITLE} caractères)`);
  }
  if (content && sanitize(content).length > MAX_CONTENT) {
    errors.push(`Contenu trop long (max ${MAX_CONTENT} caractères)`);
  }
  const allowedTypes = ['article', 'report', 'update', 'press'];
  if (type && !allowedTypes.includes(type)) {
    errors.push('Type de publication invalide');
  }
  return errors;
}

function validateTestimonial(body) {
  const errors = [];
  const { name, content } = body;

  if (!name || sanitize(name).length < 2) {
    errors.push('Nom requis');
  }
  if (!content || sanitize(content).length < 10) {
    errors.push('Contenu requis (min 10 caractères)');
  }
  if (content && sanitize(content).length > MAX_CONTENT) {
    errors.push('Contenu trop long');
  }
  return errors;
}

function validateNews(body) {
  const errors = [];
  const { title, content } = body;

  if (!title || sanitize(title).length < 5) {
    errors.push('Titre requis (min 5 caractères)');
  }
  if (title && sanitize(title).length > MAX_TITLE) {
    errors.push('Titre trop long');
  }
  if (content && sanitize(content).length > MAX_CONTENT) {
    errors.push('Contenu trop long');
  }
  return errors;
}

function validateUser(body) {
  const errors = [];
  const { email, password, name, role } = body;

  if (!email || !isValidEmail(email)) {
    errors.push('Email invalide');
  }
  if (password && password.length < MIN_PASSWORD) {
    errors.push(`Mot de passe trop court (min ${MIN_PASSWORD} caractères)`);
  }
  if (password && password.length > MAX_PASSWORD) {
    errors.push(`Mot de passe trop long (max ${MAX_PASSWORD} caractères)`);
  }
  if (!name || sanitize(name).length < 2) {
    errors.push('Nom requis');
  }
  const allowedRoles = ['super_admin', 'admin', 'editor', 'finance', 'viewer'];
  if (role && !allowedRoles.includes(role)) {
    errors.push('Rôle invalide');
  }
  return errors;
}

function validate(body, validator) {
  const errors = validator(body);
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true, errors: [] };
}

function validationMiddleware(validator) {
  return (req, res, next) => {
    const result = validate(req.body, validator);
    if (!result.valid) {
      return res.status(400).json({ error: 'Données invalides', details: result.errors });
    }
    next();
  };
}

module.exports = {
  sanitize,
  isValidEmail,
  isValidUrl,
  validateDonation,
  validatePost,
  validateTestimonial,
  validateNews,
  validateUser,
  validate,
  validationMiddleware,
  MAX_TITLE,
  MAX_CONTENT,
  MAX_NAME,
  MAX_URL,
  MAX_MESSAGE,
};
