const express = require('express');
const env = require('../config/env');
const auth = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { query } = require('../config/database');
const { ROLES, DEFAULT_CAUSES } = require('../../shared/constants');
const { buildUpdateQuery } = require('../middleware/sanitizers');

const router = express.Router();

router.get('/', async (req, res) => {
  if (env.demoMode) {
    return res.json({ causes: DEFAULT_CAUSES });
  }

  try {
    const { rows } = await query('SELECT * FROM causes ORDER BY display_order ASC');
    return res.json({ causes: rows });
  } catch (err) {
    console.error('[Causes] List error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:slug', async (req, res) => {
  if (env.demoMode) {
    const cause = DEFAULT_CAUSES.find((c) => c.slug === req.params.slug);
    if (!cause) return res.status(404).json({ error: 'Cause introuvable' });
    return res.json({ cause });
  }

  try {
    const { rows } = await query('SELECT * FROM causes WHERE slug = $1', [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ error: 'Cause introuvable' });
    return res.json({ cause: rows[0] });
  } catch (err) {
    console.error('[Causes] Get error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    const cause = DEFAULT_CAUSES.find((c) => c.slug === req.params.id || c.order === Number(req.params.id));
    if (!cause) return res.status(404).json({ error: 'Cause introuvable' });
    return res.json({ cause: { ...cause, ...req.body } });
  }

  try {
    const update = buildUpdateQuery('causes', { ...req.body, id: req.params.id });
    if (!update) return res.status(400).json({ error: 'Aucun champ à modifier' });
    const { rows } = await query(update.query, update.values);
    if (!rows[0]) return res.status(404).json({ error: 'Cause introuvable' });
    return res.json({ cause: rows[0] });
  } catch (err) {
    console.error('[Causes] Update error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
