-- ============================================================
-- DataPilot AI — Billing Migration
-- ============================================================
-- Adds cancel_at_period_end column to subscriptions table.
-- Run this after 001_initial.sql.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Update the trigger to also create usage record on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  period_start DATE;
  period_end DATE;
BEGIN
  INSERT INTO profiles (user_id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');

  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');

  period_start := date_trunc('month', NOW())::DATE;
  period_end := (date_trunc('month', NOW()) + INTERVAL '1 month - 1 day')::DATE;

  INSERT INTO usage (user_id, period_start, period_end, analysis_count)
  VALUES (NEW.id, period_start, period_end, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
