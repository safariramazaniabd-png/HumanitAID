const express = require('express');
const env = require('../config/env');
const auth = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { query } = require('../config/database');
const { ROLES } = require('../../shared/constants');

const router = express.Router();

const DEMO_SETTINGS = {
  site_name: 'HumanitAID Foundation',
  site_description: 'Fondation humanitaire d\'urgence pour la République Démocratique du Congo.',
  contact_email: 'contact@humanit-aid.org',
  contact_phone: '+243 999 000 000',
  address: 'Avenue Lumumba, 12, Goma, Nord-Kivu, RDC',
  facebook_url: 'https://facebook.com/humanitaid',
  twitter_url: 'https://twitter.com/humanitaid',
  instagram_url: 'https://instagram.com/humanitaid',
  youtube_url: 'https://youtube.com/humanitaid',
  donation_goal: 2000000,
  currency: 'USD',
  stripe_enabled: true,
  flutterwave_enabled: true,
  paystack_enabled: false,
  maintenance_mode: false,
  footer_text: '© 2026 HumanitAID Foundation. Tous droits réservés.',
};

const PUBLIC_KEYS = ['site_name', 'site_description', 'contact_email', 'contact_phone', 'address', 'facebook_url', 'twitter_url', 'instagram_url', 'youtube_url', 'donation_goal', 'currency', 'footer_text', 'maintenance_mode'];

router.get('/', async (req, res) => {
  if (env.demoMode) {
    const isAdmin = req.user && (req.user.role === ROLES.ADMIN || req.user.role === ROLES.SUPER_ADMIN);
    const settings = isAdmin ? DEMO_SETTINGS : Object.fromEntries(PUBLIC_KEYS.map((k) => [k, DEMO_SETTINGS[k]]));
    return res.json({ settings });
  }

  try {
    const { rows } = await query('SELECT * FROM settings');
    const all = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const isAdmin = req.user && (req.user.role === ROLES.ADMIN || req.user.role === ROLES.SUPER_ADMIN);
    const settings = isAdmin ? all : Object.fromEntries(PUBLIC_KEYS.map((k) => [k, all[k]]));
    return res.json({ settings });
  } catch (err) {
    console.error('[Settings] List error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    return res.json({ settings: { ...DEMO_SETTINGS, ...req.body }, message: 'Paramètres mis à jour (mode démo).' });
  }

  try {
    for (const [key, value] of Object.entries(req.body)) {
      await query(
        `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2`,
        [key, value]
      );
    }
    return res.json({ message: 'Paramètres mis à jour.' });
  } catch (err) {
    console.error('[Settings] Update error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
