/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   GET    /api/reports/:id — public si published, admin sinon
   PUT    /api/reports/:id — admin (editor+)
   DELETE /api/reports/:id — admin (editor+), suppression définitive
                              (report_causes suit via ON DELETE CASCADE)
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions, getOptionalAdmin, requireAdmin } = require('../_shared');
const { isValidUUID } = require('../_sanitizers');
const { validateReport } = require('../_validation');

const ADMIN_COLUMNS =
  'r.id, r.title, r.slug, r.summary, r.content, r.featured_image, r.source_name, r.source_url, r.published_date, r.status, r.created_at, r.updated_at';
const PUBLIC_COLUMNS =
  'r.id, r.title, r.slug, r.summary, r.content, r.featured_image, r.source_name, r.source_url, r.published_date, r.created_at';

async function getCauseIds(pool, reportId) {
  const { rows } = await pool.query('SELECT cause_id FROM report_causes WHERE report_id = $1', [reportId]);
  return rows.map((r) => r.cause_id);
}

module.exports = async function reportById(req, res) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[reports/:id] DATABASE_URL manquant');
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
      const cond = isValidUUID(id) ? 'r.id = $1' : 'r.slug = $1';
      const { rows } = await pool.query(`SELECT ${columns} FROM reports r WHERE ${cond} LIMIT 1`, [id]);
      const report = rows[0];
      if (!report) return res.status(404).json({ error: 'Introuvable' });
      if (!admin && report.status !== 'published') return res.status(404).json({ error: 'Introuvable' });
      report.cause_ids = await getCauseIds(pool, report.id);
      return res.json({ report });
    }

    if (req.method === 'PUT') {
      const admin = requireAdmin(req, res, 'editor');
      if (!admin) return;
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Identifiant invalide' });

      const body = req.body || {};
      const errors = validateReport(body, { partial: true });
      if (errors.length) return res.status(400).json({ error: 'Données invalides', details: errors });

      const { buildUpdateQuery } = require('../_sanitizers');
      const update = buildUpdateQuery('reports', id, body);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        let report;
        if (update) {
          const { rows } = await client.query(update.sql, update.values);
          report = rows[0];
        } else {
          const { rows } = await client.query('SELECT * FROM reports WHERE id = $1', [id]);
          report = rows[0];
        }
        if (!report) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Introuvable' });
        }
        if (Array.isArray(body.cause_ids)) {
          await client.query('DELETE FROM report_causes WHERE report_id = $1', [id]);
          for (const causeId of body.cause_ids) {
            await client.query('INSERT INTO report_causes (report_id, cause_id) VALUES ($1,$2)', [id, causeId]);
          }
        }
        await client.query('COMMIT');
        report.cause_ids = await getCauseIds(pool, id);
        return res.json({ report });
      } catch (err) {
        await client.query('ROLLBACK');
        if (err && err.code === '23505') return res.status(409).json({ error: 'Ce slug existe déjà' });
        if (err && err.code === '23514') return res.status(400).json({ error: 'Source invalide (contrainte base de données)' });
        if (err && err.code === '23503') return res.status(400).json({ error: 'Une des causes référencées est introuvable' });
        throw err;
      } finally {
        client.release();
      }
    }

    if (req.method === 'DELETE') {
      const admin = requireAdmin(req, res, 'editor');
      if (!admin) return;
      if (!isValidUUID(id)) return res.status(400).json({ error: 'Identifiant invalide' });
      const { rows } = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING id', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (err) {
    console.error('[reports/:id] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};
