/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   GET /api/posts

   Articles publics (blog, rapports de terrain, plaidoyer).
   Source de vérité : table PostgreSQL `posts` — articles
   PUBLIÉS uniquement (status = 'published'), paginés.
   Un paramètre `status` éventuel est ignoré : un brouillon
   n'est JAMAIS exposé publiquement.

   Paramètres optionnels :
     search    — recherche plein texte (titre / résumé)
     page      — numéro de page (défaut 1, min 1)
     limit     — taille de page (défaut 10, max 50)

   Réponse : { posts: [...], total, page, limit }

   Sécurité :
     - GET uniquement. Jamais de brouillons/planifiés.
     - SQL paramétré, page/limit bornés.
     - Aucune donnée sensible.
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions } = require('../_shared');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const PUBLIC_COLUMNS =
  'id, title, slug, summary, content, featured_image, video_url, category, location, is_featured, status, published_at, created_at, updated_at';

function clampPage(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? (n < 1 ? 1 : n) : fallback;
}

function clampLimit(value) {
  const n = parseInt(value, 10);
  if (Number.isFinite(n)) {
    return Math.min(Math.max(n, 1), MAX_LIMIT);
  }
  return DEFAULT_LIMIT;
}

module.exports = async function listPosts(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[posts] DATABASE_URL manquant — contenu indisponible');
    return res.status(503).json({ error: 'Les contenus sont temporairement indisponibles. Veuillez réessayer plus tard.' });
  }

  const { search } = req.query || {};
  const page = clampPage(req.query.page, 1);
  const limit = clampLimit(req.query.limit);

  const conditions = ['status = $1'];
  const params = ['published'];
  let idx = 2;
  if (search) {
    const q = String(search).trim();
    if (q) {
      conditions.push(`(title ILIKE $${idx} OR summary ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }
  }
  const where = 'WHERE ' + conditions.join(' AND ');
  const offset = (page - 1) * limit;

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));

    const countRes = await pool.query(`SELECT COUNT(*) AS count FROM posts ${where}`, params);
    const total = Number(countRes.rows[0].count) || 0;

    const { rows } = await pool.query(
      `SELECT ${PUBLIC_COLUMNS}
         FROM posts ${where}
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    return res.json({ posts: rows, total, page, limit });
  } catch (err) {
    console.error('[posts] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Les contenus sont temporairement indisponibles. Veuillez réessayer plus tard.' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};