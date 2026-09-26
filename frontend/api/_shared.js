/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Utilitaires partagés des fonctions serverless Vercel
   (préfixe "_" : Vercel ne déploie pas ce fichier comme endpoint)

   Contenu :
     - redact()         : masque les clés Stripe dans les logs/messages
     - buildPgOptions() : options de connexion pg (SSL selon l'URL)
     - resolveReturnOrigin(req) : anti open-redirect pour les URLs de retour
     - Authentification admin (cookie httpOnly + JWT) :
         signAdminToken(user), verifyAdminToken(token),
         parseCookies(req), setAuthCookie(res, token),
         clearAuthCookie(res), requireAdmin(req, res)
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

/* ───────────────────────────────────────────────────────────
   Authentification admin
   ─────────────────────────────────────────────────────────── */

const AUTH_COOKIE_NAME = 'humanitaid_admin_session';

// Convertit un délai type "7d" / "12h" / "30m" / "45s" en secondes.
// Retombe sur 7 jours si le format n'est pas reconnu.
function expiresInToSeconds(value) {
  const raw = String(value || '7d').trim();
  const match = raw.match(/^(\d+)\s*([dhms])$/i);
  if (!match) return 7 * 24 * 3600;
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[unit];
  return n * factor;
}

function signAdminToken(user) {
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET manquant');
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function verifyAdminToken(token) {
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET manquant');
  return jwt.verify(token, secret); // lève une exception si invalide/expiré
}

// Parseur de cookies minimal (pas de dépendance externe requise).
function parseCookies(req) {
  const header = (req.headers && req.headers.cookie) || '';
  const out = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    if (!key) return;
    out[key] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return out;
}

function setAuthCookie(res, token) {
  const maxAge = expiresInToSeconds(process.env.JWT_EXPIRES_IN);
  const parts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${maxAge}`,
  ];
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearAuthCookie(res) {
  const parts = [
    `${AUTH_COOKIE_NAME}=`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=0',
  ];
  res.setHeader('Set-Cookie', parts.join('; '));
}

// Miroir de backend/middleware/rbac.js (ROLE_HIERARCHY). Dupliqué ici
// volontairement : shared/constants.js n'est PAS inclus dans le build
// Vercel (Root Directory = frontend), donc frontend/api/ ne peut pas
// le require — voir le même choix déjà fait dans donations/checkout.js
// pour CAUSE_SLUGS.
const ROLE_HIERARCHY = { viewer: 0, finance: 1, editor: 2, admin: 3, super_admin: 4 };

// À appeler en tête de handler pour les routes d'écriture admin :
//   const admin = requireAdmin(req, res);              // rôle mini: editor
//   const admin = requireAdmin(req, res, 'admin');      // rôle mini: admin
//   if (!admin) return; // la réponse 401/403 a déjà été envoyée
function requireAdmin(req, res, minRole = 'editor') {
  const cookies = parseCookies(req);
  const token = cookies[AUTH_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'Authentification requise' });
    return null;
  }
  try {
    const payload = verifyAdminToken(token);
    const userLevel = ROLE_HIERARCHY[payload.role] ?? -1;
    const minLevel = ROLE_HIERARCHY[minRole] ?? 0;
    if (userLevel < minLevel) {
      res.status(403).json({ error: 'Accès interdit — rôle insuffisant' });
      return null;
    }
    return payload;
  } catch (_err) {
    res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
    return null;
  }
}

/* ───────────────────────────────────────────────────────────
   Rate limiting best-effort pour /api/auth/login
   ⚠️ En serverless, cet état est en mémoire par instance et est
   perdu à chaque cold start / réparti entre régions : c'est une
   protection best-effort, PAS une garantie anti-bruteforce
   robuste. Pour une protection réellement fiable en production,
   utiliser Vercel Attack Challenge Mode (WAF) ou un verrou
   persisté en base (colonne failed_attempts sur `users`) — à
   évaluer comme chantier séparé si le besoin est confirmé.
   ─────────────────────────────────────────────────────────── */
const loginAttempts = new Map(); // ip -> [timestamps]
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = process.env.NODE_ENV === 'production' ? 20 : 100;

function checkLoginRateLimit(req) {
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  const now = Date.now();
  const attempts = (loginAttempts.get(ip) || []).filter((t) => now - t < LOGIN_WINDOW_MS);
  if (attempts.length >= LOGIN_MAX_ATTEMPTS) return false;
  attempts.push(now);
  loginAttempts.set(ip, attempts);
  return true;
}

// Variante non bloquante de requireAdmin : à utiliser sur une route GET
// publique qui doit néanmoins montrer plus de contenu à un admin connecté
// (ex: GET /api/posts renvoie tous les statuts pour l'admin, seulement
// "published" pour le public). N'écrit JAMAIS de réponse d'erreur :
// retourne simplement null si pas de session valide.
function getOptionalAdmin(req, minRole = 'editor') {
  const cookies = parseCookies(req);
  const token = cookies[AUTH_COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = verifyAdminToken(token);
    const userLevel = ROLE_HIERARCHY[payload.role] ?? -1;
    const minLevel = ROLE_HIERARCHY[minRole] ?? 0;
    return userLevel >= minLevel ? payload : null;
  } catch (_err) {
    return null;
  }
}

module.exports = {
  REDACT,
  redact,
  buildPgOptions,
  DEFAULT_SITE,
  resolveReturnOrigin,
  AUTH_COOKIE_NAME,
  signAdminToken,
  verifyAdminToken,
  parseCookies,
  setAuthCookie,
  clearAuthCookie,
  requireAdmin,
  getOptionalAdmin,
  checkLoginRateLimit,
};
