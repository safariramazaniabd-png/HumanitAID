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

const { redact, buildPgOptions } = require('../_shared');

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

module.exports = async function getSettings(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[settings] DATABASE_URL manquant — contenu indisponible');
    return res.status(503).json({ error: 'Les contenus sont temporairement indisponibles. Veuillez réessayer plus tard.' });
  }

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
  } catch (err) {
    console.error('[settings] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Les contenus sont temporairement indisponibles. Veuillez réessayer plus tard.' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};