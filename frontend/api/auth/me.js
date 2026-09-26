/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   GET /api/auth/me

   Vérifie la session admin en cours (cookie httpOnly) et renvoie
   les informations de l'utilisateur connecté. Utilisé par
   admin/js/app.js au chargement de l'interface pour savoir si
   l'utilisateur doit voir l'écran de connexion ou l'admin.

   Réponse succès (200) : { user }
   Réponse échec (401) : { error }
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions, requireAdmin } = require('../_shared');

module.exports = async function me(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const admin = requireAdmin(req, res);
  if (!admin) return; // requireAdmin a déjà envoyé la réponse 401/403

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[auth/me] DATABASE_URL manquant');
    return res.status(503).json({ error: 'Service temporairement indisponible.' });
  }

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));

    const { rows } = await pool.query(
      'SELECT id, email, name, role, avatar_url, is_active FROM users WHERE id = $1',
      [admin.id]
    );
    const user = rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Session invalide' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('[auth/me] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};
