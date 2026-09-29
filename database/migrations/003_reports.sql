-- ═══════════════════════════════════════════════════════════
-- HumanitAID — Migration 003 : Rapports humanitaires vérifiés
--
-- Brique "Rapports" du spec vision v1.0, distincte des
-- publications (posts) : des rapports sourcés, jamais inventés,
-- citant une organisation reconnue ou le terrain propre
-- d'HumanitAID, avec relation many-to-many vers les causes.
--
-- La contrainte sur source_name/source_url rend la règle
-- "jamais inventé" mécanique en base, pas seulement une
-- consigne côté admin.
-- ═══════════════════════════════════════════════════════════

CREATE TYPE report_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  summary TEXT,
  content TEXT,
  featured_image TEXT,
  source_name VARCHAR(50) NOT NULL,
  source_url TEXT,
  published_date DATE,
  status report_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reports_source_name_check CHECK (
    source_name IN ('OCHA','UNHCR','UNICEF','ICRC','WHO','WFP','IOM','HumanitAID')
  ),
  -- source_url obligatoire pour toute source externe (vérifiabilité) ;
  -- optionnel uniquement pour le terrain propre HumanitAID.
  CONSTRAINT reports_source_url_required CHECK (
    source_name = 'HumanitAID' OR (source_url IS NOT NULL AND source_url <> '')
  )
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_published_date ON reports (published_date DESC);

-- Jointure many-to-many rapports <-> causes
CREATE TABLE IF NOT EXISTS report_causes (
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  cause_id UUID NOT NULL REFERENCES causes(id) ON DELETE CASCADE,
  PRIMARY KEY (report_id, cause_id)
);

CREATE INDEX IF NOT EXISTS idx_report_causes_cause_id ON report_causes (cause_id);
