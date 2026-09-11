-- ============================================================================
-- HumanitAID Foundation — PostgreSQL Schema
-- Humanitarian Donation Platform (DRC Crisis)
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- User roles for access control
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin',
    'editor',
    'finance',
    'viewer'
);

-- Post / article publication status
CREATE TYPE post_status AS ENUM (
    'draft',
    'scheduled',
    'published',
    'archived'
);

-- Payment processing providers
CREATE TYPE payment_provider AS ENUM (
    'stripe',
    'flutterwave',
    'paystack'
);

-- Payment transaction status
CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded'
);

-- Slide type (hero banner or field story)
CREATE TYPE slide_type AS ENUM (
    'hero',
    'field_story'
);

-- Donation frequency
CREATE TYPE donation_frequency AS ENUM (
    'one_time',
    'monthly',
    'quarterly',
    'annual'
);

-- Cause status
CREATE TYPE cause_status AS ENUM (
    'active',
    'completed',
    'paused',
    'archived'
);

-- Testimonial status
CREATE TYPE testimonial_status AS ENUM (
    'draft',
    'published',
    'archived'
);

-- News status
CREATE TYPE news_status AS ENUM (
    'draft',
    'scheduled',
    'published',
    'archived'
);

-- Category content type
CREATE TYPE category_type AS ENUM (
    'post',
    'news',
    'media',
    'testimonial'
);

-- Partner type
CREATE TYPE partner_type AS ENUM (
    'institutional',
    'ngo',
    'corporate',
    'government',
    'individual'
);

-- ============================================================================
-- TABLE: users
-- Platform administrators, editors, and finance staff.
-- ============================================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255),
    role            user_role NOT NULL DEFAULT 'viewer',
    avatar_url      TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'Platform administrators, editors, and finance staff.';

-- ============================================================================
-- TABLE: categories
-- Reusable taxonomy for posts, news, media, and testimonials.
-- ============================================================================
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE NOT NULL,
    description     TEXT,
    type            category_type NOT NULL DEFAULT 'post',
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE categories IS 'Reusable taxonomy for posts, news, media, and testimonials.';

CREATE INDEX idx_categories_type ON categories (type);
CREATE INDEX idx_categories_slug ON categories (slug);
CREATE INDEX idx_categories_display_order ON categories (display_order);

-- ============================================================================
-- TABLE: posts
-- Blog articles, field reports, and editorial content.
-- ============================================================================
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500) NOT NULL,
    slug            VARCHAR(500) UNIQUE,
    summary         TEXT,
    content         TEXT,
    featured_image  TEXT,
    gallery         JSONB DEFAULT '[]'::jsonb,
    video_url       TEXT,
    category        VARCHAR(100),
    location        VARCHAR(255),
    author_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    status          post_status NOT NULL DEFAULT 'draft',
    is_featured     BOOLEAN NOT NULL DEFAULT false,
    published_at    TIMESTAMPTZ,
    scheduled_at    TIMESTAMPTZ,
    seo_title       VARCHAR(255),
    seo_description TEXT,
    og_image        TEXT,
    view_count      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE posts IS 'Blog articles, field reports, and editorial content.';

CREATE INDEX idx_posts_status ON posts (status);
CREATE INDEX idx_posts_slug ON posts (slug);
CREATE INDEX idx_posts_author_id ON posts (author_id);
CREATE INDEX idx_posts_category ON posts (category);
CREATE INDEX idx_posts_published_at ON posts (published_at);
CREATE INDEX idx_posts_is_featured ON posts (is_featured) WHERE is_featured = true;
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);

