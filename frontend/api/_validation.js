/* ═══════════════════════════════════════════════════════════
   HUMANITAID — frontend/api/_validation.js
   (préfixe "_" : Vercel ne déploie pas ce fichier comme endpoint)

   Validation métier pour les routes d'écriture admin (posts, news,
   testimonials, slides, causes). Porté de backend/middleware/validation.js,
   adapté au schéma réel (voir _sanitizers.js) et sans dépendance à
   shared/ (non inclus dans le build Vercel de frontend/).
   ═══════════════════════════════════════════════════════════ */

const { isValidUUID } = require('./_sanitizers');

const MAX_TITLE = 500;
const MAX_CONTENT = 50000;
const MAX_SLUG = 200;
const MAX_SUMMARY = 500;
const MAX_SEO_TITLE = 255;
const MAX_SEO_DESC = 1000;

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function generateSlug(title) {
  const base = sanitize(title)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
  const suffix = Date.now().toString(36).slice(-6);
  return base ? `${base}-${suffix}` : `sans-titre-${suffix}`;
}

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Champs communs à posts/news : titre, slug, résumé, contenu, statut, SEO.
// `allowedStatuses` diffère légèrement entre les tables (voir appelants).
function validateContentFields(body, { allowedStatuses, requireTitleMin = 3 }) {
  const errors = [];
  const { title, slug, summary, content, status, featured_image, is_featured, seo_title, seo_description } = body;

  if (title !== undefined) {
    if (!title || sanitize(title).length < requireTitleMin) {
      errors.push(`Titre requis (min ${requireTitleMin} caractères)`);
    } else if (sanitize(title).length > MAX_TITLE) {
      errors.push(`Titre trop long (max ${MAX_TITLE} caractères)`);
    }
  }

  if (slug !== undefined && slug !== null && slug !== '') {
    if (sanitize(slug).length < 3) errors.push('Slug requis (min 3 caractères)');
    if (sanitize(slug).length > MAX_SLUG) errors.push(`Slug trop long (max ${MAX_SLUG} caractères)`);
    if (!SLUG_REGEX.test(slug)) errors.push('Format de slug invalide (minuscules, chiffres, tirets uniquement)');
  }

  if (summary !== undefined && summary !== null && sanitize(summary).length > MAX_SUMMARY) {
    errors.push(`Résumé trop long (max ${MAX_SUMMARY} caractères)`);
  }

  if (content !== undefined && content !== null && sanitize(content).length > MAX_CONTENT) {
    errors.push(`Contenu trop long (max ${MAX_CONTENT} caractères)`);
  }

  if (status !== undefined && !allowedStatuses.includes(status)) {
    errors.push(`Statut invalide (doit être l'un de : ${allowedStatuses.join(', ')})`);
  }

  if (featured_image !== undefined && featured_image !== null && featured_image !== '' && !isValidUrl(featured_image)) {
    errors.push('featured_image doit être une URL valide');
  }

  if (is_featured !== undefined && typeof is_featured !== 'boolean') {
    errors.push('is_featured doit être un booléen');
  }

  if (seo_title !== undefined && seo_title !== null && sanitize(seo_title).length > MAX_SEO_TITLE) {
    errors.push(`Titre SEO trop long (max ${MAX_SEO_TITLE} caractères)`);
  }

  if (seo_description !== undefined && seo_description !== null && sanitize(seo_description).length > MAX_SEO_DESC) {
    errors.push('Description SEO trop longue');
  }

  return errors;
}

function validatePost(body, { partial = false } = {}) {
  const allowedStatuses = ['draft', 'scheduled', 'published', 'archived'];
  const errors = validateContentFields(body, { allowedStatuses });
  if (!partial && (body.title === undefined)) errors.push('Titre requis (min 3 caractères)');
  if (body.cause_id !== undefined && body.cause_id !== null && !isValidUUID(body.cause_id)) {
    errors.push('cause_id doit être un UUID valide ou null');
  }
  return errors;
}

function validateNews(body, { partial = false } = {}) {
  const allowedStatuses = ['draft', 'scheduled', 'published', 'archived'];
  const errors = validateContentFields(body, { allowedStatuses, requireTitleMin: 5 });
  if (!partial && (body.title === undefined)) errors.push('Titre requis (min 5 caractères)');
  return errors;
}

