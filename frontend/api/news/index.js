/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   GET  /api/news  — public (published) ou admin (tous statuts)
   POST /api/news  — admin (editor+), création

   Même logique que posts/index.js (voir ses commentaires) mais
   sans cause_id ni corbeille : `news` n'a pas de deleted_at en
   base — DELETE est un hard delete (voir [id].js).
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions, getOptionalAdmin, requireAdmin } = require('../_shared');
const { buildInsertQuery } = require('../_sanitizers');
const { validateNews, generateSlug } = require('../_validation');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const PUBLIC_COLUMNS =
  'id, title, slug, summary, content, featured_image, category, is_featured, status, published_at, created_at, updated_at';
const ADMIN_COLUMNS =
  'id, title, slug, summary, content, featured_image, gallery, video_url, category, is_featured, status, published_at, seo_title, seo_description, og_image, created_at, updated_at';
const ADMIN_STATUSES = ['draft', 'scheduled', 'published', 'archived'];

function clampPage(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? (n < 1 ? 1 : n) : fallback;
}
function clampLimit(value) {
  const n = parseInt(value, 10);
  if (Number.isFinite(n)) return Math.min(Math.max(n, 1), MAX_LIMIT);
  return DEFAULT_LIMIT;
}

async function handleGet(req, res, databaseUrl) {
  const admin = getOptionalAdmin(req);
  const { category, search, status } = req.query || {};
  const page = clampPage(req.query.page, 1);
  const limit = clampLimit(req.query.limit);

  const conditions = [];
  const params = [];
  let idx = 1;

  if (!admin) {
    conditions.push(`status = $${idx++}`);
    params.push('published');
  } else if (status && ADMIN_STATUSES.includes(status)) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  if (category) {
    conditions.push(`category = $${idx++}`);
    params.push(String(category));
  }
  if (search) {
    const q = String(search).trim();
    if (q) {
      conditions.push(`(title ILIKE $${idx} OR summary ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * limit;
  const columns = admin ? ADMIN_COLUMNS : PUBLIC_COLUMNS;

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));
    const countRes = await pool.query(`SELECT COUNT(*) AS count FROM news ${where}`, params);
    const total = Number(countRes.rows[0].count) || 0;
    const { rows } = await pool.query(
      `SELECT ${columns} FROM news ${where}
        ORDER BY ${admin ? 'created_at DESC' : 'published_at DESC NULLS LAST, created_at DESC'}
        LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );
    return res.json({ news: rows, total, page, limit });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}

async function handlePost(req, res, databaseUrl) {
  const admin = requireAdmin(req, res, 'editor');
  if (!admin) return;

  const body = req.body || {};
  const errors = validateNews(body, { partial: false });
  if (errors.length) return res.status(400).json({ error: 'Données invalides', details: errors });

  const payload = { ...body };
  if (!payload.slug || !String(payload.slug).trim()) payload.slug = generateSlug(payload.title);

  const insert = buildInsertQuery('news', payload);
  if (!insert) return res.status(400).json({ error: 'Aucune donnée exploitable' });

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));
    const { rows } = await pool.query(insert.sql, insert.values);
    return res.status(201).json({ article: rows[0] });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'Ce slug existe déjà, choisissez-en un autre' });
    }
    throw err;
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}

module.exports = async function news(req, res) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[news] DATABASE_URL manquant');
    return res.status(503).json({ error: 'Service temporairement indisponible.' });
  }
  try {
    if (req.method === 'GET') return await handleGet(req, res, databaseUrl);
    if (req.method === 'POST') return await handlePost(req, res, databaseUrl);
    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (err) {
    console.error('[news] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
