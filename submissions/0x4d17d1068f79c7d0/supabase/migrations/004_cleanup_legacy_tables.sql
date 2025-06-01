-- CLEANUP LEGACY TABLES
-- Remove old tables that are no longer needed after unified schema migration
-- Run this in Supabase SQL Editor to clean up legacy tables

-- ============================================================================
-- STEP 1: DROP LEGACY TABLES (safe cleanup)
-- ============================================================================

-- Drop old tables that are no longer used in unified architecture
DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS leaderboard_entries CASCADE;

-- ============================================================================
-- STEP 2: VERIFICATION
-- ============================================================================

SELECT 'LEGACY CLEANUP COMPLETED!' as status;

-- Show remaining tables (should only be unified schema tables)
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'user_profiles', 
        'game_sessions', 
        'leaderboards', 
        'achievements', 
        'user_progress', 
        'memory_palaces',
        'practice_sessions',  -- Should be gone
        'leaderboard_entries' -- Should be gone
    )
ORDER BY tablename;

SELECT 'Note: Only unified schema tables should remain above.' as note;