function validateTestimonial(body, { partial = false } = {}) {
  const errors = [];
  const { author_name, content, status, display_order } = body;

  if (!partial || author_name !== undefined) {
    if (!author_name || sanitize(author_name).length < 2) errors.push('Nom requis (min 2 caractères)');
  }
  if (!partial || content !== undefined) {
    if (!content || sanitize(content).length < 10) errors.push('Contenu requis (min 10 caractères)');
    if (content && sanitize(content).length > MAX_CONTENT) errors.push('Contenu trop long');
  }
  const allowedStatuses = ['draft', 'published', 'archived'];
  if (status !== undefined && !allowedStatuses.includes(status)) {
    errors.push(`Statut invalide (doit être l'un de : ${allowedStatuses.join(', ')})`);
  }
  if (display_order !== undefined && !Number.isInteger(display_order)) {
    errors.push('display_order doit être un entier');
  }
  return errors;
}

function validateSlide(body, { partial = false } = {}) {
  const errors = [];
  const { title, type, is_active, is_main, duration, display_order, image_url, video_url, cta_url } = body;

  if (!partial || title !== undefined) {
    if (!title || sanitize(title).length < 3) errors.push('Titre requis (min 3 caractères)');
  }
  const allowedTypes = ['hero', 'field_story'];
  if (type !== undefined && !allowedTypes.includes(type)) {
    errors.push(`Type invalide (doit être l'un de : ${allowedTypes.join(', ')})`);
  }
  if (is_active !== undefined && typeof is_active !== 'boolean') errors.push('is_active doit être un booléen');
  if (is_main !== undefined && typeof is_main !== 'boolean') errors.push('is_main doit être un booléen');
  if (duration !== undefined && (!Number.isInteger(duration) || duration < 1000)) {
    errors.push('duration doit être un entier (millisecondes, min 1000)');
  }
  if (display_order !== undefined && !Number.isInteger(display_order)) {
    errors.push('display_order doit être un entier');
  }
  for (const [field, value] of [['image_url', image_url], ['video_url', video_url], ['cta_url', cta_url]]) {
    if (value !== undefined && value !== null && value !== '' && !isValidUrl(value)) {
      errors.push(`${field} doit être une URL valide`);
    }
  }
  return errors;
}

// Pour PUT /api/causes/:id — seule une mise à jour est possible (jamais de
// création/suppression, les 5 causes sont fixes). goal/collected doivent
// rester des nombres positifs cohérents avec l'affichage public (barres
// de progression, pourcentages).
function validateCauseUpdate(body) {
  const errors = [];
  const { title, description, goal, collected, status, display_order, image_url } = body;

  if (title !== undefined && (!title || sanitize(title).length < 3)) {
    errors.push('Titre requis (min 3 caractères)');
  }
  if (description !== undefined && description !== null && sanitize(String(description)).length > MAX_CONTENT) {
    errors.push('Description trop longue');
  }
  if (goal !== undefined) {
    const n = Number(goal);
    if (!isFinite(n) || n < 0) errors.push('goal doit être un nombre positif');
  }
  if (collected !== undefined) {
    const n = Number(collected);
    if (!isFinite(n) || n < 0) errors.push('collected doit être un nombre positif');
  }
  const allowedStatuses = ['active', 'completed', 'paused', 'archived'];
  if (status !== undefined && !allowedStatuses.includes(status)) {
    errors.push(`Statut invalide (doit être l'un de : ${allowedStatuses.join(', ')})`);
  }
  if (display_order !== undefined && !Number.isInteger(display_order)) {
    errors.push('display_order doit être un entier');
  }
  if (image_url !== undefined && image_url !== null && image_url !== '' && !isValidUrl(image_url)) {
    errors.push('image_url doit être une URL valide');
  }
  return errors;
}

module.exports = {
  sanitize,
  isValidUrl,
  generateSlug,
  validatePost,
  validateNews,
  validateTestimonial,
  validateSlide,
  validateCauseUpdate,
};
