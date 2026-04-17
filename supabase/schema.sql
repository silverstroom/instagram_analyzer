-- =====================================================================
-- INSTAGRAM ANALYZER - Schema database
-- Esegui questo file nell'SQL editor di Supabase per inizializzare il DB
-- =====================================================================

-- Enable UUID extension (di default su Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- CLIENTS: raggruppa i profili in progetti/clienti
-- =====================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TRACKED_PROFILES: profili che vogliamo monitorare nel tempo
-- =====================================================================
CREATE TABLE IF NOT EXISTS tracked_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  instagram_id TEXT,
  role TEXT CHECK (role IN ('main', 'competitor', 'reference')) DEFAULT 'main',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, username)
);

CREATE INDEX IF NOT EXISTS tracked_profiles_username_idx ON tracked_profiles(username);

-- =====================================================================
-- PROFILE_SNAPSHOTS: snapshot giornalieri per tracking storico
-- =====================================================================
CREATE TABLE IF NOT EXISTS profile_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  instagram_id TEXT,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  follower_count INTEGER NOT NULL,
  following_count INTEGER NOT NULL,
  media_count INTEGER NOT NULL,
  is_verified BOOLEAN,
  is_business BOOLEAN,
  is_private BOOLEAN,
  bio TEXT,
  full_name TEXT,
  profile_pic_url TEXT,
  external_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(username, snapshot_date)
);

CREATE INDEX IF NOT EXISTS profile_snapshots_username_date_idx
  ON profile_snapshots(username, snapshot_date DESC);

-- =====================================================================
-- POSTS: cache dei post analizzati (per non rifetchare gli stessi)
-- =====================================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shortcode TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  instagram_pk TEXT,
  caption TEXT,
  media_type INTEGER, -- 1=photo, 2=video, 8=carousel
  product_type TEXT,
  like_count INTEGER,
  comment_count INTEGER,
  play_count INTEGER,
  view_count INTEGER,
  thumbnail_url TEXT,
  taken_at TIMESTAMPTZ,
  hashtags TEXT[],
  mentions TEXT[],
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posts_username_taken_at_idx
  ON posts(username, taken_at DESC);

-- =====================================================================
-- API_USAGE: log di ogni analisi + costi API
-- =====================================================================
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  profile_username TEXT NOT NULL,
  analysis_type TEXT CHECK (analysis_type IN ('quick', 'deep_focus', 'snapshot')) NOT NULL,
  modules_used TEXT[],
  request_count INTEGER NOT NULL,
  estimated_cost_usd NUMERIC(10, 6) NOT NULL,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS api_usage_timestamp_idx ON api_usage(timestamp DESC);
CREATE INDEX IF NOT EXISTS api_usage_month_idx
  ON api_usage(DATE_TRUNC('month', timestamp));

-- =====================================================================
-- DEEP_FOCUS_RESULTS: storage dei risultati delle analisi deep
-- =====================================================================
CREATE TABLE IF NOT EXISTS deep_focus_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  modules_used TEXT[],
  cost_usd NUMERIC(10, 6),
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS deep_focus_username_idx
  ON deep_focus_results(username, created_at DESC);

-- =====================================================================
-- VIEW: budget mensile aggregato
-- =====================================================================
CREATE OR REPLACE VIEW monthly_budget_usage AS
SELECT
  TO_CHAR(DATE_TRUNC('month', timestamp), 'YYYY-MM') AS month,
  COUNT(*) AS total_analyses,
  SUM(CASE WHEN analysis_type = 'quick' THEN 1 ELSE 0 END) AS quick_count,
  SUM(CASE WHEN analysis_type = 'deep_focus' THEN 1 ELSE 0 END) AS deep_focus_count,
  SUM(CASE WHEN analysis_type = 'snapshot' THEN 1 ELSE 0 END) AS snapshot_count,
  SUM(request_count) AS total_requests,
  ROUND(SUM(estimated_cost_usd)::NUMERIC, 4) AS total_cost_usd
FROM api_usage
WHERE success = TRUE
GROUP BY DATE_TRUNC('month', timestamp)
ORDER BY DATE_TRUNC('month', timestamp) DESC;

-- =====================================================================
-- RLS: per il tool interno, disabilitiamo RLS (accesso via service key)
-- Se in futuro aggiungi autenticazione, abilita RLS e aggiungi policy.
-- =====================================================================
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profile_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE deep_focus_results DISABLE ROW LEVEL SECURITY;
