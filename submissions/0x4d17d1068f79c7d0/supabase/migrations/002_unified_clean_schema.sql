-- UNIFIED MEMOREEE DATABASE SCHEMA - CLEAN START
-- This migration creates a fresh, DRY schema matching our unified architecture
-- Run this in Supabase SQL Editor after clearing old data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: DROP OLD CONFLICTING TABLES (if they exist)
-- ============================================================================

DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS leaderboard_entries CASCADE;

-- ============================================================================
-- STEP 2: CREATE UNIFIED TABLES
-- ============================================================================

-- 1. User profiles table (enhanced with tier system)
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY, -- UUID from auth.users, anonymous ID, or Flow address
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Optional link to auth
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    flow_address TEXT, -- Flow wallet address for blockchain users
    wallet_type TEXT CHECK (wallet_type IN ('cadence', 'evm', 'unknown')),
    user_tier TEXT DEFAULT 'supabase' CHECK (user_tier IN ('anonymous', 'supabase', 'flow')),
    skill_levels JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    total_practice_time INTERVAL DEFAULT '0 seconds',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Game sessions table (unified storage for all game data)
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    game_type TEXT NOT NULL CHECK (game_type IN ('chaos_cards', 'memory_palace', 'speed_challenge')),
    session_id TEXT UNIQUE NOT NULL, -- External session ID from game service
    score INTEGER NOT NULL DEFAULT 0,
    max_possible_score INTEGER NOT NULL DEFAULT 0,
    accuracy DECIMAL(5,2) NOT NULL DEFAULT 0.0, -- 0-100 percentage format (CONSISTENT!)
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    difficulty_level INTEGER NOT NULL DEFAULT 1,
    items_count INTEGER NOT NULL DEFAULT 0,
    perfect_game BOOLEAN DEFAULT FALSE,
    session_data JSONB DEFAULT '{}', -- Enhanced metadata: technique, vrfSeed, culturalCategory
    flow_transaction_id TEXT, -- Flow blockchain transaction ID
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Leaderboards table (computed rankings from game_sessions)
CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    game_type TEXT NOT NULL CHECK (game_type IN ('chaos_cards', 'memory_palace', 'speed_challenge')),
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    score INTEGER NOT NULL DEFAULT 0, -- Best score for this period
    rank INTEGER, -- Calculated rank (1st, 2nd, 3rd, etc.)
    total_sessions INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0.0, -- 0-100 percentage
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_type, period) -- Prevent duplicate entries
);

-- 4. Achievements table (simplified)
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points INTEGER DEFAULT 0,
    nft_token_id TEXT, -- Flow NFT token ID if minted
    metadata JSONB DEFAULT '{}',
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User progress tracking table (per-game progress)
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    game_type TEXT NOT NULL CHECK (game_type IN ('chaos_cards', 'memory_palace', 'speed_challenge')),
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0.0, -- 0-100 percentage
    total_time_played INTERVAL DEFAULT '0 seconds',
    streak_current INTEGER DEFAULT 0,
    streak_best INTEGER DEFAULT 0,
    last_played_at TIMESTAMP WITH TIME ZONE,
    statistics JSONB DEFAULT '{}', -- Detailed stats per game type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_type) -- One progress record per user per game
);

-- 6. Memory palaces table (optional for future 3D features)
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

-- ============================================================================
-- STEP 3: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Game sessions indexes (most important for performance)
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(score DESC); -- For ranking calculations
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_id ON game_sessions(session_id);

-- Leaderboards indexes
CREATE INDEX IF NOT EXISTS idx_leaderboards_game_type_period ON leaderboards(game_type, period);
CREATE INDEX IF NOT EXISTS idx_leaderboards_score_rank ON leaderboards(score DESC, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user_game ON leaderboards(user_id, game_type);

-- User progress indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_game_type ON user_progress(game_type);

-- Achievements indexes
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_flow_address ON user_profiles(flow_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_tier ON user_profiles(user_tier);

-- ============================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_palaces ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES (Flexible for auth users, anonymous, and Flow)
-- ============================================================================

-- Public read access for leaderboards
CREATE POLICY "Public leaderboards are viewable by everyone" ON leaderboards
    FOR SELECT USING (true);

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (
        auth_user_id = auth.uid() OR
        auth.uid() IS NULL OR
        id LIKE '0x%' -- Allow Flow addresses (id is TEXT so this works)
    );

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (
        auth_user_id = auth.uid() OR
        auth.uid() IS NULL OR
        id LIKE '0x%'
    );

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (
        auth_user_id = auth.uid() OR
        id LIKE '0x%'
    );

-- Game sessions policies (flexible for all user types)
CREATE POLICY "Users can view own game sessions" ON game_sessions
    FOR SELECT USING (
        user_id = COALESCE(auth.uid()::text, '') OR
        auth.uid() IS NULL OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses (user_id is TEXT)
    );

CREATE POLICY "Users can insert own game sessions" ON game_sessions
    FOR INSERT WITH CHECK (
        user_id = COALESCE(auth.uid()::text, '') OR
        auth.uid() IS NULL OR
        user_id LIKE '0x%'
    );

-- User progress policies
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (
        user_id = COALESCE(auth.uid()::text, '') OR
        auth.uid() IS NULL OR
        user_id LIKE '0x%' -- user_id is TEXT
    );

CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (
        user_id = COALESCE(auth.uid()::text, '') OR
        auth.uid() IS NULL OR
        user_id LIKE '0x%'
    );

CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (
        user_id = COALESCE(auth.uid()::text, '') OR
        user_id LIKE '0x%'
    );

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON achievements
    FOR SELECT USING (
        user_id = COALESCE(auth.uid()::text, '') OR
        auth.uid() IS NULL OR
        user_id LIKE '0x%' -- user_id is TEXT
    );

CREATE POLICY "Users can insert own achievements" ON achievements
    FOR INSERT WITH CHECK (
        user_id = COALESCE(auth.uid()::text, '') OR
        auth.uid() IS NULL OR
        user_id LIKE '0x%'
    );

-- Memory palaces policies
CREATE POLICY "Users can view own or public palaces" ON memory_palaces
    FOR SELECT USING (
        user_id = COALESCE(auth.uid()::text, '') OR
        is_public = true OR
        auth.uid() IS NULL OR
        user_id LIKE '0x%' -- user_id is TEXT
    );

CREATE POLICY "Users can insert own palaces" ON memory_palaces
    FOR INSERT WITH CHECK (
        user_id = COALESCE(auth.uid()::text, '') OR
        auth.uid() IS NULL OR
        user_id LIKE '0x%'
    );

-- ============================================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, auth_user_id, username, display_name, user_tier)
  VALUES (
    NEW.id::text,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'supabase' -- Default tier for authenticated users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFICATION: Check that tables were created correctly
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'game_sessions', 'leaderboards', 'achievements', 'user_progress', 'memory_palaces')
ORDER BY tablename;
