#!/usr/bin/env node

/**
 * Check the actual schema of database tables
 */

const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableSchema() {
  try {
    console.log("🔍 Checking table schemas...\n");

    // Test user_progress table
    console.log("📊 Testing user_progress table:");
    try {
      // Try to insert a test record to see what columns are expected
      const testUserId = "test_schema_check_" + Date.now();
      const { data, error } = await supabase
        .from('user_progress')
        .insert({
          user_id: testUserId,
          game_type: 'test',
          level: 1
        })
        .select();

      if (error) {
        console.log("   ❌ Insert error:", error.message);
        console.log("   📝 Error details:", error);
      } else {
        console.log("   ✅ Insert successful, columns available:", Object.keys(data[0] || {}));
        
        // Clean up test record
        await supabase.from('user_progress').delete().eq('user_id', testUserId);
      }
    } catch (err) {
      console.log("   ❌ Test failed:", err.message);
    }

    console.log("\n📊 Testing game_sessions table:");
    try {
      // Try to insert a test record to see what columns are expected
      const testSessionId = "test_session_" + Date.now();
      const testUserId = "test_user_" + Date.now();
      const { data, error } = await supabase
        .from('game_sessions')
        .insert({
          user_id: testUserId,
          game_type: 'test',
          session_id: testSessionId,
          score: 100
        })
        .select();

      if (error) {
        console.log("   ❌ Insert error:", error.message);
        console.log("   📝 Error details:", error);
      } else {
        console.log("   ✅ Insert successful, columns available:", Object.keys(data[0] || {}));
        
        // Clean up test record
        await supabase.from('game_sessions').delete().eq('session_id', testSessionId);
      }
    } catch (err) {
      console.log("   ❌ Test failed:", err.message);
    }

    console.log("\n✅ Schema check complete!");
    
  } catch (error) {
    console.error("❌ Schema check failed:", error.message);
    process.exit(1);
  }
}

checkTableSchema();
