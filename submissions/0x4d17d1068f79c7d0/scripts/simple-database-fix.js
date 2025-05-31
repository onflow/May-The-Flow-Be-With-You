#!/usr/bin/env node

/**
 * Simple Database Fix Script
 * 
 * This script creates the leaderboard_entries table using direct SQL execution
 */

const { createClient } = require('@supabase/supabase-js');
const { join } = require('path');

// Load environment variables
require('dotenv').config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🔧 Setting up database schema...');

  try {
    // Step 1: Create the leaderboard_entries table directly
    console.log('\n🏗️ Creating leaderboard_entries table...');
    
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, we need to create it
      console.log('📋 Table does not exist, creating it...');
      
      // Since we can't use exec_sql, let's try a different approach
      // We'll create the table by attempting operations and handling errors
      
      console.log('⚠️ Cannot create table directly via Supabase client.');
      console.log('📝 Please run the following SQL in your Supabase SQL editor:');
      console.log('\n' + '='.repeat(80));
      
      const createTableSQL = `
-- Drop existing conflicting tables
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS leaderboards CASCADE;
DROP TABLE IF EXISTS leaderboard_entries CASCADE;

-- Create unified leaderboard_entries table
CREATE TABLE leaderboard_entries (
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

-- Create indexes for performance
CREATE INDEX idx_leaderboard_entries_user_tier ON leaderboard_entries(user_tier);
CREATE INDEX idx_leaderboard_entries_game_culture ON leaderboard_entries(game_type, culture);
CREATE INDEX idx_leaderboard_entries_period ON leaderboard_entries(period, period_start);
CREATE INDEX idx_leaderboard_entries_score ON leaderboard_entries(adjusted_score DESC);
CREATE INDEX idx_leaderboard_entries_verified ON leaderboard_entries(verified) WHERE verified = true;
CREATE INDEX idx_leaderboard_entries_created_at ON leaderboard_entries(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leaderboard_entries_updated_at 
  BEFORE UPDATE ON leaderboard_entries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read leaderboard entries
CREATE POLICY "Anyone can read leaderboard entries" ON leaderboard_entries
  FOR SELECT USING (true);

-- Policy: Authenticated users can insert their own entries
CREATE POLICY "Users can insert own leaderboard entries" ON leaderboard_entries
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id OR 
    auth.uid() IS NULL
  );

-- Policy: Users can update their own entries
CREATE POLICY "Users can update own leaderboard entries" ON leaderboard_entries
  FOR UPDATE USING (
    auth.uid()::text = user_id OR 
    auth.uid() IS NULL
  );

-- Create helpful views
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
`;
      
      console.log(createTableSQL);
      console.log('='.repeat(80));
      console.log('\n📝 After running the SQL above, run this script again to verify.');
      
    } else if (error) {
      console.error('❌ Error checking table:', error);
      return false;
    } else {
      console.log('✅ leaderboard_entries table already exists');
      
      // Test basic operations
      console.log('\n🧪 Testing basic operations...');
      
      const testEntry = {
        user_id: `test_${Date.now()}`,
        username: 'Test User',
        user_tier: 'supabase',
        game_type: 'chaos-cards',
        culture: 'test',
        raw_score: 100,
        adjusted_score: 80,
        period: 'all_time',
        period_start: new Date().toISOString().split('T')[0],
        period_end: '2099-12-31'
      };
      
      // Test insert
      const { data: insertData, error: insertError } = await supabase
        .from('leaderboard_entries')
        .insert(testEntry)
        .select();
      
      if (insertError) {
        console.error('❌ Test insert failed:', insertError);
        return false;
      }
      
      console.log('✅ Test insert successful');
      
      // Test read
      const { data: readData, error: readError } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('user_id', testEntry.user_id);
      
      if (readError || !readData || readData.length === 0) {
        console.error('❌ Test read failed:', readError);
        return false;
      }
      
      console.log('✅ Test read successful');
      
      // Clean up
      await supabase
        .from('leaderboard_entries')
        .delete()
        .eq('user_id', testEntry.user_id);
      
      console.log('✅ Test cleanup successful');
      
      console.log('\n🎉 Database schema is working correctly!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return false;
  }
}

// Run the setup
setupDatabase().then(success => {
  process.exit(success ? 0 : 1);
});
