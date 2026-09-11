/* ═══════════════════════════════════════
   API CLIENT — HumanitAID Frontend
   Graceful fallback to demo data
   ═══════════════════════════════════════ */

const API_BASE = window.location.port
  ? `${window.location.protocol}//${window.location.hostname}:3000/api`
  : `${window.location.origin}/api`;

function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

let API_DISCONNECTED = false;

function showDemoBanner() {
  const banner = document.getElementById('demo-banner');
  if (banner) banner.hidden = false;
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
      console.warn(`API GET ${path} failed, using demo data:`, err.message);
      API_DISCONNECTED = true;
      showDemoBanner();
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
      API_DISCONNECTED = true;
      showDemoBanner();
      return null;
    }
  },
};

/* ═══════════════════════════════════════
   DEMO DATA — Fallback when API is down
   ═══════════════════════════════════════ */

const DEMO_DATA = {
  slides: [
    {
      id: 1,
      title: 'Des millions de vies<br>attendent votre <span class="accent">générosité</span>',
      caption: '« Notre camp de Kanyabayonga abrite 12 000 personnes. Les enfants mangent une fois par jour. S\'il vous plaît, n\'oubliez pas notre existence. »\n— Marie-Claire, déplacée, Nord-Kivu',
      badge: 'Crise humanitaire active — Est de la RDC',
      gradient: 'slide-1',
      icon: 'tent',
      image: '/assets/images/Kinsella-RDC_002.jpg',
    },
    {
      id: 2,
      title: 'Un enfant orphelin<br>mérite un <span class="accent">avenir</span>',
      caption: '« J\'ai 9 ans et je dors dans la rue depuis 4 mois. Je voudrais aller à l\'école comme les autres enfants. »\n— Joël, orphelin, Ituri',
      badge: 'Aide d\'urgence requise — Ituri',
      gradient: 'slide-2',
      icon: 'baby',
      image: '/assets/images/4u6a4825.jpg',
    },
    {
      id: 3,
      title: 'Chaque femme<br>mérite sa <span class="accent">dignité</span>',
      caption: '« On nous a tout pris — nos maris, nos maisons, notre sécurité. Mais notre courage, jamais. »\n— Espérance, veuve de guerre, Sud-Kivu',
      badge: 'Soutien aux femmes — Sud-Kivu',
      gradient: 'slide-3',
      icon: 'dove',
      image: '/assets/images/IMG-20230216-WA0001.jpg',
    },
    {
      id: 4,
      title: 'Ensemble, construisons<br>un Congo <span class="accent">humain</span>',
      caption: '« Grâce à mon fauteuil roulant, je peux de nouveau regarder mes enfants dans les yeux, debout. »\n— Théodore, amputé des deux jambes, Beni',
      badge: 'Inclusion & Dignité — Nord-Kivu',
      gradient: 'slide-4',
      icon: 'hands',
      image: '/assets/images/stock_mm10038_hkcd7189.jpg',
    },
  ],

  causes: [
    {
      slug: 'deplaces',
      title: 'Déplacés & Réfugiés de guerre',
      description: 'Soutien aux millions de personnes déplacées de force dans l\'Est de la RDC.',
      goal: 500000,
      collected: 347000,
      donors: 1847,
      daysLeft: 42,
      icon: 'tent',
      priority: 'Priorité 1',
      detail: '7,2 millions de Congolais ont fui leurs foyers à cause des violences armées. Ils vivent dans des camps de fortune sans eau, nourriture ni soins.',
      link: 'Aider maintenant',
      bgClass: 'cause-bg-1',
      image: '/assets/images/13d18a6858b6553f46f2f6df6a21f294_XL.jpg',
    },
    {
      slug: 'orphelins',
      title: 'Enfants Orphelins en zones de conflit',
      description: 'Protection et éducation pour les enfants ayant perdu leurs parents.',
      goal: 350000,
      collected: 198750,
      donors: 2104,
      daysLeft: 58,
      icon: 'baby',
      priority: 'Priorité 2',
      detail: 'Des milliers d\'enfants ont perdu leurs parents dans les conflits. Sans famille ni tuteur, ils sont livrés à eux-mêmes dans des zones de guerre actives.',
      link: 'Protéger un enfant',
      bgClass: 'cause-bg-2',
      image: '/assets/images/image.jpg',
    },
    {
      slug: 'veuves',
      title: 'Veuves & Femmes survivantes de violences',
      description: 'Accompagnement psychosocial et soutien économique pour les femmes survivantes.',
      goal: 280000,
      collected: 156900,
      donors: 983,
      daysLeft: 35,
      icon: 'dove',
      priority: 'Priorité 3',
      detail: 'Veuves de guerre, survivantes de violences sexuelles — ces femmes portent des blessures invisibles et ont besoin de soins, de justice et de dignité.',
      link: 'Soutenir les femmes',
      bgClass: 'cause-bg-3',
      image: '/assets/images/f368fac771effcea1461751d4cbc3fb4.jpg',
    },
    {
      slug: 'victimes',
      title: 'Victimes de violences armées',
      description: 'Soins médicaux d\'urgence et réhabilitation pour les victimes.',
      goal: 200000,
      collected: 89200,
      donors: 741,
      daysLeft: 70,
      icon: 'bandage',
      priority: 'Priorité 4',
      detail: 'Blessés par balles, mines ou machettes, ces survivants ont besoin de chirurgie d\'urgence et d\'une réhabilitation longue.',
      link: 'Financer les soins',
      bgClass: 'cause-bg-4',
      image: '/assets/images/9f670ce3297232ccebf6f2f35886d451.jpg',
    },
    {
      slug: 'handicapes',
      title: 'Personnes Handicapées en zones de guerre',
      description: 'Accessibilité, réhabilitation et inclusion pour les personnes handicapées.',
      goal: 150000,
      collected: 89990,
      donors: 605,
      daysLeft: 90,
      icon: 'wheelchair',
      priority: 'Priorité 5',
      detail: 'En zones de guerre, le handicap devient une condamnation à mort. Privés de mobilité, de soins et d\'accès aux aides.',
      link: 'Ne pas les oublier',
      bgClass: 'cause-bg-5',
      image: '/assets/images/bc41a10fe9c6e4db4a007a70e2ab7122.jpg',
    },
  ],

  testimonials: [
    {
      id: 1,
      category: 'deplaces',
      categoryLabel: 'Déplacé',
      text: '« J\'ai marché 11 jours avec mes 4 enfants pour fuir les combats de Rutshuru. Mon mari a été tué devant nous. Aujourd\'hui nous vivons sous une bâche dans le camp de Bulengo. Je n\'ai plus rien, mais je garde espoir. »',
      author: 'Alphonsine M.',
      location: 'Camp de Bulengo, Nord-Kivu',
      date: 'Fév. 2025',
      avatar: 'user',
    },
    {
      id: 2,
      category: 'orphelins',
      categoryLabel: 'Orphelin',
      text: '« J\'ai 9 ans. Mes parents sont morts quand les hommes armés ont attaqué notre village. Je vis avec ma grande sœur de 14 ans. On mange ce qu\'on trouve. Mon rêve c\'est de retourner à l\'école. »',
      author: 'Joël K. (témoignage recueilli)',
      location: 'Ituri',
      date: 'Mars 2025',
      avatar: 'user',
    },
    {
      id: 3,
      category: 'veuves',
      categoryLabel: 'Veuve',
      text: '« Mon mari a été exécuté il y a 8 mois. J\'ai trois enfants à nourrir. J\'ai subi des violences inimaginables. Les organisations d\'aide m\'ont appris à respirer à nouveau. Mais j\'ai besoin de soutien pour reconstruire ma vie. »',
      author: 'Espérance N.',
      location: 'Minembwe, Sud-Kivu',
      date: 'Jan. 2025',
      avatar: 'user',
    },
    {
      id: 4,
      category: 'victimes',
      categoryLabel: 'Victime de violence',
      text: '« Une balle perdue m\'a traversé l\'épaule lors d\'une attaque. L\'hôpital de Goma a pu m\'opérer grâce aux fonds collectés ici. Sans cette aide, j\'aurais perdu le bras. Aujourd\'hui je peux de nouveau tenir mon enfant. »',
      author: 'Patient B.',
      location: 'Hôpital de Goma',
      date: 'Déc. 2024',
      avatar: 'user',
    },
    {
      id: 5,
      category: 'handicapes',
      categoryLabel: 'Handicapé',
      text: '« J\'ai perdu mes deux jambes sur une mine antipersonnel en 2023. Pendant des mois, j\'ai rampé pour me déplacer. Grâce aux donateurs de HumanitAID, j\'ai reçu un fauteuil roulant. La dignité, ça n\'a pas de prix. »',
      author: 'Théodore L.',
      location: 'Beni, Nord-Kivu',
      date: 'Nov. 2024',
      avatar: 'user',
    },
    {
      id: 6,
      category: 'orphelins',
      categoryLabel: 'Orpheline',
      text: '« Je m\'appelle Grâce, j\'ai 12 ans. Depuis que HumanitAID paie ma scolarité, je vais à l\'école chaque matin. C\'est la première fois depuis deux ans que j\'ai quelque chose à attendre chaque jour. Merci de croire en moi. »',
      author: 'Grâce M. (famille d\'accueil)',
      location: 'Uvira, Sud-Kivu',
      date: 'Avr. 2025',
      avatar: 'user',
    },
  ],

  news: [
    {
      id: 1,
      title: 'L\'offensive du M23 aggrave la crise humanitaire : 400 000 nouveaux déplacés en 6 semaines dans le Nord-Kivu',
      excerpt: 'Les violences du groupe armé M23 et ses alliés ont provoqué une vague massive de déplacements depuis février 2025. Les camps de Bulengo, Lushagala et Kanyabayonga débordent. L\'accès humanitaire est rendu quasi-impossible par les combats actifs. Nos équipes rapportent un état de malnutrition aiguë chez 1 enfant sur 3 dans les camps visités...',
      date: '2 avril 2025',
      category: 'Rapport terrain',
      icon: 'globe',
      gradient: 'linear-gradient(135deg, #1a0808 0%, #5c1a1a 50%, #c0392b 100%)',
      image: '/assets/images/20240504131607064740_WhatsApp_Image_2024-05-04_at_11.21.37_ce1b9cb1.jpg',
      featured: true,
    },
    {
      id: 2,
      title: 'Distribution de 320 fauteuils roulants à Goma et Butembo',
      date: '18 mars 2025',
      icon: 'wheelchair',
      image: '/assets/images/570ce394db5b1fb3b18dfe7c46f18002.jpg',
    },
    {
      id: 3,
      title: '742 enfants orphelins inscrits dans nos programmes scolaires depuis janvier',
      date: '28 fév. 2025',
      icon: 'baby',
      image: '/assets/images/519f70fb91a51ff99d7c9f5e9c5bc02b.jpg',
    },
    {
      id: 4,
      title: 'Centre d\'accueil pour femmes survivantes ouvert à Uvira : 230 bénéficiaires',
      date: '12 jan. 2025',
      icon: 'dove',
      image: '/assets/images/4f5ba90bac342d695ab6dabcfc13fb4e.jpg',
    },
    {
      id: 5,
      title: 'Mission médicale : 1 200 consultations réalisées à Minembwe en zone isolée',
      date: '5 déc. 2024',
      icon: 'medical',
      image: '/assets/images/2d739ace910b1c5d33b054bad424da9c.jpg',
    },
    {
      id: 6,
      title: 'Soudan : l\'aide humanitaire transite par Port-Soudan, premier port d\'entrée des ONG internationales',
      date: '15 avril 2025',
      icon: 'radio',
      image: '/assets/images/sudan_humanitarian_portsudan_15april2025_3p5a2390_1_1200x800_1.jpg',
    },
    {
      id: 7,
      title: 'Conflit au Soudan : les agences de l\'ONU coordonnent la réponse humanitaire depuis Port-Soudan',
      date: '15 avril 2025',
      icon: 'globe',
      image: '/assets/images/sudan_humanitarian_portsudan_15april2025_dsc09987_1_1200x800.jpg.webp',
    },
  ],

  stats: {
    displaced: 7200000,
    orphans: 2100000,
    raised: 847320,
    donors: 14280,
  },

  publications: [
    {
      id: 1,
      title: 'Escalade du conflit à Goma (Nord-Kivu) — ACAPS',
      date: '5 février 2025',
      icon: 'report',
      type: 'Analyse sécuritaire',
      image: '/assets/images/8bb278ceb2804b857d55c59872e5505f.jpg',
      url: '/assets/reports/ACAPS_Conflict_Escalation_Goma_Fev2025.pdf',
    },
    {
      id: 2,
      title: 'Rapport de situation RD Congo — UNFPA, octobre 2025',
      date: '31 octobre 2025',
      icon: 'clipboard',
      type: 'Rapport de situation',
      image: '/assets/images/c81b75906ed2b6ce313a87ca80afc419.jpg',
      url: '/assets/reports/UNFPA_SitRep_DRC_Octobre2025.pdf',
    },
    {
      id: 3,
      title: 'RD Congo — Aperçu des déplacements, UNHCR, mai 2025',
      date: '31 mai 2025',
      icon: 'map',
      type: 'Fiche données',
      image: '/assets/images/thumbs_b_c_4a097d84892983f2fc3a7e01a426eb9f.jpg',
      url: '/assets/reports/UNHCR_DRC_AtAGlance_Mai2025.pdf',
    },
    {
      id: 4,
      title: 'Rapport de situation RD Congo — UNFPA, novembre 2025',
      date: '30 novembre 2025',
      icon: 'clipboard',
      type: 'Rapport de situation',
      image: '/assets/images/f368fac771effcea1461751d4cbc3fb4.jpg',
      url: '/assets/reports/UNFPA_SitRep_DRC_Novembre2025.pdf',
    },
  ],

  partners: [
    'UNICEF',
    'CICR',
    'MSF',
    'OCHA',
    'PAM',
    'UNHCR',
    'IFRC',
    'Croix-Rouge',
  ],
};

