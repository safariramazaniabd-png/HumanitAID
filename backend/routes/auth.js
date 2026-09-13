const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { query } = require('../config/database');
const { ROLES } = require('../../shared/constants');

const router = express.Router();

const DEMO_ADMIN = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  email: 'admin@humanit-aid.org',
  name: 'Admin HumanitAID',
  role: ROLES.SUPER_ADMIN,
  avatar: null,
};

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  if (env.demoMode && process.env.NODE_ENV !== 'production') {
    if (email === 'admin@humanit-aid.org' && password === 'admin') {
      const token = signToken(DEMO_ADMIN);
      return res.json({ token, user: DEMO_ADMIN });
    }
    return res.status(401).json({ error: 'Identifiants incorrects (demo: admin@humanit-aid.org / admin)' });
  }

  try {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/me', auth, async (req, res) => {
  if (env.demoMode) {
    return res.json({ user: DEMO_ADMIN });
  }

  try {
    const { rows } = await query('SELECT id, email, name, role, avatar_url FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('[Auth] Me error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
