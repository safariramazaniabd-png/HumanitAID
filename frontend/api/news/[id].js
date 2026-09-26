/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   GET    /api/news/:id  — public si published, admin sinon
   PUT    /api/news/:id  — admin (editor+)
   DELETE /api/news/:id  — admin+, suppression définitive
                            (pas de deleted_at sur `news` — si un
                            besoin de corbeille apparaît, prévoir
                            une migration dédiée comme pour posts)
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions, getOptionalAdmin, requireAdmin } = require('../_shared');
const { buildUpdateQuery, isValidUUID } = require('../_sanitizers');
const { validateNews } = require('../_validation');

const ADMIN_COLUMNS =
  'id, title, slug, summary, content, featured_image, gallery, video_url, category, is_featured, status, published_at, seo_title, seo_description, og_image, created_at, updated_at';
const PUBLIC_COLUMNS =
  'id, title, slug, summary, content, featured_image, category, is_featured, status, published_at, created_at, updated_at';

module.exports = async function newsById(req, res) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[news/:id] DATABASE_URL manquant');
    return res.status(503).json({ error: 'Service temporairement indisponible.' });
  }
  const { id } = req.query || {};
  if (!id) return res.status(400).json({ error: 'Identifiant manquant' });

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));

    if (req.method === 'GET') {
      const admin = getOptionalAdmin(req);
      const columns = admin ? ADMIN_COLUMNS : PUBLIC_COLUMNS;
      const cond = isValidUUID(id) ? 'id = $1' : 'slug = $1';
      const { rows } = await pool.query(`SELECT ${columns} FROM news WHERE ${cond} LIMIT 1`, [id]);
      const article = rows[0];
      if (!article) return res.status(404).json({ error: 'Introuvable' });
      if (!admin && article.status !== 'published') return res.status(404).json({ error: 'Introuvable' });
      return res.json({ article });
    }

    if (req.method === 'PUT') {
      const admin = requireAdmin(req, res, 'editor');
      if (!admin) return;
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Identifiant invalide' });
      const body = req.body || {};
      const errors = validateNews(body, { partial: true });
      if (errors.length) return res.status(400).json({ error: 'Données invalides', details: errors });
      const update = buildUpdateQuery('news', id, body);
      if (!update) return res.status(400).json({ error: 'Aucune donnée exploitable' });
      try {
        const { rows } = await pool.query(update.sql, update.values);
        if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
        return res.json({ article: rows[0] });
      } catch (err) {
        if (err && err.code === '23505') {
          return res.status(409).json({ error: 'Ce slug existe déjà, choisissez-en un autre' });
        }
        throw err;
      }
    }

    if (req.method === 'DELETE') {
      const admin = requireAdmin(req, res, 'admin');
      if (!admin) return;
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Identifiant invalide' });
      const { rows } = await pool.query('DELETE FROM news WHERE id = $1 RETURNING id', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (err) {
    console.error('[news/:id] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};
