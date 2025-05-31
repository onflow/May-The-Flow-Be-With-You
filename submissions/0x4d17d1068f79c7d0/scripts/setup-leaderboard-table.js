#!/usr/bin/env node

/**
 * Setup Leaderboard Table Script
 * 
 * This script ensures the correct leaderboard table exists with the proper schema
 * for the multi-tier leaderboard system (Flow/Supabase tiers).
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupLeaderboardTable() {
  console.log('🚀 Setting up leaderboard table...');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../database/migrations/create_leaderboard.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing leaderboard migration...');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Leaderboard table setup completed successfully!');

    // Verify the table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'leaderboard');

    if (tableError) {
      console.warn('⚠️ Could not verify table creation:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('✅ Verified: leaderboard table exists');
    } else {
      console.warn('⚠️ Table verification failed - table may not exist');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function setupLeaderboardTableDirect() {
  console.log('🚀 Setting up leaderboard table (direct method)...');

  const createTableSQL = `
    -- Multi-Tier Leaderboard Table
    -- Supports both Supabase and Flow users with different scoring tiers

    CREATE TABLE IF NOT EXISTS leaderboard (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      score INTEGER NOT NULL,
      adjusted_score INTEGER NOT NULL, -- 80% for Supabase, 100% for Flow
      game_type TEXT NOT NULL,
      culture TEXT NOT NULL,
      user_tier TEXT NOT NULL CHECK (user_tier IN ('supabase', 'flow')),
      verified BOOLEAN DEFAULT FALSE,
      
      -- Flow blockchain data (for Flow users)
      transaction_id TEXT,
      block_height BIGINT,
      vrf_seed BIGINT,
      
      -- Timestamps
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_leaderboard_adjusted_score ON leaderboard(adjusted_score DESC);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_game_type ON leaderboard(game_type);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_culture ON leaderboard(culture);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_user_tier ON leaderboard(user_tier);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_verified ON leaderboard(verified);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON leaderboard(created_at DESC);

    -- Composite indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_leaderboard_game_culture_score ON leaderboard(game_type, culture, adjusted_score DESC);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_tier_score ON leaderboard(user_tier, adjusted_score DESC);

    -- RLS (Row Level Security) policies
    ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

    -- Policy: Anyone can read leaderboard entries
    DROP POLICY IF EXISTS "Anyone can view leaderboard" ON leaderboard;
    CREATE POLICY "Anyone can view leaderboard" ON leaderboard
      FOR SELECT USING (true);

    -- Policy: Users can insert their own scores
    DROP POLICY IF EXISTS "Users can insert own scores" ON leaderboard;
    CREATE POLICY "Users can insert own scores" ON leaderboard
      FOR INSERT WITH CHECK (true); -- We'll handle validation in the service

    -- Policy: Users can update their own entries (for adding transaction details)
    DROP POLICY IF EXISTS "Users can update own entries" ON leaderboard;
    CREATE POLICY "Users can update own entries" ON leaderboard
      FOR UPDATE USING (user_id = auth.uid()::text);
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Direct setup failed:', error);
      return false;
    }

    console.log('✅ Leaderboard table setup completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Direct setup error:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🎯 Memoreee Leaderboard Table Setup');
  console.log('=====================================');

  // Try the migration file first, then fallback to direct method
  try {
    await setupLeaderboardTable();
  } catch (error) {
    console.log('⚠️ Migration file method failed, trying direct method...');
    const success = await setupLeaderboardTableDirect();
    if (!success) {
      console.error('❌ Both methods failed. Please check your Supabase configuration.');
      process.exit(1);
    }
  }

  console.log('🎉 Setup complete!');
}

main().catch(console.error);