-- ============================================================================
-- TABLE: media
-- Uploaded images, videos, and documents.
-- ============================================================================
CREATE TABLE media (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename        VARCHAR(500) NOT NULL,
    original_name   VARCHAR(500),
    mime_type       VARCHAR(100),
    size            INTEGER,
    width           INTEGER,
    height          INTEGER,
    url             TEXT NOT NULL,
    thumbnail_url   TEXT,
    alt_text        VARCHAR(500),
    description     TEXT,
    category        VARCHAR(100),
    uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE media IS 'Uploaded images, videos, and documents for the platform.';

CREATE INDEX idx_media_category ON media (category);
CREATE INDEX idx_media_uploaded_by ON media (uploaded_by);
CREATE INDEX idx_media_mime_type ON media (mime_type);
CREATE INDEX idx_media_created_at ON media (created_at DESC);

-- ============================================================================
-- TABLE: slides
-- Hero banners and field-story carousel items.
-- ============================================================================
CREATE TABLE slides (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500) NOT NULL,
    subtitle        VARCHAR(500),
    description     TEXT,
    image_url       TEXT,
    video_url       TEXT,
    cta_text        VARCHAR(255),
    cta_url         TEXT,
    type            slide_type NOT NULL DEFAULT 'hero',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_main         BOOLEAN NOT NULL DEFAULT false,
    duration        INTEGER NOT NULL DEFAULT 5500,
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE slides IS 'Hero banners and field-story carousel items for the homepage.';

CREATE INDEX idx_slides_type ON slides (type);
CREATE INDEX idx_slides_is_active ON slides (is_active) WHERE is_active = true;
CREATE INDEX idx_slides_display_order ON slides (display_order);

-- ============================================================================
-- TABLE: causes
-- Fundraising campaigns with monetary goals and progress tracking.
-- ============================================================================
CREATE TABLE causes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(255) UNIQUE NOT NULL,
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    image_url       TEXT,
    goal            DECIMAL(12,2) NOT NULL DEFAULT 0,
    collected       DECIMAL(12,2) NOT NULL DEFAULT 0,
    status          cause_status NOT NULL DEFAULT 'active',
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE causes IS 'Fundraising campaigns with monetary goals and progress tracking.';

CREATE INDEX idx_causes_slug ON causes (slug);
CREATE INDEX idx_causes_status ON causes (status);
CREATE INDEX idx_causes_display_order ON causes (display_order);

-- ============================================================================
-- TABLE: testimonials
-- Beneficiary, volunteer, donor, and partner testimonials.
-- ============================================================================
CREATE TABLE testimonials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name     VARCHAR(255),
    category        VARCHAR(100),
    location        VARCHAR(255),
    content         TEXT NOT NULL,
    photo_url       TEXT,
    video_url       TEXT,
    status          testimonial_status NOT NULL DEFAULT 'draft',
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE testimonials IS 'Testimonials from beneficiaries, volunteers, donors, and partners.';

CREATE INDEX idx_testimonials_category ON testimonials (category);
CREATE INDEX idx_testimonials_status ON testimonials (status);
CREATE INDEX idx_testimonials_display_order ON testimonials (display_order);

-- ============================================================================
-- TABLE: news
-- News articles, urgent alerts, field reports, and advocacy pieces.
-- ============================================================================
CREATE TABLE news (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500) NOT NULL,
    slug            VARCHAR(500) UNIQUE,
    summary         TEXT,
    content         TEXT,
    featured_image  TEXT,
    gallery         JSONB DEFAULT '[]'::jsonb,
    video_url       TEXT,
    author_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    category        VARCHAR(100),
    status          news_status NOT NULL DEFAULT 'draft',
    is_featured     BOOLEAN NOT NULL DEFAULT false,
    published_at    TIMESTAMPTZ,
    seo_title       VARCHAR(255),
    seo_description TEXT,
    og_image        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE news IS 'News articles, urgent alerts, field reports, and advocacy pieces.';

CREATE INDEX idx_news_status ON news (status);
CREATE INDEX idx_news_slug ON news (slug);
CREATE INDEX idx_news_author_id ON news (author_id);
CREATE INDEX idx_news_category ON news (category);
CREATE INDEX idx_news_published_at ON news (published_at);
CREATE INDEX idx_news_is_featured ON news (is_featured) WHERE is_featured = true;
CREATE INDEX idx_news_created_at ON news (created_at DESC);

-- ============================================================================
-- TABLE: donations
-- Individual donation records with payment provider references.
-- ============================================================================
CREATE TABLE donations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_reference        VARCHAR(50) UNIQUE NOT NULL,
    provider                payment_provider,
    provider_transaction_id VARCHAR(255),
    amount                  DECIMAL(12,2) NOT NULL,
    currency                VARCHAR(3) NOT NULL DEFAULT 'USD',
    cause_slug              VARCHAR(255),
    donor_name              VARCHAR(255),
    donor_email             VARCHAR(255),
    frequency               donation_frequency NOT NULL DEFAULT 'one_time',
    status                  payment_status NOT NULL DEFAULT 'pending',
    payment_method          VARCHAR(100),
    receipt_url             TEXT,
    metadata                JSONB DEFAULT '{}'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at            TIMESTAMPTZ
);

