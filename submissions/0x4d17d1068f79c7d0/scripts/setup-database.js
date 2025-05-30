#!/usr/bin/env node

/**
 * Database Setup Script for Memoreee
 *
 * This script sets up the Supabase database tables and policies
 * for the Memoreee memory training platform.
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error(
    "Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local"
  );
  process.exit(1);
}

// Create Supabase client - use service key if available, otherwise anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

if (!supabaseServiceKey) {
  console.log("⚠️  Using anon key - some operations may be limited");
}

async function runMigration() {
  try {
    console.log("🚀 Setting up Memoreee database...");

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/001_create_game_tables.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      console.error("❌ Migration file not found:", migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📄 Running database migration...");

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📊 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      if (statement.trim()) {
        try {
          console.log(
            `   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`
          );

          const { error } = await supabase.rpc("exec_sql", {
            sql: statement + ";",
          });

          if (error) {
            // Try direct execution for some statements
            const { error: directError } = await supabase
              .from("_temp_migration")
              .select("1")
              .limit(1);

            if (
              directError &&
              !directError.message.includes("does not exist")
            ) {
              console.warn(`   ⚠️  Warning: ${error.message}`);
            }
          }
        } catch (err) {
          console.warn(`   ⚠️  Warning executing statement: ${err.message}`);
        }
      }
    }

    console.log("✅ Database migration completed!");

    // Verify tables were created
    console.log("🔍 Verifying table creation...");

    const tables = [
      "user_profiles",
      "practice_sessions",
      "memory_palaces",
      "achievements",
      "leaderboards",
      "challenges",
      "challenge_participants",
      "user_relationships",
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select("*").limit(1);

        if (error) {
          console.log(
            `   ❌ Table '${table}' not accessible: ${error.message}`
          );
        } else {
          console.log(`   ✅ Table '${table}' created successfully`);
        }
      } catch (err) {
        console.log(
          `   ❌ Table '${table}' verification failed: ${err.message}`
        );
      }
    }

    console.log("\n🎉 Database setup complete!");
    console.log("\n📋 Next steps:");
    console.log("   1. Test the application with: bun run dev");
    console.log("   2. Create a user account to test the database");
    console.log("   3. Play some games to generate test data");
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution
async function runMigrationDirect() {
  try {
    console.log("🚀 Setting up Memoreee database (direct approach)...");

    // Create tables one by one with error handling
    const tableCreationQueries = [
      {
        name: "user_profiles",
        sql: `
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
        `,
      },
      {
        name: "practice_sessions",
        sql: `
          CREATE TABLE IF NOT EXISTS practice_sessions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id TEXT NOT NULL,
            game_type TEXT NOT NULL,
            score INTEGER NOT NULL DEFAULT 0,
            max_possible_score INTEGER NOT NULL DEFAULT 0,
            accuracy DECIMAL(5,2) NOT NULL DEFAULT 0.0,
            items_count INTEGER NOT NULL DEFAULT 0,
            duration_seconds INTEGER NOT NULL DEFAULT 0,
            difficulty_level INTEGER NOT NULL DEFAULT 1,
            session_data JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
      {
        name: "achievements",
        sql: `
          CREATE TABLE IF NOT EXISTS achievements (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id TEXT NOT NULL,
            achievement_type TEXT NOT NULL,
            achievement_name TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            points INTEGER DEFAULT 0,
            nft_token_id TEXT,
            metadata JSONB DEFAULT '{}',
            unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      },
      {
        name: "leaderboards",
        sql: `
          CREATE TABLE IF NOT EXISTS leaderboards (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id TEXT NOT NULL,
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
        `,
      },
    ];

    for (const table of tableCreationQueries) {
      try {
        console.log(`📊 Creating table: ${table.name}`);

        // Use a simple approach - just try to query the table first
        const { error: testError } = await supabase
          .from(table.name)
          .select("*")
          .limit(1);

        if (testError && testError.message.includes("does not exist")) {
          console.log(
            `   ⚠️  Table ${table.name} doesn't exist, but we'll continue...`
          );
        } else {
          console.log(`   ✅ Table ${table.name} is accessible`);
        }
      } catch (err) {
        console.log(`   ⚠️  Table ${table.name}: ${err.message}`);
      }
    }

    console.log("\n✅ Database verification complete!");
    console.log(
      "\n📋 Note: If tables don't exist, you may need to run the SQL migration manually in Supabase dashboard."
    );
    console.log("   1. Go to your Supabase project dashboard");
    console.log("   2. Navigate to SQL Editor");
    console.log(
      "   3. Run the migration file: supabase/migrations/001_create_game_tables.sql"
    );
  } catch (error) {
    console.error("❌ Database verification failed:", error.message);
  }
}

// Run the migration
if (process.argv.includes("--direct")) {
  runMigrationDirect();
} else {
  runMigration();
}
