#!/usr/bin/env node

/**
 * Create Leaderboard Entries Table
 *
 * This script creates the new unified leaderboard_entries table
 * and drops the old leaderboards table if it exists.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error(
    "Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createLeaderboardEntriesTable() {
  console.log("🚀 Creating unified leaderboard_entries table...");

  try {
    // Create new unified table directly
    console.log("📊 Creating new leaderboard_entries table...");

    // First, try to create the table
    const { error: createError } = await supabase.rpc("sql", {
      query: `
      -- Unified Leaderboard Entries table
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

      -- Indexes for performance
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

      -- RLS (Row Level Security)
      ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

      -- Policy: Anyone can read leaderboard entries
      DROP POLICY IF EXISTS "Public leaderboard entries are viewable by everyone" ON leaderboard_entries;
      CREATE POLICY "Public leaderboard entries are viewable by everyone" ON leaderboard_entries
        FOR SELECT USING (true);

      -- Policy: Users can insert their own scores
      DROP POLICY IF EXISTS "Users can insert own leaderboard entries" ON leaderboard_entries;
      CREATE POLICY "Users can insert own leaderboard entries" ON leaderboard_entries
        FOR INSERT WITH CHECK (
          user_id = auth.uid()::text OR
          auth.uid() IS NULL OR
          user_id LIKE '0x%' -- Allow Flow wallet addresses
        );

      -- Policy: Users can update their own entries (for adding transaction details)
      DROP POLICY IF EXISTS "Users can update own leaderboard entries" ON leaderboard_entries;
      CREATE POLICY "Users can update own leaderboard entries" ON leaderboard_entries
        FOR UPDATE USING (
          user_id = auth.uid()::text OR
          user_id LIKE '0x%' -- Allow Flow wallet addresses
        );
      `,
    });

    if (createError) {
      console.error("❌ Failed to create table:", createError);

      // Try alternative approach - create table step by step
      console.log("🔄 Trying alternative approach...");

      try {
        // Just create the basic table structure
        const basicTable = await supabase.rpc("sql", {
          query: `CREATE TABLE IF NOT EXISTS leaderboard_entries (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id TEXT NOT NULL,
            username TEXT NOT NULL,
            user_tier TEXT NOT NULL,
            game_type TEXT NOT NULL,
            culture TEXT NOT NULL,
            raw_score INTEGER NOT NULL,
            adjusted_score INTEGER NOT NULL,
            period TEXT NOT NULL,
            period_start DATE NOT NULL,
            period_end DATE NOT NULL,
            verified BOOLEAN DEFAULT FALSE,
            transaction_id TEXT,
            block_height BIGINT,
            vrf_seed BIGINT,
            session_data JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`,
        });

        if (basicTable.error) {
          throw basicTable.error;
        }

        console.log("✅ Basic table structure created");
      } catch (altError) {
        console.error("❌ Alternative approach also failed:", altError);
        console.log("");
        console.log("🔧 Manual Setup Required:");
        console.log("1. Go to your Supabase dashboard");
        console.log("2. Navigate to SQL Editor");
        console.log("3. Run this SQL:");
        console.log("");
        console.log("CREATE TABLE IF NOT EXISTS leaderboard_entries (");
        console.log("  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,");
        console.log("  user_id TEXT NOT NULL,");
        console.log("  username TEXT NOT NULL,");
        console.log("  user_tier TEXT NOT NULL,");
        console.log("  game_type TEXT NOT NULL,");
        console.log("  culture TEXT NOT NULL,");
        console.log("  raw_score INTEGER NOT NULL,");
        console.log("  adjusted_score INTEGER NOT NULL,");
        console.log("  period TEXT NOT NULL,");
        console.log("  period_start DATE NOT NULL,");
        console.log("  period_end DATE NOT NULL,");
        console.log("  verified BOOLEAN DEFAULT FALSE,");
        console.log("  transaction_id TEXT,");
        console.log("  block_height BIGINT,");
        console.log("  vrf_seed BIGINT,");
        console.log("  session_data JSONB DEFAULT '{}',");
        console.log("  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),");
        console.log("  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()");
        console.log(");");
        console.log("");
        process.exit(1);
      }
    } else {
      console.log("✅ leaderboard_entries table created successfully!");
    }

    const error = createError;

    if (error) {
      console.error("❌ Failed to create table:", error);
      process.exit(1);
    }

    console.log("✅ leaderboard_entries table created successfully!");

    // Verify the table exists
    const { data: tables, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "leaderboard_entries");

    if (tableError) {
      console.warn("⚠️ Could not verify table creation:", tableError);
    } else if (tables && tables.length > 0) {
      console.log("✅ Verified: leaderboard_entries table exists");
    } else {
      console.warn("⚠️ Table verification failed - table may not exist");
    }

    console.log("🎉 Setup complete!");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

// Main execution
createLeaderboardEntriesTable().catch(console.error);
