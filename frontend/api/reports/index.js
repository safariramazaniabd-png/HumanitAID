/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   GET  /api/reports  — public (published) ou admin (tous statuts)
   POST /api/reports  — admin (editor+), création

   Distinct de /api/posts : les rapports citent obligatoirement
   une source (OCHA/UNHCR/UNICEF/ICRC/WHO/WFP/IOM ou HumanitAID
   pour le terrain propre), contrainte au niveau SQL (voir
   database/migrations/003_reports.sql) — la validation ici est
   un miroir pour un message d'erreur clair, pas le seul rempart.

   Relation many-to-many avec les causes via report_causes.
   cause_ids (tableau d'UUID) accepté en entrée, jamais une colonne
   de `reports` — géré via transaction explicite.

   Filtre GET optionnel : ?cause_id=<uuid> pour ne montrer que les
   rapports liés à une cause donnée.
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions, getOptionalAdmin, requireAdmin } = require('../_shared');
const { generateSlug } = require('../_validation');
const { validateReport } = require('../_validation');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const PUBLIC_COLUMNS =
  'r.id, r.title, r.slug, r.summary, r.content, r.featured_image, r.source_name, r.source_url, r.published_date, r.created_at';
const ADMIN_COLUMNS =
  'r.id, r.title, r.slug, r.summary, r.content, r.featured_image, r.source_name, r.source_url, r.published_date, r.status, r.created_at, r.updated_at';
const ADMIN_STATUSES = ['draft', 'published', 'archived'];

function clampPage(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? (n < 1 ? 1 : n) : fallback;
}
function clampLimit(value) {
  const n = parseInt(value, 10);
  if (Number.isFinite(n)) return Math.min(Math.max(n, 1), MAX_LIMIT);
  return DEFAULT_LIMIT;
}

// Attache le tableau cause_ids (+ cause_titles pour l'affichage) à chaque
// rapport, en une seule requête groupée plutôt qu'une par rapport (N+1).
async function attachCauses(pool, reports) {
  if (reports.length === 0) return reports;
  const ids = reports.map((r) => r.id);
  const { rows } = await pool.query(
    `SELECT rc.report_id, c.id AS cause_id, c.title AS cause_title
       FROM report_causes rc
       JOIN causes c ON c.id = rc.cause_id
      WHERE rc.report_id = ANY($1::uuid[])`,
    [ids]
  );
  const byReport = {};
  rows.forEach((r) => {
    (byReport[r.report_id] ||= []).push({ id: r.cause_id, title: r.cause_title });
  });
  return reports.map((r) => ({ ...r, causes: byReport[r.id] || [] }));
}

async function handleGet(req, res, pool) {
  const admin = getOptionalAdmin(req);
  const { search, status, cause_id } = req.query || {};
  const page = clampPage(req.query.page, 1);
  const limit = clampLimit(req.query.limit);

  const conditions = [];
  const params = [];
  let idx = 1;

  if (!admin) {
    conditions.push(`r.status = $${idx++}`);
    params.push('published');
  } else if (status && ADMIN_STATUSES.includes(status)) {
    conditions.push(`r.status = $${idx++}`);
    params.push(status);
  }
  if (search) {
    const q = String(search).trim();
    if (q) {
      conditions.push(`(r.title ILIKE $${idx} OR r.summary ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }
  }
  let causeJoin = '';
  if (cause_id) {
    causeJoin = 'JOIN report_causes rcf ON rcf.report_id = r.id AND rcf.cause_id = $' + idx++;
    params.push(cause_id);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * limit;
  const columns = admin ? ADMIN_COLUMNS : PUBLIC_COLUMNS;

  const countRes = await pool.query(
    `SELECT COUNT(DISTINCT r.id) AS count FROM reports r ${causeJoin} ${where}`,
    params
  );
  const total = Number(countRes.rows[0].count) || 0;

  const { rows } = await pool.query(
    `SELECT DISTINCT ${columns} FROM reports r ${causeJoin} ${where}
      ORDER BY r.published_date DESC NULLS LAST, r.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  const reports = await attachCauses(pool, rows);
  return res.json({ reports, total, page, limit });
}

async function handlePost(req, res, pool) {
  const admin = requireAdmin(req, res, 'editor');
  if (!admin) return;

  const body = req.body || {};
  const errors = validateReport(body, { partial: false });
  if (errors.length) return res.status(400).json({ error: 'Données invalides', details: errors });

  const slug = body.slug && String(body.slug).trim() ? body.slug : generateSlug(body.title);
  const causeIds = Array.isArray(body.cause_ids) ? body.cause_ids : [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO reports (title, slug, summary, content, featured_image, source_name, source_url, published_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        body.title, slug, body.summary || null, body.content || null, body.featured_image || null,
        body.source_name, body.source_name === 'HumanitAID' ? (body.source_url || null) : body.source_url,
        body.published_date || null, body.status || 'draft',
      ]
    );
    const report = rows[0];

    for (const causeId of causeIds) {
      await client.query('INSERT INTO report_causes (report_id, cause_id) VALUES ($1,$2)', [report.id, causeId]);
    }

    await client.query('COMMIT');
    return res.status(201).json({ report: { ...report, causes: causeIds } });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'Ce slug existe déjà, choisissez-en un autre' });
    }
    if (err && err.code === '23514') {
      return res.status(400).json({ error: 'Source invalide (contrainte base de données)' });
    }
    if (err && err.code === '23503') {
      return res.status(400).json({ error: 'Une des causes référencées est introuvable' });
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = async function reports(req, res) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[reports] DATABASE_URL manquant');
    return res.status(503).json({ error: 'Service temporairement indisponible.' });
  }

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));

    if (req.method === 'GET') return await handleGet(req, res, pool);
    if (req.method === 'POST') return await handlePost(req, res, pool);
    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (err) {
    console.error('[reports] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};
