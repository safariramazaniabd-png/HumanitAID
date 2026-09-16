/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   GET /api/news

   Actualités publiques. Source de vérité : table PostgreSQL
   `news` — articles publiés uniquement (status = 'published'),
   paginés, triés par date de publication. Jamais de brouillons
   ou d'articles planifiés.

   Paramètres optionnels :
     category  — filtre sur la catégorie (étiquette)
     search    — recherche plein texte (titre / résumé)
     page      — numéro de page (défaut 1, min 1)
     limit     — taille de page (défaut 10, max 50)

   Réponse : { news: [...], total, page, limit }

   Sécurité :
     - GET uniquement. Jamais de brouillons exposés.
     - SQL paramétré, page/limit bornés.
     - Aucune donnée sensible.
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions } = require('../_shared');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const PUBLIC_COLUMNS =
  'id, title, slug, summary, content, featured_image, category, is_featured, status, published_at, created_at, updated_at';

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

module.exports = async function listNews(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[news] DATABASE_URL manquant — contenu indisponible');
    return res.status(503).json({ error: 'Les contenus sont temporairement indisponibles. Veuillez réessayer plus tard.' });
  }

  const { category, search } = req.query || {};
  const page = clampPage(req.query.page, 1);
  const limit = clampLimit(req.query.limit);

  const conditions = ['status = $1'];
  const params = ['published'];
  let idx = 2;
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
  const where = 'WHERE ' + conditions.join(' AND ');
  const offset = (page - 1) * limit;

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));

    const countRes = await pool.query(`SELECT COUNT(*) AS count FROM news ${where}`, params);
    const total = Number(countRes.rows[0].count) || 0;

    const { rows } = await pool.query(
      `SELECT ${PUBLIC_COLUMNS}
         FROM news ${where}
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    return res.json({ news: rows, total, page, limit });
  } catch (err) {
    console.error('[news] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Les contenus sont temporairement indisponibles. Veuillez réessayer plus tard.' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};