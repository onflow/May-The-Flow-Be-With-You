-- Clear old game sessions with incorrect accuracy format
-- This removes sessions where accuracy was stored as decimal (0-1) instead of percentage (0-100)
-- Safe to run during development phase

-- Clear game sessions
DELETE FROM game_sessions;

-- Clear achievements (they'll be re-earned with new games)
DELETE FROM achievements;

-- Clear leaderboards (they'll be rebuilt)
DELETE FROM leaderboards;

-- Clear user progress (will be recalculated)
DELETE FROM user_progress;

-- Optional: Clear practice sessions if they exist
DELETE FROM practice_sessions;

-- Reset sequences if needed (PostgreSQL)
-- ALTER SEQUENCE game_sessions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE achievements_id_seq RESTART WITH 1;
-- ALTER SEQUENCE leaderboards_id_seq RESTART WITH 1;

-- Verify tables are empty
SELECT 'game_sessions' as table_name, COUNT(*) as count FROM game_sessions
UNION ALL
SELECT 'achievements' as table_name, COUNT(*) as count FROM achievements
UNION ALL
SELECT 'leaderboards' as table_name, COUNT(*) as count FROM leaderboards
UNION ALL
SELECT 'user_progress' as table_name, COUNT(*) as count FROM user_progress;
