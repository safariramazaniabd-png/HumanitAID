/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Utilitaires partagés des fonctions serverless Vercel
   (préfixe "_" : Vercel ne déploie pas ce fichier comme endpoint)

   Contenu :
     - redact()         : masque les clés Stripe dans les logs/messages
     - buildPgOptions() : options de connexion pg (SSL selon l'URL)
     - resolveReturnOrigin(req) : anti open-redirect pour les URLs de retour
   ═══════════════════════════════════════════════════════════ */

const REDACT = /sk_(test|live)_[A-Za-z0-9]+/gi;

function redact(text) {
  return String(text).replace(REDACT, '[REDACTED]');
}

function buildPgOptions(databaseUrl) {
  let useSsl = true;
  try {
    const u = new URL(databaseUrl);
    const sslmode = u.searchParams.get('sslmode');
    if (sslmode) {
      useSsl = sslmode !== 'disable';
    } else if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      useSsl = false;
    }
  } catch (_err) {
    /* URL invalide : on conserve le défaut (SSL) */
  }
  return { connectionString: databaseUrl, ssl: useSsl ? { rejectUnauthorized: false } : false };
}

const DEFAULT_SITE = 'https://www.humanit-aid.org';

function resolveReturnOrigin(req) {
  if (process.env.SITE_URL) {
    try {
      return new URL(process.env.SITE_URL).origin;
    } catch (_err) { /* ignore, fallback */ }
  }
  const origin = req.headers && req.headers.origin;
  if (origin) {
    try {
      const u = new URL(origin);
      const host = u.hostname;
      const allowed =
        host === 'localhost' ||
        host === 'humanit-aid.org' ||
        host.endsWith('.humanit-aid.org') ||
        host.endsWith('.vercel.app');
      if (allowed && (u.protocol === 'https:' || u.protocol === 'http:')) {
        return u.origin;
      }
    } catch (_err) { /* ignore, fallback */ }
  }
  return DEFAULT_SITE;
}

module.exports = { REDACT, redact, buildPgOptions, DEFAULT_SITE, resolveReturnOrigin };