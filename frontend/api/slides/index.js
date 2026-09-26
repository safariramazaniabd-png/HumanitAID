/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   GET  /api/slides  — public (actifs) ou admin (tous, actifs et non)
   POST /api/slides  — admin (rôle admin), création
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions, getOptionalAdmin, requireAdmin } = require('../_shared');
const { buildInsertQuery } = require('../_sanitizers');
const { validateSlide } = require('../_validation');

const SLIDE_TYPES = ['hero', 'field_story'];
const PUBLIC_COLUMNS =
  'id, type, title, subtitle, description, image_url, video_url, cta_text, cta_url, is_main, duration, display_order';
const ADMIN_COLUMNS =
  'id, type, title, subtitle, description, image_url, video_url, cta_text, cta_url, is_active, is_main, duration, display_order, created_at, updated_at';

module.exports = async function slides(req, res) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[slides] DATABASE_URL manquant');
    return res.status(503).json({ error: 'Service temporairement indisponible.' });
  }

  if (req.method === 'GET') {
    const { type } = req.query || {};
    if (type !== undefined && !SLIDE_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Type de slide invalide' });
    }
    const admin = getOptionalAdmin(req);
    const columns = admin ? ADMIN_COLUMNS : PUBLIC_COLUMNS;

    let pool = null;
    try {
      const { Pool } = require('pg');
      pool = new Pool(buildPgOptions(databaseUrl));
      const activeClause = admin ? '' : 'AND is_active = true';
      const { rows } = await pool.query(
        `SELECT ${columns} FROM slides
          WHERE ($1::text IS NULL OR type = $1) ${activeClause}
          ORDER BY display_order ASC, created_at ASC`,
        [type || null]
      );
      return res.json({ slides: rows });
    } catch (err) {
      console.error('[slides] Erreur:', redact(err && err.message ? err.message : err));
      return res.status(500).json({ error: 'Les contenus sont temporairement indisponibles. Veuillez réessayer plus tard.' });
    } finally {
      if (pool) await pool.end().catch(() => {});
    }
  }

  if (req.method === 'POST') {
    const admin = requireAdmin(req, res, 'admin');
    if (!admin) return;
    const body = req.body || {};
    const errors = validateSlide(body, { partial: false });
    if (errors.length) return res.status(400).json({ error: 'Données invalides', details: errors });

    const insert = buildInsertQuery('slides', body);
    if (!insert) return res.status(400).json({ error: 'Aucune donnée exploitable' });

    let pool = null;
    try {
      const { Pool } = require('pg');
      pool = new Pool(buildPgOptions(databaseUrl));
      const { rows } = await pool.query(insert.sql, insert.values);
      return res.status(201).json({ slide: rows[0] });
    } catch (err) {
      console.error('[slides] Erreur:', redact(err && err.message ? err.message : err));
      return res.status(500).json({ error: 'Erreur serveur' });
    } finally {
      if (pool) await pool.end().catch(() => {});
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
};
