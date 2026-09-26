/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   PUT    /api/slides/:id — admin (rôle admin)
   DELETE /api/slides/:id — admin (rôle admin), suppression définitive
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions, requireAdmin } = require('../_shared');
const { buildUpdateQuery, isValidUUID } = require('../_sanitizers');
const { validateSlide } = require('../_validation');

module.exports = async function slideById(req, res) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[slides/:id] DATABASE_URL manquant');
    return res.status(503).json({ error: 'Service temporairement indisponible.' });
  }
  const { id } = req.query || {};
  if (!id || !isValidUUID(id)) return res.status(400).json({ error: 'Identifiant invalide' });

  const admin = requireAdmin(req, res, 'admin');
  if (!admin) return;

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));

    if (req.method === 'PUT') {
      const body = req.body || {};
      const errors = validateSlide(body, { partial: true });
      if (errors.length) return res.status(400).json({ error: 'Données invalides', details: errors });
      const update = buildUpdateQuery('slides', id, body);
      if (!update) return res.status(400).json({ error: 'Aucune donnée exploitable' });
      const { rows } = await pool.query(update.sql, update.values);
      if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
      return res.json({ slide: rows[0] });
    }

    if (req.method === 'DELETE') {
      const { rows } = await pool.query('DELETE FROM slides WHERE id = $1 RETURNING id', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (err) {
    console.error('[slides/:id] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};
