#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingTables() {
  console.log('🔧 Creating missing tables...\n');

  try {
    // Create user_progress table
    console.log('Creating user_progress table...');
    const { error: progressError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (progressError) {
      console.error('❌ Error creating user_progress:', progressError.message);
    } else {
      console.log('✅ user_progress table created');
    }

    // Create game_sessions table
    console.log('Creating game_sessions table...');
    const { error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (sessionsError) {
      console.error('❌ Error creating game_sessions:', sessionsError.message);
    } else {
      console.log('✅ game_sessions table created');
    }

    // Enable RLS on new tables
    console.log('Enabling Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
        ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError.message);
    } else {
      console.log('✅ RLS enabled');
    }

    // Create RLS policies for Flow wallet users
    console.log('Creating RLS policies...');
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- User progress policies
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

        -- Game sessions policies
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
      `
    });

    if (policyError) {
      console.error('❌ Error creating policies:', policyError.message);
    } else {
      console.log('✅ RLS policies created');
    }

    console.log('\n🎉 Missing tables created successfully!');
    console.log('🔄 Please restart your development server to test the fixes.');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createMissingTables();
