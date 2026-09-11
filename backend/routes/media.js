const express = require('express');
const env = require('../config/env');
const auth = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { upload, verifyUploadedFile } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/security');
const { query } = require('../config/database');
const { ROLES, MEDIA_CATEGORIES } = require('../../shared/constants');
const storageService = require('../services/storageService');

const router = express.Router();

const DEMO_MEDIA = [
  { id: 'c1a2b3c4-d5e6-7f89-0a1b-2c3d4e5f6a7b', filename: 'camp-goma-urgence.jpg', original_name: 'Camp_de_deplacement_Goma.jpg', mime_type: 'image/jpeg', size: 2450000, url: '/uploads/camp-goma-urgence.jpg', category: 'Terrain', alt: 'Camp de déplacement à Goma', created_at: '2026-08-25T10:00:00Z' },
  { id: 'd2b3c4d5-e6f7-8901-b2c3-d4e5f6a7b8c9', filename: 'ecole-mobile-sudkivu.jpg', original_name: 'Ecole_mobile_Sud_Kivu.jpg', mime_type: 'image/jpeg', size: 1800000, url: '/uploads/ecole-mobile-sudkivu.jpg', category: 'Communities', alt: 'École mobile au Sud-Kivu', created_at: '2026-08-20T14:00:00Z' },
  { id: 'e3c4d5e6-f7a8-9012-c3d4-e5f6a7b8c9d0', filename: 'equipe-sante-ituri.jpg', original_name: 'Equipe_sante_Ituri.jpg', mime_type: 'image/jpeg', size: 3200000, url: '/uploads/equipe-sante-ituri.jpg', category: 'Humanitarian Response', alt: 'Équipe médicale en Ituri', created_at: '2026-08-15T08:00:00Z' },
  { id: 'f4d5e6f7-a8b9-0123-d4e5-f6a7b8c9d0e1', filename: 'distribution-eau-bukavu.mp4', original_name: 'Distribution_eau_Bukavu.mp4', mime_type: 'video/mp4', size: 45000000, url: '/uploads/distribution-eau-bukavu.mp4', category: 'Terrain', alt: 'Distribution d\'eau à Bukavu', created_at: '2026-08-10T12:00:00Z' },
  { id: 'a5e6f7a8-b9c0-1234-e5f6-a7b8c9d0e1f2', filename: 'ceremonie-remerciement.jpg', original_name: 'Ceremonie_remerciement.jpg', mime_type: 'image/jpeg', size: 1500000, url: '/uploads/ceremonie-remerciement.jpg', category: 'Events', alt: 'Cérémonie de remerciement aux partenaires', created_at: '2026-08-05T16:00:00Z' },
  { id: 'b6f7a8b9-c0d1-2345-f6a7-b8c9d0e1f2a3', filename: 'benevolat-bukavu.jpg', original_name: 'Benevolat_Bukavu.jpg', mime_type: 'image/jpeg', size: 2100000, url: '/uploads/benevolat-bukavu.jpg', category: 'Volunteers', alt: 'Bénévoles à Bukavu', created_at: '2026-07-30T09:00:00Z' },
];

router.get('/', async (req, res) => {
  if (env.demoMode) {
    let media = [...DEMO_MEDIA];
    const { category } = req.query;
    if (category) media = media.filter((m) => m.category === category);
    return res.json({ media, total: media.length });
  }

  try {
    const { category } = req.query;
    let where = '';
    const params = [];
    if (category) { where = 'WHERE category = $1'; params.push(category); }
    const { rows } = await query(`SELECT * FROM media ${where} ORDER BY created_at DESC`, params);
    return res.json({ media: rows, total: rows.length });
  } catch (err) {
    console.error('[Media] List error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/upload', auth, requireMinRole(ROLES.EDITOR), uploadLimiter, upload.single('file'), verifyUploadedFile, async (req, res) => {
  if (env.demoMode) {
    return res.json({ media: { id: 'c7a8b9c0-d1e2-3456-a7b8-c9d0e1f2a3b4', filename: 'nouveau-upload.jpg', original_name: req.file?.originalname || 'upload.jpg', mime_type: req.file?.mimetype || 'image/jpeg', size: req.file?.size || 1000000, url: '/uploads/nouveau-upload.jpg', category: req.body.category || 'Terrain', alt: req.body.alt || '', created_at: new Date().toISOString() } });
  }

  try {
    const saved = await storageService.save(req.file, 'media');
    const { rows } = await query(
      `INSERT INTO media (filename, original_name, mime_type, size, url, alt_text, category, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [saved.filename, req.file.originalname, req.file.mimetype, req.file.size, saved.url, req.body.alt || '', req.body.category || 'Terrain', req.user.id]
    );
    return res.status(201).json({ media: rows[0] });
  } catch (err) {
    console.error('[Media] Upload error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    return res.json({ message: 'Média supprimé' });
  }

  try {
    const { rowCount } = await query('DELETE FROM media WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Média introuvable' });
    return res.json({ message: 'Média supprimé' });
  } catch (err) {
    console.error('[Media] Delete error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
