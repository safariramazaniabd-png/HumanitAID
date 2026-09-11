const express = require('express');
const env = require('../config/env');
const auth = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { query } = require('../config/database');
const { ROLES } = require('../../shared/constants');
const { buildUpdateQuery } = require('../middleware/sanitizers');

const router = express.Router();

const DEMO_SLIDES = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    type: 'hero',
    title: 'La crise en RDC ne s\'arrête pas — agissez maintenant',
    subtitle: 'Plus de 6 millions de déplacés ont besoin de votre aide urgente.',
    image: '/uploads/hero-goma-crise.jpg',
    cta_text: 'Faire un don',
    cta_link: '#donation',
    order: 1,
    active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    type: 'hero',
    title: 'Ensemble, sauvons des vies au cœur du conflit',
    subtitle: 'HumanitAID est sur le terrain depuis 2019. Chaque don compte.',
    image: '/uploads/hero-equipe-terrain.jpg',
    cta_text: 'Découvrir nos actions',
    cta_link: '#causes',
    order: 2,
    active: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    type: 'hero',
    title: 'Protégeons les enfants de la guerre',
    subtitle: '3 200 enfants ont repris les cours grâce à nos écoles mobiles.',
    image: '/uploads/hero-enfants-ecole.jpg',
    cta_text: 'Soutenir l\'éducation',
    cta_link: '#causes',
    order: 3,
    active: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    type: 'hero',
    title: 'L\'eau potable, un droit pour tous',
    subtitle: '200 000 personnes attendent votre aide pour accéder à l\'eau.',
    image: '/uploads/hero-eau-potable.jpg',
    cta_text: 'Aider maintenant',
    cta_link: '#donation',
    order: 4,
    active: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    type: 'field',
    title: 'Bukavu : distribution de vivres pour 8 000 familles',
    subtitle: 'Nos équipes ont distribué 120 tonnes de nourriture dans les sites de déplacement.',
    image: '/uploads/field-bukavu-vivres.jpg',
    order: 1,
    active: true,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    type: 'field',
    title: 'Ituri : campagne de vaccination contre la rougeole',
    subtitle: '12 000 enfants vaccinés en 3 semaines grâce à nos équipes mobiles.',
    image: '/uploads/field-ituri-vaccination.jpg',
    order: 2,
    active: true,
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    type: 'field',
    title: 'Nord-Kivu : centre de soins psychosociaux ouvert',
    subtitle: 'Accompagnement gratuit pour les survivants de violences dans le Territoire de Rutshuru.',
    image: '/uploads/field-nordkivu-psychosocial.jpg',
    order: 3,
    active: true,
  },
];

router.get('/', async (req, res) => {
  if (env.demoMode) {
    const { type } = req.query;
    let slides = [...DEMO_SLIDES];
    if (type) slides = slides.filter((s) => s.type === type);
    return res.json({ slides: slides.sort((a, b) => a.order - b.order) });
  }

  try {
    const { type } = req.query;
    const conditions = ['active = true'];
    const params = [];
    if (type) { conditions.push(`type = $${conditions.length}`); params.push(type); }
    const where = 'WHERE ' + conditions.join(' AND ');
    const { rows } = await query(`SELECT * FROM slides ${where} ORDER BY display_order ASC`, params);
    return res.json({ slides: rows });
  } catch (err) {
    console.error('[Slides] List error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    return res.json({ slide: { id: '88888888-8888-8888-8888-888888888888', ...req.body, active: true, created_at: new Date().toISOString() } });
  }

  try {
    const { type, title, subtitle, image_url, video_url, cta_text, cta_url, display_order, is_active } = req.body;
    const { rows } = await query(
      `INSERT INTO slides (type, title, subtitle, image_url, video_url, cta_text, cta_url, display_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [type, title, subtitle, image_url, video_url, cta_text, cta_url, display_order || 0, is_active !== false]
    );
    return res.status(201).json({ slide: rows[0] });
  } catch (err) {
    console.error('[Slides] Create error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/reorder', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    return res.json({ message: 'Ordre mis à jour' });
  }

  try {
    const { slides } = req.body;
    for (const slide of slides) {
      await query('UPDATE slides SET display_order = $1 WHERE id = $2', [slide.display_order ?? slide.order, slide.id]);
    }
    return res.json({ message: 'Ordre mis à jour' });
  } catch (err) {
    console.error('[Slides] Reorder error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    const slide = DEMO_SLIDES.find((s) => s.id === req.params.id);
    if (!slide) return res.status(404).json({ error: 'Slide introuvable' });
    return res.json({ slide: { ...slide, ...req.body, updated_at: new Date().toISOString() } });
  }

  try {
    const update = buildUpdateQuery('slides', { ...req.body, id: req.params.id });
    if (!update) return res.status(400).json({ error: 'Aucun champ à modifier' });
    const { rows } = await query(update.query, update.values);
    if (!rows[0]) return res.status(404).json({ error: 'Slide introuvable' });
    return res.json({ slide: rows[0] });
  } catch (err) {
    console.error('[Slides] Update error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    return res.json({ message: 'Slide supprimé' });
  }

  try {
    const { rowCount } = await query('DELETE FROM slides WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Slide introuvable' });
    return res.json({ message: 'Slide supprimé' });
  } catch (err) {
    console.error('[Slides] Delete error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
