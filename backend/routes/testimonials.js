const express = require('express');
const env = require('../config/env');
const auth = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { query } = require('../config/database');
const { ROLES, TESTIMONIAL_CATEGORIES } = require('../../shared/constants');
const { validateTestimonial, validationMiddleware, sanitize } = require('../middleware/validation');
const { buildUpdateQuery } = require('../middleware/sanitizers');

const router = express.Router();

const DEMO_TESTIMONIALS = [
  {
    id: '20000001-0000-4000-a000-000000000001',
    name: 'Marie Kahindo',
    role: 'Bénéficiaire',
    category: 'Beneficiary',
    content: 'Quand nous avons fui notre village de Rutshuru, nous avions tout perdu. HumanitAID nous a accueillis, nourris et accompagnés. Mes enfants ont pu reprendre l\'école grâce à leurs écoles mobiles. Je ne serais plus là sans eux.',
    rating: 5,
    avatar: null,
    created_at: '2026-08-20T10:00:00Z',
  },
  {
    id: '20000002-0000-4000-a000-000000000002',
    name: 'Pierre Mutombo',
    role: 'Bénévole',
    category: 'Volunteer',
    content: 'En tant que médecin bénévole, j\'ai vu HumanitAID opérer dans les conditions les plus difficiles. Leur organisation est remarquable et leur impact réel. Je suis fier de faire partie de cette mission.',
    rating: 5,
    avatar: null,
    created_at: '2026-08-18T14:00:00Z',
  },
  {
    id: '20000003-0000-4000-a000-000000000003',
    name: 'Sophie Laurent',
    role: 'Donateure',
    category: 'Donor',
    content: 'Je fais des dons réguliers à HumanitAID depuis 2023. Les rapports d\'activité sont transparents et je vois que chaque euro a un impact concret sur la vie des populations déplacées en RDC.',
    rating: 5,
    avatar: null,
    created_at: '2026-08-15T09:00:00Z',
  },
  {
    id: '20000004-0000-4000-a000-000000000004',
    name: 'Grâce Nsimire',
    role: 'Aidante communautaire',
    category: 'Field Worker',
    content: 'Depuis 4 ans, j\'accompagne les femmes survivantes de violences dans les camps. Grâce au programme de soutien psychosocial d\'HumanitAID, des dizaines de femmes ont retrouvé la force de vivre.',
    rating: 5,
    avatar: null,
    created_at: '2026-08-10T11:00:00Z',
  },
  {
    id: '20000005-0000-4000-a000-000000000005',
    name: 'Croix-Rouge française',
    role: 'Partenaire institutionnel',
    category: 'Partner',
    content: 'La collaboration avec HumanitAID a permis de coordonner efficacement l\'aide humanitaire dans le Nord-Kivu. Leur connaissance du terrain et leur rigueur sont des atouts précieux.',
    rating: 5,
    avatar: null,
    created_at: '2026-08-05T16:00:00Z',
  },
  {
    id: '20000006-0000-4000-a000-000000000006',
    name: 'Jean-Pierre Mukendi',
    role: 'Directeur d\'école mobile',
    category: 'Field Worker',
    content: 'Chaque matin, je vois 120 enfants qui arrivent à l\'école mobile avec un sourire. C\'est la preuve que l\'éducation peut transformer des vies même dans les pires circonstances. Merci HumanitAID.',
    rating: 5,
    avatar: null,
    created_at: '2026-07-28T08:00:00Z',
  },
];

router.get('/', async (req, res) => {
  if (env.demoMode) {
    let testimonials = [...DEMO_TESTIMONIALS];
    const { category, page = 1, limit = 10 } = req.query;
    if (category) testimonials = testimonials.filter((t) => t.category === category);
    const start = (page - 1) * limit;
    return res.json({ testimonials: testimonials.slice(start, start + Number(limit)), total: testimonials.length, page: Number(page), limit: Number(limit) });
  }

  try {
    const { category, page = 1, limit = 10 } = req.query;
    let where = [];
    let params = [];
    let idx = 1;
    if (category) { where.push(`category = $${idx++}`); params.push(category); }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (page - 1) * limit;
    const countRes = await query(`SELECT COUNT(*) FROM testimonials ${whereClause}`, params);
    const { rows } = await query(`SELECT * FROM testimonials ${whereClause} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`, [...params, Number(limit), offset]);
    return res.json({ testimonials: rows, total: Number(countRes.rows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[Testimonials] List error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', auth, requireMinRole(ROLES.EDITOR), validationMiddleware(validateTestimonial), async (req, res) => {
  if (env.demoMode) {
    return res.json({ testimonial: { id: '20000007-0000-4000-a000-000000000007', ...req.body, created_at: new Date().toISOString() } });
  }

  try {
    const { author_name, category, location, content, photo_url, status, display_order } = req.body;
    const { rows } = await query(
      `INSERT INTO testimonials (author_name, category, location, content, photo_url, status, display_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [author_name, category, location, content, photo_url || null, status || 'draft', display_order || 0]
    );
    return res.status(201).json({ testimonial: rows[0] });
  } catch (err) {
    console.error('[Testimonials] Create error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', auth, requireMinRole(ROLES.EDITOR), async (req, res) => {
  if (env.demoMode) {
    const t = DEMO_TESTIMONIALS.find((x) => x.id === req.params.id);
    if (!t) return res.status(404).json({ error: 'Témoignage introuvable' });
    return res.json({ testimonial: { ...t, ...req.body, updated_at: new Date().toISOString() } });
  }

  try {
    const update = buildUpdateQuery('testimonials', { ...req.body, id: req.params.id });
    if (!update) return res.status(400).json({ error: 'Aucun champ à modifier' });
    const { rows } = await query(update.query, update.values);
    if (!rows[0]) return res.status(404).json({ error: 'Témoignage introuvable' });
    return res.json({ testimonial: rows[0] });
  } catch (err) {
    console.error('[Testimonials] Update error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    return res.json({ message: 'Témoignage supprimé' });
  }

  try {
    const { rowCount } = await query('DELETE FROM testimonials WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Témoignage introuvable' });
    return res.json({ message: 'Témoignage supprimé' });
  } catch (err) {
    console.error('[Testimonials] Delete error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
