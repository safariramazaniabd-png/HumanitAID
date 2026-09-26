/* ═══════════════════════════════════════════════════════════
   HUMANITAID — frontend/api/_sanitizers.js
   (préfixe "_" : Vercel ne déploie pas ce fichier comme endpoint)

   Whitelist de colonnes autorisées en écriture (INSERT/UPDATE)
   par table, + builders de requêtes SQL paramétrées génériques.

   IMPORTANT : cette liste reflète le schéma RÉEL de la base
   Supabase de production (vérifié directement via
   information_schema.columns). posts.cause_id et posts.deleted_at
   ont été ajoutés par la migration database/migrations/002_posts_
   cause_relation_and_trash.sql, appliquée le 20/09/2026 (elle
   existait déjà dans le repo, écrite mais jamais exécutée).

   Sécurité : seules les colonnes listées ici peuvent être écrites,
   quel que soit le contenu du body reçu — protection anti
   mass-assignment (ex: impossible d'écrire `id`, `created_at`,
   `view_count` directement depuis l'API).
   ═══════════════════════════════════════════════════════════ */

const ALLOWED_COLUMNS = {
  posts: [
    'title', 'slug', 'summary', 'content', 'featured_image', 'gallery',
    'video_url', 'category', 'location', 'cause_id', 'status', 'is_featured',
    'published_at', 'scheduled_at', 'seo_title', 'seo_description', 'og_image',
  ],
  news: [
    'title', 'slug', 'summary', 'content', 'featured_image', 'gallery',
    'video_url', 'category', 'status', 'is_featured', 'published_at',
    'seo_title', 'seo_description', 'og_image',
  ],
  testimonials: [
    'author_name', 'category', 'location', 'content', 'photo_url',
    'video_url', 'status', 'display_order',
  ],
  slides: [
    'type', 'title', 'subtitle', 'description', 'image_url', 'video_url',
    'cta_text', 'cta_url', 'is_active', 'is_main', 'duration', 'display_order',
  ],
  causes: [
    'title', 'description', 'image_url', 'goal', 'collected', 'status', 'display_order',
    // 'slug' est volontairement exclu : changer le slug d'une cause casserait
    // tous les liens déjà partagés/indexés et la propagation carte→formulaire
    // (frontend/js/donation.js s'appuie sur ces 5 slugs fixes).
  ],
};

// UPDATE <table> SET col=$1, ... WHERE id=$n RETURNING *
// Ignore silencieusement toute clé du body absente de la whitelist.
function buildUpdateQuery(table, id, body) {
  const allowed = ALLOWED_COLUMNS[table] || [];
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(body[key]);
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const sql = `UPDATE ${table} SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
  return { sql, values };
}

// INSERT INTO <table> (col, ...) VALUES ($1, ...) RETURNING *
function buildInsertQuery(table, body) {
  const allowed = ALLOWED_COLUMNS[table] || [];
  const cols = [];
  const placeholders = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
      cols.push(key);
      placeholders.push(`$${idx++}`);
      values.push(body[key]);
    }
  }

  if (cols.length === 0) return null;

  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
  return { sql, values };
}

// UUID v4-ish (accepte aussi v1-v5, suffisant pour valider une forme d'UUID)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUUID(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

module.exports = { ALLOWED_COLUMNS, buildUpdateQuery, buildInsertQuery, isValidUUID };
