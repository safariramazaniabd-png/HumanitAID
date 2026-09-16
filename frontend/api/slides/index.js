/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   GET /api/slides

   Diaporama public (hero + field stories). Source de vérité :
   table PostgreSQL `slides` — seuls les slides actifs
   (is_active = true) sont exposés, triés par display_order.
   Aucune donnée de secours fictive : si la base ne contient
   aucun slide, réponse { slides: [] }.

   Variables d'environnement (Vercel Dashboard) :
     DATABASE_URL  (private) — Postgres/Supabase, requis.

   Sécurité :
     - GET uniquement.
     - SQL paramétré (aucune interpolation utilisateur).
     - Aucune donnée sensible exposée (colonnes publiques uniquement).
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions } = require('../_shared');

const SLIDE_TYPES = ['hero', 'field_story'];
const PUBLIC_COLUMNS =
  'id, type, title, subtitle, description, image_url, video_url, cta_text, cta_url, is_main, duration, display_order';

module.exports = async function listSlides(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[slides] DATABASE_URL manquant — contenu indisponible');
    return res.status(503).json({ error: 'Les contenus sont temporairement indisponibles. Veuillez réessayer plus tard.' });
  }

  const { type } = req.query || {};
  if (type !== undefined && !SLIDE_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Type de slide invalide' });
  }

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));
    const { rows } = await pool.query(
      `SELECT ${PUBLIC_COLUMNS}
         FROM slides
        WHERE is_active = true
          AND ($1::text IS NULL OR type = $1)
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
};