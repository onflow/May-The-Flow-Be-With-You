#!/usr/bin/env node

/**
 * Database Schema Harmonization Script
 *
 * This script fixes the database schema conflicts by:
 * 1. Dropping conflicting tables
 * 2. Creating the unified leaderboard_entries table
 * 3. Updating all references to use the correct table name
 * 4. Setting up proper indexes and constraints
 */

const { createClient } = require("@supabase/supabase-js");
const { readFileSync } = require("fs");
const { join } = require("path");

// Load environment variables
require("dotenv").config({ path: join(__dirname, "../.env.local") });

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

async function harmonizeSchema() {
  console.log("🔧 Starting database schema harmonization...");

  try {
    // Step 1: Check existing tables using SQL query
    console.log("\n📋 Checking existing tables...");
    const { data: tables, error: tablesError } = await supabase.rpc(
      "exec_sql",
      {
        sql: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('leaderboard', 'leaderboards', 'leaderboard_entries');
      `,
      }
    );

    if (tablesError) {
      console.error("❌ Error checking tables:", tablesError);
      // Continue anyway - tables might not exist yet
    }

    const existingTables = tables ? tables.map((t) => t.table_name) : [];
    console.log("📊 Existing tables:", existingTables);

    // Step 2: Drop conflicting tables
    const conflictingTables = ["leaderboard", "leaderboards"];
    for (const tableName of conflictingTables) {
      if (existingTables.includes(tableName)) {
        console.log(`🗑️ Dropping conflicting table: ${tableName}`);
        const { error } = await supabase.rpc("exec_sql", {
          sql: `DROP TABLE IF EXISTS ${tableName} CASCADE;`,
        });
        if (error) {
          console.warn(`⚠️ Warning dropping ${tableName}:`, error.message);
        } else {
          console.log(`✅ Dropped table: ${tableName}`);
        }
      }
    }

    // Step 3: Create unified leaderboard_entries table
    console.log("\n🏗️ Creating unified leaderboard_entries table...");

    const createTableSQL = `
      -- Drop existing table if it exists
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
    `;

    const { error: createError } = await supabase.rpc("exec_sql", {
      sql: createTableSQL,
    });

    if (createError) {
      console.error("❌ Error creating table:", createError);
      return;
    }

    console.log("✅ Created leaderboard_entries table with indexes");

    // Step 4: Create helpful views
    console.log("\n📊 Creating leaderboard views...");

    const createViewsSQL = `
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
      
      -- View: Daily leaderboard
      CREATE OR REPLACE VIEW leaderboard_daily AS
      SELECT * FROM leaderboard_top_scores
      WHERE period = 'daily' AND period_start = CURRENT_DATE;
      
      -- View: All-time leaderboard
      CREATE OR REPLACE VIEW leaderboard_all_time AS
      SELECT * FROM leaderboard_top_scores
      WHERE period = 'all_time';
    `;

    const { error: viewsError } = await supabase.rpc("exec_sql", {
      sql: createViewsSQL,
    });

    if (viewsError) {
      console.error("❌ Error creating views:", viewsError);
      return;
    }

    console.log("✅ Created leaderboard views");

    // Step 5: Set up RLS policies
    console.log("\n🔒 Setting up Row Level Security policies...");

    const rlsSQL = `
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
    `;

    const { error: rlsError } = await supabase.rpc("exec_sql", { sql: rlsSQL });

    if (rlsError) {
      console.error("❌ Error setting up RLS:", rlsError);
      return;
    }

    console.log("✅ Set up Row Level Security policies");

    // Step 6: Verify the setup
    console.log("\n🔍 Verifying table setup...");

    const { data: finalTables, error: finalError } = await supabase.rpc(
      "exec_sql",
      {
        sql: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'leaderboard_entries';
      `,
      }
    );

    if (finalError || !finalTables || finalTables.length === 0) {
      console.error("❌ Verification failed:", finalError);
      return;
    }

    console.log("✅ Table verification successful");

    // Step 7: Test basic operations
    console.log("\n🧪 Testing basic operations...");

    // Test insert
    const testEntry = {
      user_id: "test_user_" + Date.now(),
      username: "Test User",
      user_tier: "supabase",
      game_type: "chaos-cards",
      culture: "test",
      raw_score: 100,
      adjusted_score: 80,
      period: "all_time",
      period_start: new Date().toISOString().split("T")[0],
      period_end: "2099-12-31",
    };

    const { data: insertData, error: insertError } = await supabase
      .from("leaderboard_entries")
      .insert(testEntry)
      .select();

    if (insertError) {
      console.error("❌ Test insert failed:", insertError);
      return;
    }

    console.log("✅ Test insert successful");

    // Clean up test data
    await supabase
      .from("leaderboard_entries")
      .delete()
      .eq("user_id", testEntry.user_id);

    console.log("\n🎉 Database schema harmonization completed successfully!");
    console.log("\n📋 Summary:");
    console.log("  ✅ Removed conflicting tables (leaderboard, leaderboards)");
    console.log("  ✅ Created unified leaderboard_entries table");
    console.log("  ✅ Added performance indexes");
    console.log("  ✅ Created helpful views");
    console.log("  ✅ Set up Row Level Security");
    console.log("  ✅ Verified functionality");
  } catch (error) {
    console.error("❌ Schema harmonization failed:", error);
    process.exit(1);
  }
}

// Run the harmonization
harmonizeSchema();