/* ═══════════════════════════════════════
   HELPER: Extract array from API response
   API returns {causes: [...]} or {slides: [...]}
   ═══════════════════════════════════════ */

function extractArray(data, key) {
  if (!data) return null;
  if (Array.isArray(data)) return data;
  if (data[key] && Array.isArray(data[key])) return data[key];
  return null;
}

/* ═══════════════════════════════════════
   DATA FETCHING WITH FALLBACK
   ═══════════════════════════════════════ */

async function fetchSlides() {
  const data = await api.get('/slides');
  const arr = extractArray(data, 'slides');
  if (arr && arr.length > 0 && arr[0].gradient) return arr;
  return DEMO_DATA.slides;
}

async function fetchCauses() {
  const data = await api.get('/causes');
  const arr = extractArray(data, 'causes');
  if (arr && arr.length > 0 && arr[0].image) return arr;
  return DEMO_DATA.causes;
}

async function fetchTestimonials() {
  const data = await api.get('/testimonials');
  const arr = extractArray(data, 'testimonials');
  return (arr && arr.length > 0) ? arr : DEMO_DATA.testimonials;
}

async function fetchNews() {
  const data = await api.get('/news');
  const arr = extractArray(data, 'news');
  if (arr && arr.length > 0 && arr[0].image) return arr;
  return DEMO_DATA.news;
}

