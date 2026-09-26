/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   PUT    /api/testimonials/:id — admin (editor+)
   DELETE /api/testimonials/:id — admin (admin+), suppression définitive
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions, requireAdmin } = require('../_shared');
const { buildUpdateQuery, isValidUUID } = require('../_sanitizers');
const { validateTestimonial } = require('../_validation');

module.exports = async function testimonialById(req, res) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[testimonials/:id] DATABASE_URL manquant');
    return res.status(503).json({ error: 'Service temporairement indisponible.' });
  }
  const { id } = req.query || {};
  if (!id || !isValidUUID(id)) return res.status(400).json({ error: 'Identifiant invalide' });

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));

    if (req.method === 'PUT') {
      const admin = requireAdmin(req, res, 'editor');
      if (!admin) return;
      const body = req.body || {};
      const errors = validateTestimonial(body, { partial: true });
      if (errors.length) return res.status(400).json({ error: 'Données invalides', details: errors });
      const update = buildUpdateQuery('testimonials', id, body);
      if (!update) return res.status(400).json({ error: 'Aucune donnée exploitable' });
      const { rows } = await pool.query(update.sql, update.values);
      if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
      return res.json({ testimonial: rows[0] });
    }

    if (req.method === 'DELETE') {
      const admin = requireAdmin(req, res, 'admin');
      if (!admin) return;
      const { rows } = await pool.query('DELETE FROM testimonials WHERE id = $1 RETURNING id', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (err) {
    console.error('[testimonials/:id] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};
