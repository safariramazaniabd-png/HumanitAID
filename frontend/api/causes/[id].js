/* ═══════════════════════════════════════════════════════════
   HUMANITAID — Vercel Serverless Function
   PUT /api/causes/:id — admin (rôle admin, pas editor : ce sont
                          des objectifs financiers publics)

   Les 5 causes sont fixes : jamais de création ni de suppression
   ici, seulement une mise à jour de leurs champs (titre,
   description, image, objectif, montant collecté, statut, ordre
   d'affichage). Le slug est volontairement exclu de la whitelist
   (voir _sanitizers.js) — le changer casserait la propagation
   carte→formulaire (frontend/js/donation.js) et tout lien déjà
   partagé.
   ═══════════════════════════════════════════════════════════ */

const { redact, buildPgOptions, requireAdmin } = require('../_shared');
const { buildUpdateQuery, isValidUUID } = require('../_sanitizers');
const { validateCauseUpdate } = require('../_validation');

module.exports = async function causeById(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const admin = requireAdmin(req, res, 'admin');
  if (!admin) return;

  const { id } = req.query || {};
  if (!id || !isValidUUID(id)) return res.status(400).json({ error: 'Identifiant invalide' });

  const body = req.body || {};
  const errors = validateCauseUpdate(body);
  if (errors.length) return res.status(400).json({ error: 'Données invalides', details: errors });

  const update = buildUpdateQuery('causes', id, body);
  if (!update) return res.status(400).json({ error: 'Aucune donnée exploitable' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[causes/:id] DATABASE_URL manquant');
    return res.status(503).json({ error: 'Service temporairement indisponible.' });
  }

  let pool = null;
  try {
    const { Pool } = require('pg');
    pool = new Pool(buildPgOptions(databaseUrl));
    const { rows } = await pool.query(update.sql, update.values);
    if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
    return res.json({ cause: rows[0] });
  } catch (err) {
    console.error('[causes/:id] Erreur:', redact(err && err.message ? err.message : err));
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
};
