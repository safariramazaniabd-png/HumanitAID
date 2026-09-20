-- ════════════════════════════════════════════════════════════════════
-- HUMANITAID — Migration 002 : Relation posts↔causes + corbeille
--
-- Application : PostgreSQL (Supabase) — ajoute cause_id et deleted_at
--   psql "$DATABASE_URL" -f database/migrations/002_posts_cause_relation_and_trash.sql
-- ════════════════════════════════════════════════════════════════════

-- 1. Ajouter cause_id sur posts (relation vers causes)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cause_id UUID REFERENCES causes(id) ON DELETE SET NULL;

-- 2. Ajouter deleted_at (soft delete / corbeille)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. Index sur cause_id pour les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_posts_cause_id ON posts (cause_id);

-- 4. Index sur deleted_at pour le filtrage corbeille / restauration
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts (deleted_at) WHERE deleted_at IS NOT NULL;

-- 5. Mise à jour des posts existants qui n'auraient pas de cause_id
-- (laisser NULL — les posts existants ne sont pas liés à une cause par défaut)
UPDATE posts SET cause_id = NULL WHERE cause_id IS NULL;

-- 6. S'assurer que tous les posts existants ont deleted_at = NULL
UPDATE posts SET deleted_at = NULL WHERE deleted_at IS NULL;