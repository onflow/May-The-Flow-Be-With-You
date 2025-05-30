#!/usr/bin/env node

/**
 * Fix RLS policies to allow Flow wallet users to access their data
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

async function testFlowUserAccess() {
  try {
    console.log("🔍 Testing Flow wallet user access...\n");

    const flowUserId = "0xf8d6e0586b0a20c7"; // The user from the error logs

    // Test 1: Try to read user_progress
    console.log("📊 Testing user_progress read access:");
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', flowUserId);

      if (error) {
        console.log("   ❌ Read error:", error.message);
        console.log("   📝 Error code:", error.code);
      } else {
        console.log("   ✅ Read successful, found", data?.length || 0, "records");
      }
    } catch (err) {
      console.log("   ❌ Read failed:", err.message);
    }

    // Test 2: Try to insert into user_progress
    console.log("\n📊 Testing user_progress insert access:");
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .insert({
          user_id: flowUserId,
          game_type: 'test_flow_access',
          level: 1,
          experience_points: 100
        })
        .select();

      if (error) {
        console.log("   ❌ Insert error:", error.message);
        console.log("   📝 Error code:", error.code);
      } else {
        console.log("   ✅ Insert successful");
        
        // Clean up test record
        await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', flowUserId)
          .eq('game_type', 'test_flow_access');
      }
    } catch (err) {
      console.log("   ❌ Insert failed:", err.message);
    }

    // Test 3: Try to insert into game_sessions
    console.log("\n📊 Testing game_sessions insert access:");
    try {
      const testSessionId = `test_flow_session_${Date.now()}`;
      const { data, error } = await supabase
        .from('game_sessions')
        .insert({
          user_id: flowUserId,
          game_type: 'test_flow_access',
          session_id: testSessionId,
          score: 100
        })
        .select();

      if (error) {
        console.log("   ❌ Insert error:", error.message);
        console.log("   📝 Error code:", error.code);
      } else {
        console.log("   ✅ Insert successful");
        
        // Clean up test record
        await supabase
          .from('game_sessions')
          .delete()
          .eq('session_id', testSessionId);
      }
    } catch (err) {
      console.log("   ❌ Insert failed:", err.message);
    }

    console.log("\n📋 Recommendations:");
    console.log("   1. If you see 406 errors, the RLS policies may need to be updated");
    console.log("   2. Consider temporarily disabling RLS for development:");
    console.log("      ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;");
    console.log("      ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;");
    console.log("   3. Or update policies to be more permissive for anonymous users");
    
    console.log("\n✅ Access test complete!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testFlowUserAccess();
