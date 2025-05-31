#!/usr/bin/env node

/**
 * Development utility to clear old game sessions with incorrect accuracy format
 * Run this to reset all game data during development
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
    "Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearDevData() {
  console.log("🧹 Clearing development data...");

  try {
    // Clear in order to respect foreign key constraints
    console.log("  📊 Clearing leaderboard entries...");
    const { error: leaderboardError } = await supabase
      .from("leaderboard_entries")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (leaderboardError) throw leaderboardError;

    console.log("  🏆 Clearing achievements...");
    const { error: achievementsError } = await supabase
      .from("achievements")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (achievementsError) throw achievementsError;

    console.log("  📈 Clearing user progress...");
    const { error: progressError } = await supabase
      .from("user_progress")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (progressError) throw progressError;

    console.log("  🎮 Clearing game sessions...");
    const { error: sessionsError } = await supabase
      .from("game_sessions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (sessionsError) throw sessionsError;

    console.log("  📝 Clearing practice sessions...");
    const { error: practiceError } = await supabase
      .from("practice_sessions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    // This might fail if table doesn't exist, which is fine
    if (practiceError && !practiceError.message.includes("does not exist")) {
      throw practiceError;
    }

    // Verify tables are empty
    console.log("\n✅ Verifying data cleared...");

    const tables = [
      "game_sessions",
      "achievements",
      "leaderboards",
      "user_progress",
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.warn(`⚠️  Could not verify ${table}: ${error.message}`);
      } else {
        console.log(`  ${table}: ${count || 0} records`);
      }
    }

    console.log("\n🎉 Development data cleared successfully!");
    console.log(
      "💡 Now play some games to generate fresh data with correct accuracy format."
    );
  } catch (error) {
    console.error("❌ Error clearing data:", error.message);
    process.exit(1);
  }
}

// Run the script
clearDevData();