COMMENT ON TABLE donations IS 'Individual donation records with payment provider references.';

CREATE INDEX idx_donations_public_reference ON donations (public_reference);
CREATE INDEX idx_donations_status ON donations (status);
CREATE INDEX idx_donations_provider ON donations (provider);
CREATE INDEX idx_donations_cause_slug ON donations (cause_slug);
CREATE INDEX idx_donations_donor_email ON donations (donor_email);
CREATE INDEX idx_donations_created_at ON donations (created_at DESC);
CREATE INDEX idx_donations_completed_at ON donations (completed_at);

-- ============================================================================
-- TABLE: payment_transactions
-- Ledger of raw payment events from external providers.
-- ============================================================================
CREATE TABLE payment_transactions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id             UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    provider                payment_provider NOT NULL,
    provider_transaction_id VARCHAR(255),
    amount                  DECIMAL(12,2) NOT NULL,
    currency                VARCHAR(3) NOT NULL DEFAULT 'USD',
    status                  payment_status NOT NULL DEFAULT 'pending',
    provider_response       JSONB DEFAULT '{}'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE payment_transactions IS 'Ledger of raw payment events from external providers.';

CREATE INDEX idx_payment_transactions_donation_id ON payment_transactions (donation_id);
CREATE INDEX idx_payment_transactions_provider ON payment_transactions (provider);
CREATE INDEX idx_payment_transactions_status ON payment_transactions (status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions (created_at DESC);

-- ============================================================================
-- TABLE: webhook_events
-- Raw webhook payloads from payment providers for audit and replay.
-- ============================================================================
CREATE TABLE webhook_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider        payment_provider NOT NULL,
    event_type      VARCHAR(255),
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE webhook_events IS 'Raw webhook payloads from payment providers for audit and replay.';

CREATE INDEX idx_webhook_events_provider ON webhook_events (provider);
CREATE INDEX idx_webhook_events_processed ON webhook_events (processed);
CREATE INDEX idx_webhook_events_created_at ON webhook_events (created_at DESC);

-- ============================================================================
-- TABLE: impact_metrics
-- Quantitative humanitarian impact data (beneficiaries, meals, etc.).
-- ============================================================================
CREATE TABLE impact_metrics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name     VARCHAR(255) NOT NULL,
    metric_value    DECIMAL(12,2) NOT NULL DEFAULT 0,
    metric_unit     VARCHAR(100),
    period          VARCHAR(50),
    year            INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE impact_metrics IS 'Quantitative humanitarian impact data (beneficiaries, meals, etc.).';

CREATE INDEX idx_impact_metrics_metric_name ON impact_metrics (metric_name);
CREATE INDEX idx_impact_metrics_year ON impact_metrics (year);

-- ============================================================================
-- TABLE: partners
-- Institutional, NGO, corporate, and government partners.
-- ============================================================================
CREATE TABLE partners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    logo_url        TEXT,
    website_url     TEXT,
    description     TEXT,
    type            partner_type NOT NULL DEFAULT 'institutional',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE partners IS 'Institutional, NGO, corporate, and government partners.';

CREATE INDEX idx_partners_type ON partners (type);
CREATE INDEX idx_partners_is_active ON partners (is_active) WHERE is_active = true;
CREATE INDEX idx_partners_display_order ON partners (display_order);

-- ============================================================================
-- TABLE: audit_logs
-- Immutable audit trail for all sensitive operations.
-- ============================================================================
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(255) NOT NULL,
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       UUID,
    old_data        JSONB,
    new_data        JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all sensitive operations.';

CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ============================================================================
-- TABLE: settings
-- Key-value application configuration (site name, theme, etc.).
-- ============================================================================
CREATE TABLE settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key             VARCHAR(255) UNIQUE NOT NULL,
    value           TEXT,
    type            VARCHAR(50) DEFAULT 'string',
    category        VARCHAR(100),
    description     TEXT,
    updated_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE settings IS 'Key-value application configuration (site name, theme, etc.).';

CREATE INDEX idx_settings_key ON settings (key);
CREATE INDEX idx_settings_category ON settings (category);

-- ============================================================================
-- TABLE: newsletter_subscribers
-- Email newsletter subscriber list with double opt-in support.
-- ============================================================================
CREATE TABLE newsletter_subscribers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) UNIQUE NOT NULL,
    is_confirmed        BOOLEAN NOT NULL DEFAULT false,
    confirmation_token  VARCHAR(255),
    unsubscribed_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE newsletter_subscribers IS 'Email newsletter subscriber list with double opt-in support.';

CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers (email);
CREATE INDEX idx_newsletter_subscribers_is_confirmed ON newsletter_subscribers (is_confirmed);

-- ============================================================================
-- TRIGGER: Auto-update updated_at on row modification
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_slides_updated_at
    BEFORE UPDATE ON slides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_causes_updated_at
    BEFORE UPDATE ON causes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_testimonials_updated_at
    BEFORE UPDATE ON testimonials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_news_updated_at
    BEFORE UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Default settings
-- ============================================================================

-- Create a temporary placeholder UUID for the admin user in settings.updated_by
-- We'll reference the admin user after inserting it.

INSERT INTO settings (key, value, type, category, description) VALUES
    ('site_name', 'HumanitAID', 'string', 'general', 'Nom du site web'),
    ('site_tagline', 'Ensemble pour les oubliés du monde', 'string', 'general', 'Slogan du site'),
    ('site_url', 'https://humanitaid.org', 'string', 'general', 'URL principale du site'),
    ('theme', 'dark', 'string', 'appearance', 'Thème visuel du site (dark / light)'),
    ('language', 'fr', 'string', 'general', 'Langue par défaut du site'),
    ('currency', 'USD', 'string', 'donations', 'Devise par défaut pour les dons'),
    ('contact_email', 'contact@humanitaid.org', 'string', 'contact', 'Adresse email de contact'),
    ('contact_phone', '+243 000 000 000', 'string', 'contact', 'Numéro de téléphone de contact'),
    ('donation_goal_default', '500000', 'number', 'donations', 'Objectif de collecte par défaut'),
    ('enable_newsletter', 'true', 'boolean', 'features', 'Activer l''inscription à la newsletter'),
    ('enable_testimonials', 'true', 'boolean', 'features', 'Activer l''affichage des témoignages'),
    ('ticker_speed', '30', 'number', 'appearance', 'Vitesse de défilement de la barre d''info (secondes)'),
    ('hero_slideshow_interval', '5500', 'number', 'appearance', 'Intervalle de rotation du diaporama (ms)'),
    ('footer_text', '© 2024 HumanitAID Foundation. Tous droits réservés.', 'string', 'general', 'Texte du pied de page');

-- ============================================================================
-- SEED DATA: Default admin user
-- Password: changeme123  (bcrypt — change immediately!)
-- ============================================================================

INSERT INTO users (id, email, password_hash, name, role, is_active) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
     'admin@humanitaid.org',
     '$2b$12$LJ3m4ys3Lz0YBLCzFhRreuhFGfK.GH2XjHJG8XzOhH1m2c5S3Z5Y.',
     'Super Administrateur',
     'super_admin',
     true);

