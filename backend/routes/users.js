const express = require('express');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const auth = require('../middleware/auth');
const { requireRole, requireMinRole } = require('../middleware/rbac');
const { query } = require('../config/database');
const { ROLES } = require('../../shared/constants');
const { validateUser, validationMiddleware, sanitize } = require('../middleware/validation');
const { buildUpdateQuery } = require('../middleware/sanitizers');

const router = express.Router();

const DEMO_USERS = [
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', email: 'admin@humanit-aid.org', name: 'Admin HumanitAID', role: ROLES.SUPER_ADMIN, avatar: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', email: 'marie.kahindo@humanit-aid.org', name: 'Dr. Marie Kahindo', role: ROLES.ADMIN, avatar: null, created_at: '2024-03-15T00:00:00Z' },
  { id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', email: 'jean.mukendi@humanit-aid.org', name: 'Jean-Pierre Mukendi', role: ROLES.EDITOR, avatar: null, created_at: '2024-06-01T00:00:00Z' },
  { id: 'd4e5f6a7-b8c9-0123-defa-234567890123', email: 'grace.nsimire@humanit-aid.org', name: 'Sœur Grâce Nsimire', role: ROLES.EDITOR, avatar: null, created_at: '2024-09-10T00:00:00Z' },
  { id: 'e5f6a7b8-c9d0-1234-efab-345678901234', email: 'finance@humanit-aid.org', name: 'Comptable HumanitAID', role: ROLES.FINANCE, avatar: null, created_at: '2025-01-01T00:00:00Z' },
  { id: 'f6a7b8c9-d0e1-2345-fabc-456789012345', email: 'viewer@humanit-aid.org', name: 'Observateur', role: ROLES.VIEWER, avatar: null, created_at: '2025-06-15T00:00:00Z' },
];

router.get('/', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    return res.json({ users: DEMO_USERS });
  }

  try {
    const { rows } = await query('SELECT id, email, name, role, avatar_url, created_at FROM users ORDER BY created_at ASC');
    return res.json({ users: rows });
  } catch (err) {
    console.error('[Users] List error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', auth, requireRole(ROLES.SUPER_ADMIN), validationMiddleware(validateUser), async (req, res) => {
  if (env.demoMode) {
    return res.json({
      user: {
        id: 'a7b8c9d0-e1f2-3456-abcd-567890123456',
        email: req.body.email || 'nouveau@humanit-aid.org',
        name: req.body.name || 'Nouvel utilisateur',
        role: req.body.role || ROLES.VIEWER,
        avatar: null,
        created_at: new Date().toISOString(),
      },
      message: 'Utilisateur créé (mode démo).',
    });
  }

  try {
    const { email, name, role, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, nom et mot de passe requis' });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO users (email, name, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id, email, name, role, avatar_url, created_at`,
      [email, name, role || ROLES.VIEWER, password_hash]
    );
    return res.status(201).json({ user: rows[0] });
  } catch (err) {
    console.error('[Users] Create error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    const user = DEMO_USERS.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    return res.json({ user: { ...user, ...req.body, updated_at: new Date().toISOString() } });
  }

  try {
    let body = { ...req.body };
    if (req.body.password) {
      body.password_hash = await bcrypt.hash(req.body.password, 12);
      delete body.password;
    }
    const update = buildUpdateQuery('users', { ...body, id: req.params.id });
    if (!update) return res.status(400).json({ error: 'Aucun champ à modifier' });
    const { rows } = await query(update.query.replace('RETURNING *', 'RETURNING id, email, name, role, avatar_url'), update.values);
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('[Users] Update error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', auth, requireRole(ROLES.SUPER_ADMIN), async (req, res) => {
  if (env.demoMode) {
    return res.json({ message: 'Utilisateur supprimé (mode démo).' });
  }

  try {
    const { rowCount } = await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    return res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    console.error('[Users] Delete error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
