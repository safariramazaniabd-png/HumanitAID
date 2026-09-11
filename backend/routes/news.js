const express = require('express');
const env = require('../config/env');
const auth = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { query } = require('../config/database');
const { ROLES, NEWS_CATEGORIES } = require('../../shared/constants');
const { validateNews, validationMiddleware, sanitize } = require('../middleware/validation');
const { buildUpdateQuery } = require('../middleware/sanitizers');

const router = express.Router();

const DEMO_NEWS = [
  {
    id: '30000001-0000-4000-b000-000000000001',
    title: 'Urgence choléra à Goma : HumanitAID déploie des équipes d\'urgence',
    slug: 'urgence-cholera-goma',
    excerpt: 'Face à la recrudescence du choléra dans les camps de déplacés autour de Goma, HumanitAID a mobilisé 8 équipes médicales d\'urgence.',
    content: '<p>La situation sanitaire à Goma se détériore rapidement. Depuis début août, plus de 1 200 cas de choléra ont été enregistrés dans les sites de déplacement.</p><p>HumanitAID a immédiatement déployé 8 équipes médicales, installé 5 centres de traitement du choléra et distribué 10 000 tablets de purification d\'eau.</p><p>« Nous faisons face à une situation critique. L\'eau contaminée est la principale cause de la propagation », explique le Dr. Marie Kahindo, coordinatrice médicale sur le terrain.</p>',
    category: 'Urgence',
    author_name: 'Dr. Marie Kahindo',
    featured_image: null,
    published_at: '2026-08-30T08:00:00Z',
    created_at: '2026-08-30T07:00:00Z',
  },
  {
    id: '30000002-0000-4000-b000-000000000002',
    title: 'Le programme nutrition de l\'Ituri sauve 2 000 enfants en 3 mois',
    slug: 'programme-nutrition-ituri-enfants',
    excerpt: 'Le programme thérapeutique de HumanitAID dans la province de l\'Ituri a traité avec succès 2 000 enfants souffrant de malnutrition aiguë.',
    content: '<p>En trois mois seulement, le programme nutrition d\'HumanitAID dans l\'Ituri a permis de traiter 2 000 enfants de moins de 5 ans souffrant de malnutrition aiguë sévère et modérée.</p><p>Grâce à la collaboration avec les communautés locales et le dépistage actif, le taux de guérison atteint 94%.</p>',
    category: 'Terrain',
    author_name: 'Jean-Pierre Mukendi',
    featured_image: null,
    published_at: '2026-08-22T10:00:00Z',
    created_at: '2026-08-22T09:00:00Z',
  },
  {
    id: '30000003-0000-4000-b000-000000000003',
    title: 'Témoignage : comment la formation professionnelle a changé la vie de Jacques',
    slug: 'temoignage-formation-jacques',
    excerpt: 'Jacques, ancien déplacé du Nord-Kivu, a suivi une formation en menuiserie grâce à HumanitAID et aujourd\'hui il forme d\'autres jeunes.',
    content: '<p>Jacques Bwavik, 28 ans, a fui Bunia en 2024 après l\'attaque de son village. Arrivé au camp de déplacement de Bunia, il n\'avait plus d\'espoir.</p><p>Grâce au programme de formation professionnelle d\'HumanitAID, Jacques a appris la menuiserie. Aujourd\'hui, il dirige un petit atelier et forme 15 jeunes déplacés.</p><p>« HumanitAID m\'a redonné la dignité. Je peux nourrir ma famille et aider les autres ».</p>',
    category: 'Témoignage',
    author_name: 'Sœur Grâce Nsimire',
    featured_image: null,
    published_at: '2026-08-14T12:00:00Z',
    created_at: '2026-08-14T11:00:00Z',
  },
  {
    id: '30000004-0000-4000-b000-000000000004',
    title: 'Partenariat avec l\'ONU : HumanitAID intègre le plan de réponse humanitaire 2026',
    slug: 'partenariat-onu-plan-reponse-2026',
    excerpt: 'HumanitAID a été sélectionnée pour faire partie du plan de réponse humanitaire coordonné par l\'ONU en RDC pour 2026-2027.',
    content: '<p>HumanitAID est officiellement intégrée au Plan de réponse humanitaire (HRP) 2026-2027 de l\'ONU pour la République Démocratique du Congo.</p><p>Ce partenariat permettra de coordonner nos actions avec les autres organisations humanitaires et d\'atteindre davantage de bénéficiaires dans les provinces les plus touchées par le conflit.</p>',
    category: 'Partenariat',
    author_name: 'Direction Générale',
    featured_image: null,
    published_at: '2026-08-01T14:00:00Z',
    created_at: '2026-08-01T10:00:00Z',
  },
];

