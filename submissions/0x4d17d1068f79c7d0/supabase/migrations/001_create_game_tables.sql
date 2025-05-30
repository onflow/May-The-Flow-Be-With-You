-- Create tables for Memoreee game progress tracking
-- This migration sets up the core database schema for user progress, game sessions, and social features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
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

-- Practice sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    game_type TEXT NOT NULL CHECK (game_type IN ('random_palace', 'chaos_cards', 'entropy_storytelling', 'memory_speed', 'memory_race', 'digit_duel', 'story_chain')),
    score INTEGER NOT NULL DEFAULT 0,
    max_possible_score INTEGER NOT NULL DEFAULT 0,
    accuracy DECIMAL(5,2) NOT NULL DEFAULT 0.0, -- Percentage 0-100
    items_count INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    difficulty_level INTEGER NOT NULL DEFAULT 1,
    session_data JSONB DEFAULT '{}', -- Store game-specific data like seed, items, guesses
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory palaces table
CREATE TABLE IF NOT EXISTS memory_palaces (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
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

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points INTEGER DEFAULT 0,
    nft_token_id TEXT, -- Flow NFT token ID if minted
    metadata JSONB DEFAULT '{}',
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    game_type TEXT NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    total_sessions INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0.0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_type, period, period_start)
);

-- Social challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    challenge_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '{}', -- Game-specific challenge parameters
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER,
    is_public BOOLEAN DEFAULT TRUE,
    prize_pool INTEGER DEFAULT 0, -- In points or Flow tokens
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    score INTEGER DEFAULT 0,
    rank INTEGER,
    submission_data JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

-- User friendships/follows table
CREATE TABLE IF NOT EXISTS user_relationships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    relationship_type TEXT DEFAULT 'follow' CHECK (relationship_type IN ('follow', 'friend', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_game_type ON practice_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON practice_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_memory_palaces_user_id ON memory_palaces(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_palaces_public ON memory_palaces(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_game_type_period ON leaderboards(game_type, period);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memory_palaces_updated_at BEFORE UPDATE ON memory_palaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaderboards_updated_at BEFORE UPDATE ON leaderboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_palaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public profiles are viewable" ON user_profiles FOR SELECT USING (TRUE); -- Allow viewing other profiles

-- Practice sessions policies
CREATE POLICY "Users can view their own sessions" ON practice_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON practice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Memory palaces policies
CREATE POLICY "Users can manage their own palaces" ON memory_palaces FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public palaces are viewable" ON memory_palaces FOR SELECT USING (is_public = TRUE);

-- Achievements policies
CREATE POLICY "Users can view their own achievements" ON achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Leaderboards policies (public read)
CREATE POLICY "Leaderboards are publicly viewable" ON leaderboards FOR SELECT USING (TRUE);
CREATE POLICY "Users can update their own leaderboard entries" ON leaderboards FOR ALL USING (auth.uid() = user_id);

-- Challenges policies
CREATE POLICY "Public challenges are viewable" ON challenges FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Users can create challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Challenge creators can manage their challenges" ON challenges FOR ALL USING (auth.uid() = creator_id);

-- Challenge participants policies
CREATE POLICY "Users can view challenge participants" ON challenge_participants FOR SELECT USING (TRUE);
CREATE POLICY "Users can join challenges" ON challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own participation" ON challenge_participants FOR UPDATE USING (auth.uid() = user_id);

-- User relationships policies
CREATE POLICY "Users can manage their own relationships" ON user_relationships FOR ALL USING (auth.uid() = follower_id);
CREATE POLICY "Users can view relationships involving them" ON user_relationships FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
