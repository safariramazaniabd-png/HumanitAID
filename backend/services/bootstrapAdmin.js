const bcrypt = require('bcryptjs');
const env = require('../config/env');

// Sentinelle du compte d'amorçage posée par database/schema.sql.
// Le hash stocké correspond à cette sentinelle (aucun mot de passe réel) :
// au 1er démarrage, le bootstrap la remplace par le mot de passe fourni
// via ADMIN_DEFAULT_PASSWORD. Jamais loggée.
const SEED_SENTINEL = 'HUMANITAID-DISABLED-SEED-NO-REAL-PASSWORD';

const WEAK_PASSWORD = /TODO|CHANGEME|changeme|motdepasse|password|placeholder|123456/i;

function fail(message) {
  console.error(`[BootstrapAdmin] ${message}`);
  process.exit(1);
}

async function ensureAdmin() {
  if (env.demoMode) {
    console.log('[BootstrapAdmin] Mode démo — amorçage admin ignoré.');
    return;
  }

  const email = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@humanit-aid.org').trim().toLowerCase();
  const password = process.env.ADMIN_DEFAULT_PASSWORD || '';
  const isProduction = env.nodeEnv === 'production';

  if (isProduction) {
    if (!password) {
      fail('ADMIN_DEFAULT_PASSWORD manquant — requis pour initialiser le compte admin en production.');
    }
    if (password.length < 12) {
      fail('ADMIN_DEFAULT_PASSWORD trop court (< 12 caractères).');
    }
    if (WEAK_PASSWORD.test(password)) {
      fail('ADMIN_DEFAULT_PASSWORD est un mot de passe placeholder/faible.');
    }
  } else if (!password) {
    console.warn('[BootstrapAdmin] ADMIN_DEFAULT_PASSWORD absent — aucune initialisation admin.');
    return;
  }

  const { query } = require('../config/database');
  const { ROLES } = require('../../shared/constants');

  try {
    const { rows } = await query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    const existing = rows[0];

    if (existing) {
      const isSeed = await bcrypt.compare(SEED_SENTINEL, existing.password_hash);
      if (!isSeed) {
        console.log('[BootstrapAdmin] Compte admin actif existant — inchangé.');
        return;
      }
      const passwordHash = await bcrypt.hash(password, 12);
      await query('UPDATE users SET password_hash = $2, is_active = true WHERE id = $1', [existing.id, passwordHash]);
      console.log('[BootstrapAdmin] Mot de passe admin d\'amorçage remplacé.');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows: created } = await query(
      `INSERT INTO users (email, name, role, password_hash, is_active)
       VALUES ($1,$2,$3,$4,true) RETURNING id, email, role`,
      [email, 'Super Administrateur', ROLES.SUPER_ADMIN, passwordHash]
    );
    console.log(`[BootstrapAdmin] Compte admin créé (${created[0]?.email}).`);
  } catch (err) {
    fail(`Erreur lors de l'initialisation du compte admin: ${err.message}`);
  }
}

module.exports = { ensureAdmin };