/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   GET /api/causes

   Causes publiques (campagnes de collecte). Source de vérité :
   table PostgreSQL `causes` — causes actives uniquement,
   triées par display_order. goal / collected sont convertis
   en nombres (DECIMAL → Number).

   Variables d'environnement (Vercel Dashboard) :
     DATABASE_URL  (private) — Postgres/Supabase, requis.

   Sécurité :
     - GET uniquement.
     - SQL paramétré.
     - Aucune donnée sensible (colonnes publiques uniquement).
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions } = require('../_shared');

module.exports = async function listCauses(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[causes] DATABASE_URL manquant — contenu indisponible');
    return res.status(503).json({ error: 'Les contenus sont temporairement indisponibles. Veuillez réessayer plus tard.' });
  }

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));
    const { rows } = await pool.query(
      `SELECT id, slug, title, description, image_url, goal, collected, status, display_order
         FROM causes
        WHERE status = 'active'
        ORDER BY display_order ASC, title ASC`
    );
    const causes = rows.map((c) => ({
      ...c,
      goal: Number(c.goal) || 0,
      collected: Number(c.collected) || 0,
    }));
    return res.json({ causes });
  } catch (err) {
    console.error('[causes] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Les contenus sont temporairement indisponibles. Veuillez réessayer plus tard.' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};