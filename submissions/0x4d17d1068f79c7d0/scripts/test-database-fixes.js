#!/usr/bin/env node

/**
 * Test that the database fixes work correctly
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

async function testDatabaseFixes() {
  try {
    console.log("🧪 Testing database fixes...\n");

    const testUserId = "0xf8d6e0586b0a20c7"; // Flow wallet address from error logs
    const timestamp = Date.now();

    // Test 1: user_progress with correct column names
    console.log("📊 Testing user_progress with fixed column names:");
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: testUserId,
          game_type: 'test_fix',
          level: 1,
          experience_points: 100,
          total_sessions: 1,
          streak_best: 1,
          streak_current: 1,
          last_played_at: new Date().toISOString(),
          statistics: { test: true },
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.log("   ❌ user_progress error:", error.message);
      } else {
        console.log("   ✅ user_progress insert successful");
      }
    } catch (err) {
      console.log("   ❌ user_progress failed:", err.message);
    }

    // Test 2: game_sessions with session_id
    console.log("\n📊 Testing game_sessions with session_id:");
    try {
      const sessionId = `test_session_${timestamp}`;
      const { data, error } = await supabase
        .from('game_sessions')
        .insert({
          user_id: testUserId,
          game_type: 'test_fix',
          session_id: sessionId,
          score: 100,
          max_possible_score: 1000,
          accuracy: 85.5,
          items_count: 8,
          duration_seconds: 120,
          difficulty_level: 2,
          session_data: { test: true },
          created_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.log("   ❌ game_sessions error:", error.message);
      } else {
        console.log("   ✅ game_sessions insert successful");
      }
    } catch (err) {
      console.log("   ❌ game_sessions failed:", err.message);
    }

    // Test 3: achievements with correct schema
    console.log("\n📊 Testing achievements with fixed schema:");
    try {
      const { data, error } = await supabase
        .from('achievements')
        .insert({
          user_id: testUserId,
          achievement_type: 'test',
          achievement_name: 'Test Achievement',
          description: 'Test achievement for database fix',
          icon: '🧪',
          points: 10,
          metadata: { test: true },
          unlocked_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.log("   ❌ achievements error:", error.message);
      } else {
        console.log("   ✅ achievements insert successful");
      }
    } catch (err) {
      console.log("   ❌ achievements failed:", err.message);
    }

    // Cleanup test data
    console.log("\n🧹 Cleaning up test data...");
    await supabase.from('user_progress').delete().eq('user_id', testUserId).eq('game_type', 'test_fix');
    await supabase.from('game_sessions').delete().eq('user_id', testUserId).eq('game_type', 'test_fix');
    await supabase.from('achievements').delete().eq('user_id', testUserId).eq('achievement_type', 'test');

    console.log("\n✅ Database fixes test complete!");
    console.log("\n📋 Next steps:");
    console.log("   1. If you see errors above, run the RLS fix script in Supabase SQL Editor");
    console.log("   2. Copy contents of scripts/disable-rls-for-dev.sql");
    console.log("   3. Paste and run in https://todqarjzydxrfcjnwyid.supabase.co SQL Editor");
    console.log("   4. Test your application again");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testDatabaseFixes();
