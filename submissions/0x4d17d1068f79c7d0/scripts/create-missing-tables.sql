-- Create missing tables for Chaos Cards game

-- Create user_progress table
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
  statistics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_type)
);

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  game_type TEXT NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  max_possible_score INTEGER NOT NULL DEFAULT 0,
  accuracy DECIMAL(5,2) NOT NULL DEFAULT 0.0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  difficulty_level INTEGER NOT NULL DEFAULT 1,
  items_count INTEGER NOT NULL DEFAULT 0,
  perfect_game BOOLEAN DEFAULT FALSE,
  session_data JSONB DEFAULT '{}',
  flow_transaction_id TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_progress (allow Flow wallet users)
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    auth.uid() IS NULL OR
    user_id LIKE '0x%'
  );

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::text OR
    auth.uid() IS NULL OR
    user_id LIKE '0x%'
  );

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (
    user_id = auth.uid()::text OR
    user_id LIKE '0x%'
  );

-- Create RLS policies for game_sessions (allow Flow wallet users)
CREATE POLICY "Users can view own sessions" ON game_sessions
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    auth.uid() IS NULL OR
    user_id LIKE '0x%'
  );

CREATE POLICY "Users can insert own sessions" ON game_sessions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::text OR
    auth.uid() IS NULL OR
    user_id LIKE '0x%'
  );

CREATE POLICY "Users can update own sessions" ON game_sessions
  FOR UPDATE USING (
    user_id = auth.uid()::text OR
    user_id LIKE '0x%'
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_game_type ON user_progress(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_id ON game_sessions(session_id);