async function fetchStats() {
  const data = await api.get('/donations/stats');
  if (data && data.total !== undefined) {
    return {
      displaced: data.displaced || DEMO_DATA.stats.displaced,
      orphans: data.orphans || DEMO_DATA.stats.orphans,
      raised: data.total || DEMO_DATA.stats.raised,
      donors: data.count || DEMO_DATA.stats.donors,
    };
  }
  return DEMO_DATA.stats;
}

async function fetchPublications() {
  const data = await api.get('/posts');
  const arr = extractArray(data, 'posts');
  if (arr && arr.length > 0 && arr[0].image) {
    return arr.slice(0, 3).map(p => ({
      id: p.id,
      title: p.title,
      date: new Date(p.published_at || p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      icon: 'document',
      type: p.category || 'Publication',
      image: p.image,
      url: p.url || null,
    }));
  }
  return DEMO_DATA.publications;
}

async function fetchPartners() {
  const data = await api.get('/settings');
  if (data && data.partners) {
    const partners = Array.isArray(data.partners) ? data.partners : [];
    return partners.length > 0 ? partners : DEMO_DATA.partners;
  }
  return DEMO_DATA.partners;
}

async function submitDonation(donationData) {
  const result = await api.post('/donations', donationData);
  if (!result) {
    return { success: true, demo: true, ref: 'HAD-DEMO-' + Math.random().toString(36).substring(2, 8).toUpperCase() };
  }
  if (result.demo) {
    return { ...result, success: true, demo: true, ref: (result.donation && (result.donation.reference || result.donation.id)) || 'HAD-DEMO' };
  }
  return { ...result, success: true, demo: false, ref: (result.donation && (result.donation.reference || result.donation.id)) || 'HAD-' + Date.now().toString(36).toUpperCase() };
}

async function createCheckoutSession(data) {
  const result = await api.post('/donations/checkout', data);
  if (!result) {
    return { url: null, demo: true, reference: data.reference || '' };
  }
  return { url: result.url || null, demo: Boolean(result.demo), reference: result.reference || data.reference || '' };
}

async function fetchPublicConfig() {
  const data = await api.get('/config/public');
  if (!data) return { demoMode: true, stripeEnabled: false };
  return data;
}
