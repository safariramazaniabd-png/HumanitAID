const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  FINANCE: 'finance',
  VIEWER: 'viewer',
};

const POST_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe',
  FLUTTERWAVE: 'flutterwave',
  PAYSTACK: 'paystack',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const CAUSE_SLUGS = [
  'deplaces',
  'orphelins',
  'veuves',
  'victimes',
  'handicapes',
];

const DEFAULT_CAUSES = [
  {
    slug: 'deplaces',
    title: 'Déplacés & Réfugiés de guerre',
    description: 'Soutien aux millions de personnes déplacées de force dans l\'Est de la RDC.',
    goal: 500000,
    collected: 347000,
    order: 1,
  },
  {
    slug: 'orphelins',
    title: 'Enfants orphelins en zones de conflit',
    description: 'Protection et éducation pour les enfants ayant perdu leurs parents.',
    goal: 300000,
    collected: 198000,
    order: 2,
  },
  {
    slug: 'veuves',
    title: 'Veuves & Femmes survivantes de violences',
    description: 'Accompagnement psychosocial et soutien économique pour les femmes survivantes.',
    goal: 250000,
    collected: 156000,
    order: 3,
  },
  {
    slug: 'victimes',
    title: 'Victimes de violences armées',
    description: 'Soins médicaux d\'urgence et réhabilitation pour les victimes.',
    goal: 400000,
    collected: 223000,
    order: 4,
  },
  {
    slug: 'handicapes',
    title: 'Personnes handicapées en zones de guerre',
    description: 'Accessibilité, réhabilitation et inclusion pour les personnes handicapées.',
    goal: 200000,
    collected: 112000,
    order: 5,
  },
];

const TESTIMONIAL_CATEGORIES = [
  'Beneficiary',
  'Volunteer',
  'Donor',
  'Partner',
  'Field Worker',
];

const NEWS_CATEGORIES = [
  'Urgence',
  'Terrain',
  'Témoignage',
  'Plaidoyer',
  'Partenariat',
  'Rapport',
];

const MEDIA_CATEGORIES = [
  'Terrain',
  'Humanitarian Response',
  'Communities',
  'Volunteers',
  'Events',
  'Partners',
];

module.exports = {
  ROLES,
  POST_STATUS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUS,
  CAUSE_SLUGS,
  DEFAULT_CAUSES,
  TESTIMONIAL_CATEGORIES,
  NEWS_CATEGORIES,
  MEDIA_CATEGORIES,
};
