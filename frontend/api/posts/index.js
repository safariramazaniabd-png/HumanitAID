/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   GET  /api/posts   — public (published uniquement) ou admin
                        (tous statuts, si session valide)
   POST /api/posts   — admin (rôle editor+), création

   GET :
     Public (pas de cookie admin valide) : uniquement
     status='published', deleted_at IS NULL, colonnes publiques
     seulement. Comportement STRICTEMENT inchangé pour tout
     appelant non authentifié.

     Admin (cookie de session valide, rôle editor+) : tous les
     statuts (filtrable via ?status=), colonnes complètes
     (cause_id, seo_*, gallery, scheduled_at...), et par défaut
     deleted_at IS NULL sauf ?status=trashed qui montre la
     corbeille (deleted_at IS NOT NULL).

   POST : création d'un post. cause_id/slug optionnels (slug
   auto-généré depuis le titre si vide).

   Paramètres GET optionnels :
     search, page, limit, status (admin uniquement)

   Réponse GET : { posts: [...], total, page, limit }
   Réponse POST (201) : { post }
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions, getOptionalAdmin, requireAdmin } = require('../_shared');
const { buildInsertQuery } = require('../_sanitizers');
const { validatePost, generateSlug } = require('../_validation');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const PUBLIC_COLUMNS =
  'id, title, slug, summary, content, featured_image, video_url, category, location, is_featured, status, published_at, created_at, updated_at';
const ADMIN_COLUMNS =
  'id, title, slug, summary, content, featured_image, gallery, video_url, category, location, cause_id, is_featured, status, published_at, scheduled_at, seo_title, seo_description, og_image, view_count, deleted_at, created_at, updated_at';
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
  const { search, status } = req.query || {};
  const page = clampPage(req.query.page, 1);
  const limit = clampLimit(req.query.limit);

  const conditions = [];
  const params = [];
  let idx = 1;

  if (!admin) {
    conditions.push(`status = $${idx++}`);
    params.push('published');
    conditions.push('deleted_at IS NULL');
  } else if (status === 'trashed') {
    conditions.push('deleted_at IS NOT NULL');
  } else {
    conditions.push('deleted_at IS NULL');
    if (status && ADMIN_STATUSES.includes(status)) {
      conditions.push(`status = $${idx++}`);
      params.push(status);
    }
    // pas de filtre status = tous statuts confondus (vue "Tous")
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

    const countRes = await pool.query(`SELECT COUNT(*) AS count FROM posts ${where}`, params);
    const total = Number(countRes.rows[0].count) || 0;

    const { rows } = await pool.query(
      `SELECT ${columns}
         FROM posts ${where}
        ORDER BY ${admin ? 'created_at DESC' : 'published_at DESC NULLS LAST, created_at DESC'}
        LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    return res.json({ posts: rows, total, page, limit });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}

async function handlePost(req, res, databaseUrl) {
  const admin = requireAdmin(req, res, 'editor');
  if (!admin) return;

  const body = req.body || {};
  const errors = validatePost(body, { partial: false });
  if (errors.length) {
    return res.status(400).json({ error: 'Données invalides', details: errors });
  }

  const payload = { ...body };
  if (!payload.slug || !String(payload.slug).trim()) {
    payload.slug = generateSlug(payload.title);
  }
  if (payload.cause_id === '') payload.cause_id = null;

  const insert = buildInsertQuery('posts', payload);
  if (!insert) {
    return res.status(400).json({ error: 'Aucune donnée exploitable' });
  }

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));
    const { rows } = await pool.query(insert.sql, insert.values);
    return res.status(201).json({ post: rows[0] });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'Ce slug existe déjà, choisissez-en un autre' });
    }
    throw err;
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}

module.exports = async function posts(req, res) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[posts] DATABASE_URL manquant');
    return res.status(503).json({ error: 'Service temporairement indisponible.' });
  }

  try {
    if (req.method === 'GET') return await handleGet(req, res, databaseUrl);
    if (req.method === 'POST') return await handlePost(req, res, databaseUrl);
    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (err) {
    console.error('[posts] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
