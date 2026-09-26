/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   POST /api/posts/:id/restore — admin (editor+)

   Sort un post de la corbeille (deleted_at = NULL). Le post
   retrouve son statut d'avant suppression (jamais republié
   automatiquement si son statut était déjà 'archived' etc. —
   deleted_at est indépendant de status).
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions, requireAdmin } = require('../../_shared');
const { isValidUUID } = require('../../_sanitizers');

module.exports = async function restorePost(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const admin = requireAdmin(req, res, 'editor');
  if (!admin) return;

  const { id } = req.query || {};
  if (!id || !isValidUUID(id)) return res.status(400).json({ error: 'Identifiant invalide' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[posts/:id/restore] DATABASE_URL manquant');
    return res.status(503).json({ error: 'Service temporairement indisponible.' });
  }

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));
    const { rows } = await pool.query(
      'UPDATE posts SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id',
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Introuvable dans la corbeille" });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[posts/:id/restore] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};
