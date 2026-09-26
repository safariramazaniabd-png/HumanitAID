/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   POST /api/auth/login

   Authentifie un compte admin (table `users`) et pose un cookie
   de session httpOnly + Secure contenant le JWT. Le token n'est
   JAMAIS renvoyé dans le corps de la réponse : le navigateur ne
   peut pas le lire en JavaScript (protection XSS de base).

   Corps attendu : { email, password }
   Réponse succès (200) : { user: { id, email, name, role } }
   Réponse échec (400/401/429) : { error }

   Sécurité :
     - Message d'erreur générique (n'indique jamais si l'email
       existe ou non) pour ne pas faciliter l'énumération de comptes.
     - Rate limiting best-effort par IP (voir _shared.js).
     - bcrypt.compare en temps constant pour la comparaison du mot
       de passe.
     - Vérifie is_active avant d'émettre un token.
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions, signAdminToken, setAuthCookie, checkLoginRateLimit } = require('../_shared');

module.exports = async function login(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  if (!checkLoginRateLimit(req)) {
    return res.status(429).json({ error: 'Trop de tentatives, réessayez dans 15 minutes.' });
  }

  const { email, password } = req.body || {};
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[auth/login] DATABASE_URL manquant');
    return res.status(503).json({ error: 'Service temporairement indisponible.' });
  }

  const GENERIC_ERROR = { error: 'Identifiants incorrects' };
  let pool = null;

  try {
    const bcrypt = require('bcryptjs');
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));

    const { rows } = await pool.query(
      'SELECT id, email, name, role, password_hash, is_active FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    const user = rows[0];

    if (!user || !user.is_active) {
      // Comparaison factice pour limiter les attaques par mesure de timing
      // (compare toujours un hash même si l'utilisateur n'existe pas).
      await bcrypt.compare(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalid');
      return res.status(401).json(GENERIC_ERROR);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json(GENERIC_ERROR);
    }

    const token = signAdminToken(user);
    setAuthCookie(res, token);

    await pool.query('UPDATE users SET last_login = now() WHERE id = $1', [user.id]);

    return res.status(200).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('[auth/login] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};
