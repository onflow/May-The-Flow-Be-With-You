-- Fix RLS policies for practice_sessions and achievements to allow Flow wallet users
-- First, we need to drop all existing policies, then change column types, then recreate policies

-- Step 1: Drop ALL existing policies first (required before changing column types)
DROP POLICY IF EXISTS "Users can view own sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON practice_sessions;

DROP POLICY IF EXISTS "Users can view own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can view their own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON achievements;

-- Step 2: Drop foreign key constraints (if they exist)
ALTER TABLE practice_sessions DROP CONSTRAINT IF EXISTS practice_sessions_user_id_fkey;
ALTER TABLE achievements DROP CONSTRAINT IF EXISTS achievements_user_id_fkey;

-- Step 3: Change practice_sessions.user_id from UUID to TEXT
ALTER TABLE practice_sessions ALTER COLUMN user_id TYPE TEXT;

-- Step 4: Change achievements.user_id from UUID to TEXT
ALTER TABLE achievements ALTER COLUMN user_id TYPE TEXT;

-- Step 5: Create new policies for practice_sessions (allow Flow wallet users)
CREATE POLICY "Users can view own sessions" ON practice_sessions
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    auth.uid() IS NULL OR
    user_id LIKE '0x%' -- Allow Flow wallet addresses
  );

CREATE POLICY "Users can insert own sessions" ON practice_sessions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::text OR
    auth.uid() IS NULL OR
    user_id LIKE '0x%' -- Allow Flow wallet addresses
  );

-- Step 6: Create new policies for achievements (allow Flow wallet users)
CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    auth.uid() IS NULL OR
    user_id LIKE '0x%' -- Allow Flow wallet addresses
  );

CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::text OR
    auth.uid() IS NULL OR
    user_id LIKE '0x%' -- Allow Flow wallet addresses
  );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('practice_sessions', 'achievements')
ORDER BY tablename, policyname;
