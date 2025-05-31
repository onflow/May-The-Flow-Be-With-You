-- Update RLS policies to fix Flow wallet access issues
-- Run this in your Supabase SQL Editor to update the policies

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view own sessions" ON game_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON game_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON game_sessions;

-- Create updated user progress policies (allow both authenticated users and Flow wallet users)
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (
        user_id = auth.uid()::text OR 
        auth.uid() IS NULL OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR 
        auth.uid() IS NULL OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (
        user_id = auth.uid()::text OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

-- Create updated game sessions policies (allow both authenticated users and Flow wallet users)
CREATE POLICY "Users can view own sessions" ON game_sessions
    FOR SELECT USING (
        user_id = auth.uid()::text OR 
        auth.uid() IS NULL OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

CREATE POLICY "Users can insert own sessions" ON game_sessions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR 
        auth.uid() IS NULL OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

CREATE POLICY "Users can update own sessions" ON game_sessions
    FOR UPDATE USING (
        user_id = auth.uid()::text OR
        user_id LIKE '0x%' -- Allow Flow wallet addresses
    );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('user_progress', 'game_sessions')
ORDER BY tablename, policyname;
