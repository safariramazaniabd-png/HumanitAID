const ALLOWED_COLUMNS = {
  posts: ['title', 'slug', 'summary', 'content', 'featured_image', 'video_url', 'category', 'location', 'status', 'is_featured', 'published_at', 'scheduled_at', 'seo_title', 'seo_description', 'og_image'],
  news: ['title', 'slug', 'summary', 'content', 'featured_image', 'video_url', 'category', 'status', 'is_featured', 'published_at', 'seo_title', 'seo_description', 'og_image'],
  testimonials: ['author_name', 'category', 'location', 'content', 'photo_url', 'video_url', 'status', 'display_order'],
  slides: ['type', 'title', 'subtitle', 'description', 'image_url', 'video_url', 'cta_text', 'cta_url', 'is_active', 'is_main', 'duration', 'display_order'],
  causes: ['slug', 'title', 'description', 'image_url', 'goal', 'collected', 'status', 'display_order'],
  users: ['name', 'email', 'role', 'avatar_url', 'is_active', 'password_hash'],
  settings: ['site_name', 'site_description', 'contact_email', 'contact_phone', 'address', 'facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url', 'youtube_url'],
  donations: ['status'],
};

function buildUpdateQuery(table, body, idParam = 'id') {
  const allowed = ALLOWED_COLUMNS[table] || [];
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(body)) {
    if (allowed.includes(key) && value !== undefined && key !== idParam) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return null;
  }

  if (!body[idParam]) {
    return null;
  }

  values.push(body[idParam]);
  const query = `UPDATE ${table} SET ${fields.join(', ')}, updated_at = NOW() WHERE ${idParam} = $${idx} RETURNING *`;

  return { query, values };
}

function buildInsertQuery(table, body, columns) {
  const allowed = ALLOWED_COLUMNS[table] || [];
  const cols = [];
  const placeholders = [];
  const values = [];
  let idx = 1;

  for (const col of columns) {
    if (allowed.includes(col) && body[col] !== undefined) {
      cols.push(col);
      placeholders.push(`$${idx++}`);
      values.push(body[col]);
    }
  }

  if (cols.length === 0) {
    return null;
  }

  const query = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
  return { query, values };
}

module.exports = { ALLOWED_COLUMNS, buildUpdateQuery, buildInsertQuery };