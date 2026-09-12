-- ════════════════════════════════════════════════════════════════════
-- HUMANITAID — Migration 001 : Idempotence des webhooks Stripe
--
-- Application : PostgreSQL (Supabase) — idempotente, peut être relancée.
--   psql "$DATABASE_URL" -f database/migrations/001_stripe_webhook_idempotency.sql
--
-- Contexte : le webhook serverless (frontend/api/webhooks/stripe.js)
-- est déjà idempotent au niveau applicatif (garde de statut + SELECT
-- avant INSERT). Cette migration renforce la robustesse au niveau
-- de la base :
--   1. webhook_events.event_id     → rejet des événements déjà reçus.
--   2. payment_transactions unique → zéro doublon dans le registre.
--   3. donations unique partiel    → zéro double complétion.
-- ════════════════════════════════════════════════════════════════════

-- 1. Colonne event_id sur webhook_events (identifiant Stripe stable).
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS event_id VARCHAR(255);

-- Index unique partiel : un événement Stripe ne peut être reçu qu'une fois.
CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_events_event_id
    ON webhook_events (event_id)
    WHERE event_id IS NOT NULL;

-- 2. Registre de transactions : une transaction provider est unique.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_transactions_provider_tx
    ON payment_transactions (provider, provider_transaction_id)
    WHERE provider_transaction_id IS NOT NULL;

-- 3. Donations : pas de double complétion par transaction provider.
CREATE UNIQUE INDEX IF NOT EXISTS uq_donations_provider_tx
    ON donations (provider, provider_transaction_id)
    WHERE provider_transaction_id IS NOT NULL;