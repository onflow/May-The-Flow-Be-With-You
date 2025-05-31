-- Simplified Database Setup for Memoreee
-- Run this in your Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- 4. Leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    total_sessions INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0.0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_leaderboards_game_type_period ON leaderboards(game_type, period);
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
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_palaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access (for leaderboards)
CREATE POLICY "Public leaderboards are viewable by everyone" ON leaderboards
    FOR SELECT USING (true);

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
