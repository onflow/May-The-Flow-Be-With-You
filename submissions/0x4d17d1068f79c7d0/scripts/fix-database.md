# Fix Chaos Cards Database Issues

## Issues Found

1. **HTTP 406 Errors**: Column name mismatches between code and database schema
2. **HTTP 409 Errors**: Unique constraint conflicts in user_progress table
3. **RLS Policy Issues**: Flow wallet users (0x addresses) blocked by Row Level Security policies
4. **Missing game_type filters**: Some queries missing required filters

## Fixes Applied

### 1. Fixed Column Name Mismatches
- Updated adapters to use correct column names from database schema
- Changed `total_score` → `experience_points`
- Changed `games_played` → `total_sessions` 
- Changed `best_streak` → `streak_best`
- Added proper handling for missing `cultural_mastery` column

### 2. Fixed Database Queries
- Added `game_type = 'general'` filter to all user_progress queries
- Changed `.single()` to `.maybeSingle()` to handle missing records gracefully
- Added proper error handling for Flow wallet addresses

### 3. Updated RLS Policies
- Modified policies to allow Flow wallet addresses (0x prefixed)
- Updated both user_progress and game_sessions policies

## Steps to Fix Your Database

### Option 1: Run the Update Script (Recommended)
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the script in `supabase/update-policies.sql`

### Option 2: Manual Steps
1. Go to Supabase SQL Editor
2. Run these commands:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;

-- Create new policies that allow Flow wallet users
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (
        user_id = auth.uid()::text OR 
        auth.uid() IS NULL OR
        user_id LIKE '0x%'
    );

CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR 
        auth.uid() IS NULL OR
        user_id LIKE '0x%'
    );

CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (
        user_id = auth.uid()::text OR
        user_id LIKE '0x%'
    );
```

## Test the Fix

After updating the database policies:

1. Restart your development server
2. Try playing the Chaos Cards game
3. Check browser console for any remaining errors
4. Verify that progress is being saved properly

## Expected Results

- No more 406 errors when fetching user progress
- No more 409 errors when saving progress
- Flow wallet users can save and load their progress
- Game statistics work properly
