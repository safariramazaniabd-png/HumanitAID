const express = require('express');
const env = require('../config/env');
const auth = require('../middleware/auth');
const { requireMinRole } = require('../middleware/rbac');
const { query } = require('../config/database');
const { ROLES, POST_STATUS } = require('../../shared/constants');
const { validatePost, validationMiddleware, sanitize } = require('../middleware/validation');
const { buildUpdateQuery } = require('../middleware/sanitizers');

const router = express.Router();

// ── Données de démonstration ────────────────────────────────────────
// Ne sont jamais servies en production : gardées derrière env.demoMode,
// qui n'est actif que si la variable d'environnement DEMO_MODE=true est
// explicitement définie (jamais par défaut). Voir backend/config/env.js.
const DEMO_POSTS = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Exemple d\'article — Urgence',
    slug: 'exemple-article-urgence',
    excerpt: 'Ceci est un contenu de démonstration, affiché uniquement lorsque DEMO_MODE=true.',
    content: '<p>Contenu de démonstration.</p>',
    status: POST_STATUS.PUBLISHED,
    category: 'Urgence',
    cause_id: null,
    featured_image: null,
    published_at: '2026-08-28T10:00:00Z',
    created_at: '2026-08-27T14:30:00Z',
    deleted_at: null,
  },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    title: 'Exemple d\'article — Brouillon',
    slug: 'exemple-article-brouillon',
    excerpt: 'Ceci est un contenu de démonstration en brouillon.',
    content: '<p>Contenu de démonstration.</p>',
    status: POST_STATUS.DRAFT,
    category: 'Rapport',
    cause_id: null,
    featured_image: null,
    published_at: null,
    created_at: '2026-08-01T09:00:00Z',
    deleted_at: null,
  },
];

// GET /api/posts
// Query params : status, cause_id, search, page, limit
//   - par défaut : exclut la corbeille (deleted_at IS NULL)
//   - ?status=trashed : liste uniquement la corbeille
router.get('/', async (req, res) => {
  if (env.demoMode) {
    let posts = DEMO_POSTS.filter((p) => !p.deleted_at);
    const { status, cause_id, search, page = 1, limit = 10 } = req.query;
    if (status === 'trashed') posts = DEMO_POSTS.filter((p) => p.deleted_at);
    else if (status) posts = posts.filter((p) => p.status === status);
    if (cause_id) posts = posts.filter((p) => p.cause_id === cause_id);
    if (search) {
      const q = search.toLowerCase();
      posts = posts.filter((p) => p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q));
    }
    const start = (page - 1) * limit;
    return res.json({ posts: posts.slice(start, start + Number(limit)), total: posts.length, page: Number(page), limit: Number(limit) });
  }

  try {
    const { status, cause_id, search, page = 1, limit = 10 } = req.query;
    let where = [];
    let params = [];
    let idx = 1;

    if (status === 'trashed') {
      where.push('p.deleted_at IS NOT NULL');
    } else {
      where.push('p.deleted_at IS NULL');
      if (status) { where.push(`p.status = $${idx++}`); params.push(status); }
    }
    if (cause_id) { where.push(`p.cause_id = $${idx++}`); params.push(cause_id); }
    if (search) { where.push(`(p.title ILIKE $${idx} OR p.summary ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (page - 1) * limit;

    const countRes = await query(`SELECT COUNT(*) FROM posts p ${whereClause}`, params);
    const { rows } = await query(
      `SELECT p.*, c.slug AS cause_slug, c.title AS cause_title
       FROM posts p
       LEFT JOIN causes c ON c.id = p.cause_id
       ${whereClause}
       ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, Number(limit), offset]
    );
    return res.json({ posts: rows, total: Number(countRes.rows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[Posts] List error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  if (env.demoMode) {
    const post = DEMO_POSTS.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!post) return res.status(404).json({ error: 'Article introuvable' });
    if (post.deleted_at) return res.status(404).json({ error: 'Article introuvable' });
    return res.json({ post });
  }

  try {
    const { rows } = await query(
      `SELECT p.*, c.slug AS cause_slug, c.title AS cause_title
       FROM posts p
       LEFT JOIN causes c ON c.id = p.cause_id
       WHERE (p.id::text = $1 OR p.slug = $1) AND p.deleted_at IS NULL`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Article introuvable' });
    return res.json({ post: rows[0] });
  } catch (err) {
    console.error('[Posts] Get error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', auth, requireMinRole(ROLES.EDITOR), validationMiddleware(validatePost), async (req, res) => {
  if (env.demoMode) {
    return res.json({ post: { id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', ...req.body, created_at: new Date().toISOString(), deleted_at: null } });
  }

  try {
    const { title, slug, summary, content, status, category, cause_id, featured_image, location, is_featured } = req.body;
    const { rows } = await query(
      `INSERT INTO posts (title, slug, summary, content, status, category, cause_id, author_id, featured_image, location, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title, slug, summary, content, status || 'draft', category, cause_id || null, req.user.id, featured_image, location || null, is_featured || false]
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
    return res.json({ post: { ...post, ...req.body, updated_at: new Date().toISOString(), deleted_at: post.deleted_at } });
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

// DELETE /api/posts/:id — suppression douce (corbeille), jamais définitive ici.
router.delete('/:id', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    const post = DEMO_POSTS.find((p) => p.id === req.params.id);
    if (post) post.deleted_at = new Date().toISOString();
    return res.json({ message: 'Article déplacé dans la corbeille' });
  }

  try {
    const { rows } = await query(
      'UPDATE posts SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Article introuvable' });
    return res.json({ message: 'Article déplacé dans la corbeille' });
  } catch (err) {
    console.error('[Posts] Delete error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/posts/:id/restore — restaurer un article depuis la corbeille.
router.post('/:id/restore', auth, requireMinRole(ROLES.ADMIN), async (req, res) => {
  if (env.demoMode) {
    const post = DEMO_POSTS.find((p) => p.id === req.params.id);
    if (post) post.deleted_at = null;
    return res.json({ message: 'Article restauré' });
  }

  try {
    const { rows } = await query(
      'UPDATE posts SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Article introuvable ou déjà restauré' });
    return res.json({ message: 'Article restauré' });
  } catch (err) {
    console.error('[Posts] Restore error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;