router.get('/', async (req, res) => {
  if (env.demoMode) {
    let news = [...DEMO_NEWS];
    const { category, search, page = 1, limit = 10 } = req.query;
    if (category) news = news.filter((n) => n.category === category);
    if (search) {
      const q = search.toLowerCase();
      news = news.filter((n) => n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q));
    }
    const start = (page - 1) * limit;
    return res.json({ news: news.slice(start, start + Number(limit)), total: news.length, page: Number(page), limit: Number(limit) });
  }

  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    let where = [];
    let params = [];
    let idx = 1;
    if (category) { where.push(`category = $${idx++}`); params.push(category); }
    if (search) { where.push(`(title ILIKE $${idx} OR excerpt ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (page - 1) * limit;
    const countRes = await query(`SELECT COUNT(*) FROM news ${whereClause}`, params);
    const { rows } = await query(`SELECT * FROM news ${whereClause} ORDER BY published_at DESC NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`, [...params, Number(limit), offset]);
    return res.json({ news: rows, total: Number(countRes.rows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[News] List error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:slug', async (req, res) => {
  if (env.demoMode) {
    const article = DEMO_NEWS.find((n) => n.slug === req.params.slug || n.id === req.params.slug);
    if (!article) return res.status(404).json({ error: 'Article introuvable' });
    return res.json({ article });
  }

  try {
    const { rows } = await query('SELECT * FROM news WHERE slug = $1 OR id = $1', [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ error: 'Article introuvable' });
    return res.json({ article: rows[0] });
  } catch (err) {
    console.error('[News] Get error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', auth, requireMinRole(ROLES.EDITOR), validationMiddleware(validateNews), async (req, res) => {
  if (env.demoMode) {
    return res.json({ article: { id: '30000005-0000-4000-b000-000000000005', ...req.body, created_at: new Date().toISOString() } });
  }

  try {
    const { title, slug, summary, content, category, featured_image, status, is_featured } = req.body;
    const { rows } = await query(
      `INSERT INTO news (title, slug, summary, content, category, author_id, featured_image, status, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title, slug, summary, content, category, req.user.id, featured_image, status || 'draft', is_featured || false]
    );
    return res.status(201).json({ article: rows[0] });
  } catch (err) {
    console.error('[News] Create error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', auth, requireMinRole(ROLES.EDITOR), async (req, res) => {
  if (env.demoMode) {
    const article = DEMO_NEWS.find((n) => n.id === req.params.id);
    if (!article) return res.status(404).json({ error: 'Article introuvable' });
    return res.json({ article: { ...article, ...req.body, updated_at: new Date().toISOString() } });
  }

  try {
    const update = buildUpdateQuery('news', { ...req.body, id: req.params.id });
    if (!update) return res.status(400).json({ error: 'Aucun champ à modifier' });
    const { rows } = await query(update.query, update.values);
    if (!rows[0]) return res.status(404).json({ error: 'Article introuvable' });
    return res.json({ article: rows[0] });
  } catch (err) {
    console.error('[News] Update error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    return res.json({ message: 'Article supprimé' });
  }

  try {
    const { rowCount } = await query('DELETE FROM news WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Article introuvable' });
    return res.json({ message: 'Article supprimé' });
  } catch (err) {
    console.error('[News] Delete error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
