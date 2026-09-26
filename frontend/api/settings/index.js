/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   GET /api/settings

   Paramètres publics + liste de partenaires affichés sur le
   site public. Source de vérité : tables PostgreSQL `settings`
   et `partners`.

   Sécurité :
     - ALLOWLIST stricte : seules les clés publiques listées ci-
       dessous sont renvoyées. Toute clé sensée (clés API, URLs
       de base de données, jetons, passwords, tokens...) est
       rejetée même si elle existe en base — aucun secret exposé.
     - Le endpoint est anonyme : il se comporte toujours comme
       « visiteur », jamais comme un administrateur (contrairement
       au backend Express qui élargit la réponse pour les admins).
     - GET uniquement. SQL paramétré.
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions, requireAdmin } = require('../_shared');

const PUBLIC_KEYS = [
  'site_name',
  'site_tagline',
  'site_url',
  'theme',
  'language',
  'currency',
  'contact_email',
  'contact_phone',
  'donation_goal_default',
  'enable_newsletter',
  'enable_testimonials',
  'ticker_speed',
  'hero_slideshow_interval',
  'footer_text',
];

// Filet de sécurité supplémentaire : toute clé évoquant un secret
// est exclue, même si elle figurait dans l'allowlist.
const SENSITIVE_PATTERN = /(secret|password|token|api[_ -]?key|database|dsn|jwt|priv)/i;

function isPublicKey(key) {
  if (!PUBLIC_KEYS.includes(key)) return false;
  return !SENSITIVE_PATTERN.test(key);
}

async function handleGet(req, res, databaseUrl) {
  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));

    const settingsRes = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    for (const row of settingsRes.rows) {
      if (isPublicKey(row.key)) {
        settings[row.key] = row.value;
      }
    }

    const partnersRes = await pool.query(
      'SELECT name FROM partners WHERE is_active = true ORDER BY display_order ASC, name ASC'
    );
    const partners = partnersRes.rows.map((p) => p.name);

    return res.json({ settings, partners });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}

// PUT /api/settings — admin (rôle admin). Upsert clé/valeur.
// Body attendu : { key: string, value: string }
// Le filet SENSITIVE_PATTERN s'applique aussi en écriture : impossible
// d'introduire une clé "jwt_secret", "database_url", etc. via cette route,
// même par erreur — ces valeurs vivent uniquement dans les variables
// d'environnement Vercel, jamais dans la table `settings`.
const MAX_KEY_LEN = 100;
const MAX_VALUE_LEN = 5000;
const KEY_REGEX = /^[a-z][a-z0-9_]*$/;

async function handlePut(req, res, databaseUrl) {
  const admin = requireAdmin(req, res, 'admin');
  if (!admin) return;

  const { key, value } = req.body || {};
  if (typeof key !== 'string' || !KEY_REGEX.test(key) || key.length > MAX_KEY_LEN) {
    return res.status(400).json({ error: 'Clé invalide (minuscules, chiffres, underscore, max 100 caractères)' });
  }
  if (SENSITIVE_PATTERN.test(key)) {
    return res.status(400).json({ error: 'Cette clé est réservée (motif sensible) et ne peut pas être stockée ici' });
  }
  if (value === undefined || value === null) {
    return res.status(400).json({ error: 'value requis' });
  }
  const stringValue = String(value);
  if (stringValue.length > MAX_VALUE_LEN) {
    return res.status(400).json({ error: `Valeur trop longue (max ${MAX_VALUE_LEN} caractères)` });
  }

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));
    const { rows } = await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
       RETURNING key, value`,
      [key, stringValue]
    );
    return res.json({ setting: rows[0] });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}

module.exports = async function settings(req, res) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[settings] DATABASE_URL manquant');
    return res.status(503).json({ error: 'Service temporairement indisponible.' });
  }

  try {
    if (req.method === 'GET') return await handleGet(req, res, databaseUrl);
    if (req.method === 'PUT') return await handlePut(req, res, databaseUrl);
    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (err) {
    console.error('[settings] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};