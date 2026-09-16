/* ═══════════════════════════════════════════════════════════
   API CLIENT — HumanitAID Frontend
   Source de vérité : les endpoints publics Vercel
   (/api/slides, /api/causes, /api/testimonials, /api/news,
   /api/posts, /api/settings, /api/donations/stats) alimentés
   par PostgreSQL/Supabase.

   Aucun contenu de secours fictif : si l'API échoue ou renvoie
   une liste vide, les fetch* renvoient [] / null et l'interface
   affiche un état sobre (vide / masqué), jamais de fausses
   données HumanitAID. Le checkout et le webhook Stripe restent
   autoritaires (non modifiés par ce fichier).
   ═══════════════════════════════════════════════════════════ */

function resolveApiBase() {
  const cfg = window.HUMANITAID_CONFIG;
  if (cfg && cfg.API_BASE) {
    return cfg.API_BASE.replace(/\/+$/, '') + '/api';
  }
  return window.location.port
    ? `${window.location.protocol}//${window.location.hostname}:3000/api`
    : `${window.location.origin}/api`;
}

const API_BASE = resolveApiBase();

function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

const api = {
  async get(path) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`API GET ${path} indisponible (${err.message}) — affichage sobre (aucun contenu de secours).`);
      return null;
    }
  },

  async post(path, data) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`API POST ${path} failed:`, err.message);
      return null;
    }
  },
};

/* ═══════════════════════════════════════════════════════════
   HELPERS — conversion des données API (PostgreSQL) vers la
   forme attendue par le rendu du frontend.
   ═══════════════════════════════════════════════════════════ */

function extractArray(data, key) {
  if (!data) return null;
  if (Array.isArray(data)) return data;
  if (data[key] && Array.isArray(data[key])) return data[key];
  return null;
}

function toNum(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatDateFr(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const CAUSE_ICONS = {
  deplaces: 'tent',
  orphelins: 'baby',
  veuves: 'dove',
  victimes: 'bandage',
  handicapes: 'wheelchair',
};

const NEWS_ICONS = {
  urgence: 'alert',
  terrain: 'globe',
  'terrain-news': 'globe',
  temoignage: 'heart',
  plaidoyer: 'document',
  partenariat: 'hands',
  rapport: 'report',
};

function newsIcon(category) {
  const key = String(category || '').toLowerCase().trim();
  return NEWS_ICONS[key] || 'globe';
}

function testimonialSlug(category) {
  return String(category || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'default';
}

/* ═══════════════════════════════════════════════════════════
   DATA FETCHING — API réelle uniquement, jamais de fallback
   factice. [] (ou null) dès que le contenu réel est absent.
   ═══════════════════════════════════════════════════════════ */

async function fetchSlides() {
  const data = await api.get('/slides');
  const arr = extractArray(data, 'slides');
  if (!arr) return [];
  return arr.map((s, i) => ({
    id: s.id,
    title: s.title,
    caption: s.subtitle || '',
    badge: s.description || '',
    gradient: 'slide-' + ((i % 4) + 1),
    icon: s.type === 'field_story' ? 'tent' : 'hands',
    image: s.image_url || null,
    cta_text: s.cta_text || '',
    cta_url: s.cta_url || '',
  }));
}

async function fetchCauses() {
  const data = await api.get('/causes');
  const arr = extractArray(data, 'causes');
  if (!arr) return [];
  return arr.map((c, i) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description || '',
    collected: toNum(c.collected) || 0,
    goal: toNum(c.goal) || 0,
    image: c.image_url || null,
    icon: CAUSE_ICONS[c.slug] || 'hands',
    bgClass: null,
    priority: i + 1,
    link: '',
    status: c.status,
    donors: null,
    daysLeft: null,
  }));
}

async function fetchTestimonials() {
  const data = await api.get('/testimonials');
  const arr = extractArray(data, 'testimonials');
  if (!arr) return [];
  return arr.map((t) => ({
    id: t.id,
    category: testimonialSlug(t.category),
    text: t.content || '',
    author: t.author_name || '',
    location: t.location || '',
    date: formatDateFr(t.created_at),
    avatar: 'user',
  }));
}

async function fetchNews() {
  const data = await api.get('/news');
  const arr = extractArray(data, 'news');
  if (!arr) return [];
  return arr.map((n) => ({
    id: n.id,
    title: n.title,
    excerpt: n.summary || '',
    date: formatDateFr(n.published_at || n.created_at),
    category: n.category || 'Actualité',
    icon: newsIcon(n.category),
    featured: Boolean(n.is_featured),
    gradient: null,
    image: n.featured_image || null,
  }));
}

async function fetchStats() {
  const data = await api.get('/donations/stats');
  if (!data) return { raised: null, donors: null };
  return {
    raised: toNum(data.total),
    donors: toNum(data.donors) || toNum(data.count),
  };
}

async function fetchPublications() {
  const data = await api.get('/posts');
  const arr = extractArray(data, 'posts');
  if (!arr) return [];
  return arr.map((p) => ({
    id: p.id,
    title: p.title,
    date: formatDateFr(p.published_at || p.created_at),
    icon: 'document',
    type: p.category || 'Publication',
    image: p.featured_image || null,
    url: null,
  }));
}

async function fetchFieldStories() {
  const data = await api.get('/posts');
  const arr = extractArray(data, 'posts');
  if (!arr) return [];
  return arr.slice(0, 5).map((p) => ({
    id: p.slug || p.id,
    title: p.title,
    category: p.category || 'Terrain',
    excerpt: p.summary || '',
    date: formatDateFr(p.published_at || p.created_at),
    image: p.featured_image || null,
  }));
}

async function fetchPartners() {
  const data = await api.get('/settings');
  if (data && Array.isArray(data.partners)) {
    return data.partners.filter((p) => p && String(p).trim());
  }
  return [];
}

async function submitDonation(donationData) {
  const result = await api.post('/donations', donationData);
  if (!result) {
    return { success: false, error: I18N.t('don.err.submit') };
  }
  return {
    ...result,
    success: true,
    ref: (result.donation && (result.donation.reference || result.donation.id)) || 'HAD-' + Date.now().toString(36).toUpperCase(),
  };
}

async function createCheckoutSession(data) {
  try {
    const res = await fetch(`${API_BASE}/donations/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        url: null,
        demo: false,
        error: body.error || I18N.t('don.err.network'),
        status: res.status,
      };
    }
    return { url: body.url || null, demo: Boolean(body.demo), reference: body.reference || data.reference || '', error: null };
  } catch (_err) {
    return { url: null, demo: false, error: I18N.t('don.err.network') };
  }
}