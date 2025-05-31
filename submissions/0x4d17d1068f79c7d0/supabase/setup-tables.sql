-- Simplified Database Setup for Memoreee
-- Run this in your Supabase SQL Editor to create the required tables

-- 1. User profiles table (supports both auth users and anonymous users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY, -- Can be UUID from auth.users or anonymous ID
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Optional link to auth
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    flow_address TEXT,
    wallet_type TEXT CHECK (wallet_type IN ('cadence', 'evm', 'unknown')),
    skill_levels JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    total_practice_time INTERVAL DEFAULT '0 seconds',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Practice sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Using TEXT instead of UUID for flexibility
    game_type TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    max_possible_score INTEGER NOT NULL DEFAULT 0,
    accuracy DECIMAL(5,2) NOT NULL DEFAULT 0.0, -- Percentage 0-100
    items_count INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    difficulty_level INTEGER NOT NULL DEFAULT 1,
    session_data JSONB DEFAULT '{}', -- Store game-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- Using TEXT for flexibility
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points INTEGER DEFAULT 0,
    nft_token_id TEXT, -- Flow NFT token ID if minted
    metadata JSONB DEFAULT '{}',
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Unified Leaderboard Entries table
-- Supports both tier-based and period-based leaderboards with cultural contexts
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- User Information
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    user_tier TEXT NOT NULL CHECK (user_tier IN ('supabase', 'flow')),

    -- Game Context
    game_type TEXT NOT NULL,
    culture TEXT NOT NULL,

    -- Scoring
    raw_score INTEGER NOT NULL,
    adjusted_score INTEGER NOT NULL, -- Calculated based on tier (80% supabase, 100% flow)

    -- Time Periods (auto-managed)
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Blockchain Integration
    verified BOOLEAN DEFAULT FALSE,
    transaction_id TEXT,
    block_height BIGINT,
    vrf_seed BIGINT,

    -- Metadata
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints: One entry per user per game/culture/period combination
    UNIQUE(user_id, game_type, culture, period, period_start)
);

-- 5. Memory palaces table (optional for now)
CREATE TABLE IF NOT EXISTS memory_palaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    layout_data JSONB NOT NULL DEFAULT '{}', -- 3D layout, rooms, items
    seed INTEGER, -- For procedural generation
    is_public BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    difficulty_level INTEGER DEFAULT 1,
    times_used INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. User progress tracking table
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    game_type TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0.0,
    total_time_played INTERVAL DEFAULT '0 seconds',
    streak_current INTEGER DEFAULT 0,
    streak_best INTEGER DEFAULT 0,
    last_played_at TIMESTAMP WITH TIME ZONE,
    statistics JSONB DEFAULT '{}', -- Detailed stats per game type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_type)
);