-- Update settings to reference the admin user
UPDATE settings SET updated_by = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- ============================================================================
-- SEED DATA: Default categories — Media
-- ============================================================================

INSERT INTO categories (name, slug, type, display_order) VALUES
    ('Terrain',                    'terrain',              'media',    1),
    ('Humanitarian Response',      'humanitarian-response', 'media',   2),
    ('Communities',                'communities',          'media',    3),
    ('Volunteers',                 'volunteers',           'media',    4),
    ('Events',                     'events',               'media',    5),
    ('Partners',                   'partners',             'media',    6);

-- ============================================================================
-- SEED DATA: Default categories — News
-- ============================================================================

INSERT INTO categories (name, slug, type, display_order) VALUES
    ('Urgence',                    'urgence',              'news',     1),
    ('Terrain',                    'terrain-news',         'news',     2),
    ('Témoignage',                 'temoignage',           'news',     3),
    ('Plaidoyer',                  'plaidoyer',            'news',     4),
    ('Partenariat',                'partenariat',          'news',     5),
    ('Rapport',                    'rapport',              'news',     6);

-- ============================================================================
-- SEED DATA: Default categories — Posts
-- ============================================================================

INSERT INTO categories (name, slug, type, display_order) VALUES
    ('Blog',                       'blog',                 'post',     1),
    ('Actualités',                 'actualites',           'post',     2),
    ('Analyse',                    'analyse',              'post',     3);

-- ============================================================================
-- SEED DATA: Default categories — Testimonials
-- ============================================================================

INSERT INTO categories (name, slug, type, display_order) VALUES
    ('Beneficiary',                'beneficiary',          'testimonial',  1),
    ('Volunteer',                  'volunteer',            'testimonial',  2),
    ('Donor',                      'donor',                'testimonial',  3),
    ('Partner',                    'partner-testimonial',  'testimonial',  4),
    ('Field Worker',               'field-worker',         'testimonial',  5);

-- ============================================================================
-- SEED DATA: Default causes (from constants.js)
-- ============================================================================

INSERT INTO causes (slug, title, description, goal, collected, status, display_order) VALUES
    ('deplaces',   'Déplacés & Réfugiés de guerre',
     'Soutien aux millions de personnes déplacées de force dans l''Est de la RDC.',
     500000.00, 347000.00, 'active', 1),

    ('orphelins',  'Enfants orphelins en zones de conflit',
     'Protection et éducation pour les enfants ayant perdu leurs parents.',
     300000.00, 198000.00, 'active', 2),

    ('veuves',     'Veuves & Femmes survivantes de violences',
     'Accompagnement psychosocial et soutien économique pour les femmes survivantes.',
     250000.00, 156000.00, 'active', 3),

    ('victimes',   'Victimes de violences armées',
     'Soins médicaux d''urgence et réhabilitation pour les victimes.',
     400000.00, 223000.00, 'active', 4),

    ('handicapes', 'Personnes handicapées en zones de guerre',
     'Accessibilité, réhabilitation et inclusion pour les personnes handicapées.',
     200000.00, 112000.00, 'active', 5);

-- ============================================================================
-- SEED DATA: Default impact metrics
-- ============================================================================

INSERT INTO impact_metrics (metric_name, metric_value, metric_unit, period, year) VALUES
    ('beneficiaries_reached',   125000, 'people',  '2024', 2024),
    ('meals_distributed',       580000, 'meals',   '2024', 2024),
    ('medical_consultations',    34000, 'visits',  '2024', 2024),
    ('children_educated',         8500, 'students','2024', 2024),
    ('shelters_built',            1200, 'units',   '2024', 2024),
    ('water_points',               85, 'points',  '2024', 2024),
    ('volunteers_active',         320, 'people',  '2024', 2024),
    ('partner_organizations',      45, 'orgs',    '2024', 2024);
