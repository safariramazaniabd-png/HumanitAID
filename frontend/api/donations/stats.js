/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   GET /api/donations/stats

   Statistiques publiques de collecte, calculées UNIQUEMENT
   depuis les dons réels (status = 'completed', confirmés par
   les webhooks). Aucune valeur fictive.

   Règles :
     - Ne JAMAIS additionner plusieurs devises : les agrégats
       monétaires (total, today, month, average) portent sur la
       devise par défaut du site (USD). Un détail par devise est
       fourni dans `by_currency`.
     - Si une statistique n'est pas calculable de façon fiable,
       elle est renvoyée à null (le frontend affiche alors un
       état sobre, jamais de chiffres inventés).
     - `total` (USD) est null tant qu'aucun don USD n'est complété.

   Réponse : {
     total,        — null ou nombre (USD, dons complétés)
     today,        — nombre (USD, complétés aujourd'hui)
     month,        — nombre (USD, complétés ce mois-ci)
     average,      — nombre (USD moyen par don complété, 0 si aucun)
     count,        — nombre de dons complétés (toutes devises)
     by_currency,  — objet { CODE_DEVISE: total } dons complétés
   }

   Sécurité :
     - GET uniquement. SQL paramétré/statique.
     - Aucune donnée nominative renvoyée.
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions } = require('../_shared');

module.exports = async function getDonationStats(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[donations/stats] DATABASE_URL manquant — statistiques indisponibles');
    return res.status(503).json({ error: 'Les statistiques sont temporairement indisponibles. Veuillez réessayer plus tard.' });
  }

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));

    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE currency = 'USD'), 0)                              AS total_usd,
         COALESCE(SUM(amount) FILTER (WHERE currency = 'USD' AND completed_at >= CURRENT_DATE), 0)           AS today_usd,
         COALESCE(SUM(amount) FILTER (WHERE currency = 'USD' AND completed_at >= DATE_TRUNC('month', NOW())), 0) AS month_usd,
         COUNT(*) FILTER (WHERE currency = 'USD')                                              AS count_usd,
         COUNT(DISTINCT CASE WHEN donor_email IS NOT NULL THEN donor_email END)                AS distinct_donors,
         COUNT(*)                                                                              AS count
        FROM donations
       WHERE status = 'completed'`
    );

    const byCurrencyRes = await pool.query(
      `SELECT currency, COALESCE(SUM(amount), 0) AS total
         FROM donations
        WHERE status = 'completed'
        GROUP BY currency
        ORDER BY currency`
    );

    const r = rows[0] || {};
    const totalUsd = Number(r.total_usd) || 0;
    const countUsd = Number(r.count_usd) || 0;
    const distinctDonors = Number(r.distinct_donors) || 0;
    const count = Number(r.count) || 0;
    const byCurrency = {};
    for (const row of byCurrencyRes.rows) {
      byCurrency[row.currency] = Number(row.total) || 0;
    }

    return res.json({
      total: totalUsd > 0 ? totalUsd : null,
      today: Number(r.today_usd) || 0,
      month: Number(r.month_usd) || 0,
      average: countUsd > 0 ? Math.round(totalUsd / countUsd) : 0,
      donors: distinctDonors,
      count,
      by_currency: byCurrency,
    });
  } catch (err) {
    console.error('[donations/stats] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Les statistiques sont temporairement indisponibles. Veuillez réessayer plus tard.' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};