-- 7. Game sessions table for detailed session tracking
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    game_type TEXT NOT NULL,
    session_id TEXT UNIQUE NOT NULL, -- External session ID from game service
    score INTEGER NOT NULL DEFAULT 0,
    max_possible_score INTEGER NOT NULL DEFAULT 0,
    accuracy DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    difficulty_level INTEGER NOT NULL DEFAULT 1,
    items_count INTEGER NOT NULL DEFAULT 0,
    perfect_game BOOLEAN DEFAULT FALSE,
    session_data JSONB DEFAULT '{}', -- Detailed game data
    flow_transaction_id TEXT, -- Flow blockchain transaction ID
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_game_type ON practice_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON practice_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
-- Unified leaderboard indexes for performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_adjusted_score ON leaderboard_entries(adjusted_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_game_type ON leaderboard_entries(game_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_culture ON leaderboard_entries(culture);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user_tier ON leaderboard_entries(user_tier);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_period ON leaderboard_entries(period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_verified ON leaderboard_entries(verified);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_created_at ON leaderboard_entries(created_at DESC);

-- Composite indexes for common leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_game_culture_period_score ON leaderboard_entries(game_type, culture, period, adjusted_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_tier_period_score ON leaderboard_entries(user_tier, period, adjusted_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_period_dates ON leaderboard_entries(period, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_memory_palaces_user_id ON memory_palaces(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_game_type ON user_progress(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_id ON game_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at);

-- Enable Row Level Security (RLS) - Important for Supabase
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_palaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access (for leaderboards)
CREATE POLICY "Public leaderboard entries are viewable by everyone" ON leaderboard_entries
    FOR SELECT USING (true);

-- Policy: Users can insert their own scores
CREATE POLICY "Users can insert own leaderboard entries" ON leaderboard_entries
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR
        auth.uid() IS NULL OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

-- Policy: Users can update their own entries (for adding transaction details)
CREATE POLICY "Users can update own leaderboard entries" ON leaderboard_entries
    FOR UPDATE USING (
        user_id = auth.uid()::text OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

-- Create RLS policies for user data access
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth_user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth_user_id = auth.uid() OR auth.uid() IS NULL);

-- Practice sessions policies
CREATE POLICY "Users can view own sessions" ON practice_sessions
    FOR SELECT USING (user_id = auth.uid()::text OR user_id = COALESCE(auth.uid()::text, user_id));

CREATE POLICY "Users can insert own sessions" ON practice_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid()::text OR auth.uid() IS NULL);

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON achievements
    FOR SELECT USING (user_id = auth.uid()::text OR user_id = COALESCE(auth.uid()::text, user_id));

CREATE POLICY "Users can insert own achievements" ON achievements
    FOR INSERT WITH CHECK (user_id = auth.uid()::text OR auth.uid() IS NULL);

-- Memory palaces policies
CREATE POLICY "Users can view own palaces" ON memory_palaces
    FOR SELECT USING (user_id = auth.uid()::text OR is_public = true);

CREATE POLICY "Users can insert own palaces" ON memory_palaces
    FOR INSERT WITH CHECK (user_id = auth.uid()::text OR auth.uid() IS NULL);

CREATE POLICY "Users can update own palaces" ON memory_palaces
    FOR UPDATE USING (user_id = auth.uid()::text);

-- User progress policies (allow both authenticated users and Flow wallet users)
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (
        user_id = auth.uid()::text OR
        auth.uid() IS NULL OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR
        auth.uid() IS NULL OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (
        user_id = auth.uid()::text OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

-- Game sessions policies (allow both authenticated users and Flow wallet users)
CREATE POLICY "Users can view own sessions" ON game_sessions
    FOR SELECT USING (
        user_id = auth.uid()::text OR
        auth.uid() IS NULL OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

CREATE POLICY "Users can insert own sessions" ON game_sessions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR
        auth.uid() IS NULL OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

CREATE POLICY "Users can update own sessions" ON game_sessions
    FOR UPDATE USING (
        user_id = auth.uid()::text OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, auth_user_id, username, display_name)
  VALUES (
    NEW.id::text,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data for testing (optional)
-- You can uncomment these if you want test data

-- INSERT INTO practice_sessions (user_id, game_type, score, max_possible_score, accuracy, items_count, duration_seconds, difficulty_level) VALUES
-- ('test-user-1', 'chaos_cards', 85, 100, 85.0, 10, 120, 2),
-- ('test-user-1', 'memory_speed', 92, 100, 92.0, 15, 90, 3),
-- ('test-user-2', 'chaos_cards', 78, 100, 78.0, 10, 135, 2);

-- INSERT INTO achievements (user_id, achievement_type, achievement_name, description, icon, points) VALUES
-- ('test-user-1', 'first_game', 'Memory Apprentice', 'Completed your first memory challenge', '🎓', 10),
-- ('test-user-1', 'high_score', 'Memory Master', 'Scored 50+ points in a single game', '🏆', 20);

-- =====================================================
-- LEADERBOARD VIEWS AND FUNCTIONS
-- =====================================================

-- View: Top scores across all tiers and periods
CREATE OR REPLACE VIEW leaderboard_top_scores AS
SELECT
  id,
  user_id,
  username,
  raw_score,
  adjusted_score,
  game_type,
  culture,
  user_tier,
  period,
  verified,
  transaction_id,
  vrf_seed,
  created_at,
  ROW_NUMBER() OVER (PARTITION BY game_type, culture, period ORDER BY adjusted_score DESC) as rank
FROM leaderboard_entries
ORDER BY adjusted_score DESC;

-- View: Flow-verified scores only
CREATE OR REPLACE VIEW leaderboard_flow_verified AS
SELECT
  id,
  user_id,
  username,
  raw_score,
  adjusted_score,
  game_type,
  culture,
  user_tier,
  period,
  verified,
  transaction_id,
  vrf_seed,
  created_at,
  ROW_NUMBER() OVER (PARTITION BY game_type, culture, period ORDER BY adjusted_score DESC) as rank
FROM leaderboard_entries
WHERE user_tier = 'flow' AND verified = true
ORDER BY adjusted_score DESC;

-- View: Supabase users only
CREATE OR REPLACE VIEW leaderboard_supabase_only AS
SELECT
  id,
  user_id,
  username,
  raw_score,
  adjusted_score,
  game_type,
  culture,
  user_tier,
  period,
  created_at,
  ROW_NUMBER() OVER (PARTITION BY game_type, culture, period ORDER BY adjusted_score DESC) as rank
FROM leaderboard_entries
WHERE user_tier = 'supabase'
ORDER BY adjusted_score DESC;

-- View: Grand Master leaderboard (all cultures combined)
CREATE OR REPLACE VIEW leaderboard_grand_master AS
SELECT
  user_id,
  username,
  user_tier,
  game_type,
  period,
  SUM(adjusted_score) as total_score,
  COUNT(*) as cultures_mastered,
  AVG(adjusted_score) as average_score,
  MAX(adjusted_score) as best_score,
  MAX(created_at) as last_played,
  ROW_NUMBER() OVER (PARTITION BY game_type, period ORDER BY SUM(adjusted_score) DESC) as rank
FROM leaderboard_entries
GROUP BY user_id, username, user_tier, game_type, period
ORDER BY total_score DESC;

-- Function: Get current period dates
CREATE OR REPLACE FUNCTION get_current_periods()
RETURNS TABLE (
  period_type TEXT,
  period_start DATE,
  period_end DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'daily'::TEXT,
    CURRENT_DATE,
    CURRENT_DATE
  UNION ALL
  SELECT
    'weekly'::TEXT,
    DATE_TRUNC('week', CURRENT_DATE)::DATE,
    (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE
  UNION ALL
  SELECT
    'monthly'::TEXT,
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
  UNION ALL
  SELECT
    'all_time'::TEXT,
    '2024-01-01'::DATE,
    '2099-12-31'::DATE;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user's ranking in specific leaderboard
CREATE OR REPLACE FUNCTION get_user_ranking(
  p_user_id TEXT,
  p_game_type TEXT,
  p_culture TEXT DEFAULT NULL,
  p_period TEXT DEFAULT 'all_time'
)
RETURNS TABLE (
  rank BIGINT,
  total_players BIGINT,
  user_score INTEGER,
  score_to_next INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH user_entry AS (
    SELECT adjusted_score
    FROM leaderboard_entries
    WHERE user_id = p_user_id
      AND game_type = p_game_type
      AND (p_culture IS NULL OR culture = p_culture)
      AND period = p_period
    ORDER BY adjusted_score DESC
    LIMIT 1
  ),
  rankings AS (
    SELECT
      adjusted_score,
      ROW_NUMBER() OVER (ORDER BY adjusted_score DESC) as position,
      COUNT(*) OVER () as total
    FROM leaderboard_entries
    WHERE game_type = p_game_type
      AND (p_culture IS NULL OR culture = p_culture)
      AND period = p_period
  ),
  next_score AS (
    SELECT adjusted_score as next_score
    FROM rankings r, user_entry u
    WHERE r.adjusted_score > u.adjusted_score
    ORDER BY r.adjusted_score ASC
    LIMIT 1
  )
  SELECT
    r.position,
    r.total,
    u.adjusted_score,
    COALESCE(n.next_score - u.adjusted_score, 0)
  FROM user_entry u
  CROSS JOIN rankings r
  LEFT JOIN next_score n ON true
  WHERE r.adjusted_score = u.adjusted_score;
END;
$$ LANGUAGE plpgsql;

-- Verify tables were created
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('user_profiles', 'practice_sessions', 'achievements', 'leaderboard_entries', 'memory_palaces', 'user_progress', 'game_sessions')
ORDER BY tablename;
