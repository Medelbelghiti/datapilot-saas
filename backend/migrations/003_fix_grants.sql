-- ============================================================
-- DataPilot AI — Fix Missing Grants & Auth Trigger
-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- 1) Grant ALL on every table/sequence in public schema to the
--    built-in Supabase roles. Fixes "permission denied ... to service_role"
--    and lets the signup trigger + anon/authenticated RLS work.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Apply the same grants to any tables/sequences created in the future.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO anon, authenticated, service_role;

-- 2) Re-create the auth trigger (safe to run multiple times).
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3) Re-enable RLS policies (idempotent).
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 4) Create the private storage bucket if it does not exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', false)
ON CONFLICT (id) DO NOTHING;

-- 5) Storage policies for authenticated users on the datasets bucket
--    (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename = 'objects' AND policyname = 'Users can upload to datasets') THEN
    CREATE POLICY "Users can upload to datasets"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename = 'objects' AND policyname = 'Users can read own datasets') THEN
    CREATE POLICY "Users can read own datasets"
      ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
