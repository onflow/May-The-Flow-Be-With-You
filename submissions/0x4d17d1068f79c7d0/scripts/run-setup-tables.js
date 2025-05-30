#!/usr/bin/env node

/**
 * Run the setup-tables.sql script directly
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSetupTables() {
  try {
    console.log("🚀 Running setup-tables.sql...");

    // Read the setup-tables.sql file
    const setupPath = path.join(__dirname, "../supabase/setup-tables.sql");
    
    if (!fs.existsSync(setupPath)) {
      console.error("❌ setup-tables.sql not found:", setupPath);
      process.exit(1);
    }

    const setupSQL = fs.readFileSync(setupPath, "utf8");
    
    // Split into statements and filter out comments
    const statements = setupSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--") && !stmt.startsWith("/*"));

    console.log(`📊 Found ${statements.length} SQL statements to execute...`);

    // Check if tables exist first
    const tablesToCheck = ['user_progress', 'game_sessions'];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`   ❌ Table '${table}' does not exist - needs to be created`);
          } else {
            console.log(`   ⚠️  Table '${table}' error: ${error.message}`);
          }
        } else {
          console.log(`   ✅ Table '${table}' exists and is accessible`);
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}' check failed: ${err.message}`);
      }
    }

    console.log("\n📋 To create missing tables:");
    console.log("   1. Go to https://todqarjzydxrfcjnwyid.supabase.co");
    console.log("   2. Navigate to SQL Editor");
    console.log("   3. Copy and paste the contents of supabase/setup-tables.sql");
    console.log("   4. Click 'Run' to execute the SQL");
    
    console.log("\n✅ Database check complete!");
    
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

runSetupTables();
