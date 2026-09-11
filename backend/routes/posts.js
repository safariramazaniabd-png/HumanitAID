const express = require('express');
const env = require('../config/env');
const auth = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { query } = require('../config/database');
const { ROLES, POST_STATUS } = require('../../shared/constants');
const { validatePost, validationMiddleware, sanitize } = require('../middleware/validation');
const { buildUpdateQuery } = require('../middleware/sanitizers');

const router = express.Router();

const DEMO_POSTS = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Crise humanitaire à Goma : 500 000 déplacés en urgence',
    slug: 'crise-humanitaire-goma-500000-deplaces',
    excerpt: 'L\'escalade des violences à Goma a forcé plus de 500 000 personnes à quitter leurs foyers dans les dernières semaines.',
    content: '<p>La ville de Goma, dans le Nord-Kivu, fait face à l\'une des pires crises humanitaires de son histoire. Les affrontements armés entre groupes ont poussé des centaines de milliers de civils à fuir vers des zones déjà saturées.</p><p>HumanitAID a déployé 12 équipes sur le terrain pour fournir nourriture, eau potable et abris d\'urgence.</p>',
    status: POST_STATUS.PUBLISHED,
    category: 'Urgence',
    author_name: 'Dr. Marie Kahindo',
    featured_image: null,
    published_at: '2026-08-28T10:00:00Z',
    created_at: '2026-08-27T14:30:00Z',
  },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    title: 'Écoles mobiles : redonner un avenir aux enfants déplacés',
    slug: 'ecoles-mobiles-enfants-deplaces',
    excerpt: 'Notre programme d\'écoles mobiles a permis à 3 200 enfants de reprendre les cours dans les camps de déplacés du Sud-Kivu.',
    content: '<p>Depuis janvier 2026, HumanitAID a mis en place 45 écoles mobiles dans les sites de déplacement du Sud-Kivu. Ces écoles temporaires offrent un cadre sûr et un programme éducatif adapté aux enfants victimes du conflit.</p><p>Marie, 9 ans, nous raconte : "Quand je suis arrivée au camp, je ne savais pas si j\'allais jamais retourner à l\'école. Maintenant, je veux devenir médecin."</p>',
    status: POST_STATUS.PUBLISHED,
    category: 'Terrain',
    author_name: 'Jean-Pierre Mukendi',
    featured_image: null,
    published_at: '2026-08-20T08:00:00Z',
    created_at: '2026-08-19T16:00:00Z',
  },
  {
    id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    title: 'Témoignage de Fatima : survivante de violences sexuelles',
    slug: 'temoignage-fatima-survivante-violences',
    excerpt: 'Fatima, rescapée de violences sexuelles dans le Territoire de Rutshuru, partage son parcours de reconstruction.',
    content: '<p>Fatima a 24 ans. Elle a été victime de violences sexuelles lors d\'une attaque de son village en octobre 2025. Aujourd\'hui, grâce au soutien psychosocial d\'HumanitAID, elle reprend vie.</p><p>"Les conseillers m\'ont appris à ne pas avoir honte. Ce n\'est pas ma faute. Je veux que les autres femmes sachent qu\'il y a de l\'espoir."</p>',
    status: POST_STATUS.PUBLISHED,
    category: 'Témoignage',
    author_name: 'Sœur Grâce Nsimire',
    featured_image: null,
    published_at: '2026-08-15T12:00:00Z',
    created_at: '2026-08-14T09:00:00Z',
  },
  {
    id: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
    title: 'Recherche urgente : financer l\'eau potable pour 200 000 personnes',
    slug: 'recherche-urgence-eau-potable',
    excerpt: 'Nous collectons 150 000 $ pour installer des systèmes de purification d\'eau dans les zones de déplacement.',
    content: '<p>L\'accès à l\'eau potable reste le défi numéro 1 dans les camps de déplacés. Les épidémies de choléra se multiplient faute d\'installations sanitaires adéquates.</p><p>HumanitAID prévoit l\'installation de 30 points d\'eau et 10 unités de purification mobiles d\'ici décembre 2026.</p>',
    status: POST_STATUS.PUBLISHED,
    category: 'Plaidoyer',
    author_name: 'Chef de projet Amina Lubala',
    featured_image: null,
    published_at: '2026-08-10T07:30:00Z',
    created_at: '2026-08-09T11:00:00Z',
  },
  {
    id: '3d8f8a1e-7b2c-4e5f-9a1d-6c3b8f2e4d70',
    title: 'Partenariat avec l\'UNICEF : renforcer la nutrition infantile',
    slug: 'partenariat-unicef-nutrition-infantile',
    excerpt: 'Un accord stratégique avec l\'UNICEF pour traiter 15 000 enfants souffrant de malnutrition aiguë dans le Ituri.',
    content: '<p>HumanitAID et l\'UNICEF ont signé un partenariat de 2 ans pour lutter contre la malnutrition infantile dans la province de l\'Ituri. Le programme inclut la distribution de nourriture thérapeutique, le dépistage et la sensibilisation communautaire.</p><p>Pierre, 3 ans, a été sauvé grâce au programme pilote. Son père témoigne : "Sans HumanitAID, mon fils ne serait plus là."</p>',
    status: POST_STATUS.PUBLISHED,
    category: 'Partenariat',
    author_name: 'Directeur Thomas Kasongo',
    featured_image: null,
    published_at: '2026-08-05T14:00:00Z',
    created_at: '2026-08-04T10:00:00Z',
  },
  {
    id: 'a1e2f3d4-5b6c-7d8e-9f0a-1b2c3d4e5f60',
    title: 'Rapport semestriel : 47 000 bénéficiaires en 6 mois',
    slug: 'rapport-semestriel-47000-beneficiaires',
    excerpt: 'Notre rapport d\'activité du premier semestre 2026 montre une hausse de 35% du nombre de bénéficiaires atteints.',
    content: '<p>Au cours du premier semestre 2026, HumanitAID a assisté 47 320 bénéficiaires directs à travers ses programmes d\'urgence, d\'éducation, de santé et de soutien psychosocial.</p><p>Les fonds collectés ont permis de construire 12 centres de santé, 8 écoles et de distribuer plus de 200 tonnes de vivres.</p>',
    status: POST_STATUS.DRAFT,
    category: 'Rapport',
    author_name: 'Direction Générale',
    featured_image: null,
    published_at: null,
    created_at: '2026-08-01T09:00:00Z',
  },
];

router.get('/', async (req, res) => {
  if (env.demoMode) {
    let posts = [...DEMO_POSTS];
    const { status, search, page = 1, limit = 10 } = req.query;
    if (status) posts = posts.filter((p) => p.status === status);
    if (search) {
      const q = search.toLowerCase();
      posts = posts.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
    }
    const start = (page - 1) * limit;
    return res.json({ posts: posts.slice(start, start + Number(limit)), total: posts.length, page: Number(page), limit: Number(limit) });
  }

  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    let where = [];
    let params = [];
    let idx = 1;
    if (status) { where.push(`status = $${idx++}`); params.push(status); }
    if (search) { where.push(`(title ILIKE $${idx} OR excerpt ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (page - 1) * limit;
    const countRes = await query(`SELECT COUNT(*) FROM posts ${whereClause}`, params);
    const { rows } = await query(`SELECT * FROM posts ${whereClause} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`, [...params, Number(limit), offset]);
    return res.json({ posts: rows, total: Number(countRes.rows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[Posts] List error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  if (env.demoMode) {
    const post = DEMO_POSTS.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!post) return res.status(404).json({ error: 'Article introuvable' });
    return res.json({ post });
  }

  try {
    const { rows } = await query('SELECT * FROM posts WHERE id = $1 OR slug = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Article introuvable' });
    return res.json({ post: rows[0] });
  } catch (err) {
    console.error('[Posts] Get error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', auth, requireMinRole(ROLES.EDITOR), validationMiddleware(validatePost), async (req, res) => {
  if (env.demoMode) {
    return res.json({ post: { id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', ...req.body, created_at: new Date().toISOString() } });
  }

  try {
    const { title, slug, summary, content, status, category, featured_image, location, is_featured } = req.body;
    const { rows } = await query(
      `INSERT INTO posts (title, slug, summary, content, status, category, author_id, featured_image, location, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, slug, summary, content, status || 'draft', category, req.user.id, featured_image, location || null, is_featured || false]
    );
    return res.status(201).json({ post: rows[0] });
  } catch (err) {
    console.error('[Posts] Create error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', auth, requireMinRole(ROLES.EDITOR), async (req, res) => {
  if (env.demoMode) {
    const post = DEMO_POSTS.find((p) => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Article introuvable' });
    return res.json({ post: { ...post, ...req.body, updated_at: new Date().toISOString() } });
  }

  try {
    const update = buildUpdateQuery('posts', { ...req.body, id: req.params.id });
    if (!update) return res.status(400).json({ error: 'Aucun champ à modifier' });
    const { rows } = await query(update.query, update.values);
    if (!rows[0]) return res.status(404).json({ error: 'Article introuvable' });
    return res.json({ post: rows[0] });
  } catch (err) {
    console.error('[Posts] Update error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    return res.json({ message: 'Article supprimé' });
  }

  try {
    const { rowCount } = await query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Article introuvable' });
    return res.json({ message: 'Article supprimé' });
  } catch (err) {
    console.error('[Posts] Delete error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
