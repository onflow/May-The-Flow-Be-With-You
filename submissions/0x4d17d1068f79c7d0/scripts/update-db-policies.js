#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updatePolicies() {
  console.log('🔄 Updating RLS policies for Flow wallet users...');

  try {
    // Drop existing policies
    console.log('Dropping existing policies...');
    
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;',
      'DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;',
      'DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;',
      'DROP POLICY IF EXISTS "Users can view own sessions" ON game_sessions;',
      'DROP POLICY IF EXISTS "Users can insert own sessions" ON game_sessions;',
      'DROP POLICY IF EXISTS "Users can update own sessions" ON game_sessions;'
    ];

    for (const sql of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error && !error.message.includes('does not exist')) {
        console.warn(`Warning dropping policy: ${error.message}`);
      }
    }

    // Create new policies
    console.log('Creating new policies...');
    
    const newPolicies = [
      `CREATE POLICY "Users can view own progress" ON user_progress
        FOR SELECT USING (
          user_id = auth.uid()::text OR 
          auth.uid() IS NULL OR
          user_id LIKE '0x%'
        );`,
      
      `CREATE POLICY "Users can insert own progress" ON user_progress
        FOR INSERT WITH CHECK (
          user_id = auth.uid()::text OR 
          auth.uid() IS NULL OR
          user_id LIKE '0x%'
        );`,
      
      `CREATE POLICY "Users can update own progress" ON user_progress
        FOR UPDATE USING (
          user_id = auth.uid()::text OR
          user_id LIKE '0x%'
        );`,
      
      `CREATE POLICY "Users can view own sessions" ON game_sessions
        FOR SELECT USING (
          user_id = auth.uid()::text OR 
          auth.uid() IS NULL OR
          user_id LIKE '0x%'
        );`,
      
      `CREATE POLICY "Users can insert own sessions" ON game_sessions
        FOR INSERT WITH CHECK (
          user_id = auth.uid()::text OR 
          auth.uid() IS NULL OR
          user_id LIKE '0x%'
        );`,
      
      `CREATE POLICY "Users can update own sessions" ON game_sessions
        FOR UPDATE USING (
          user_id = auth.uid()::text OR
          user_id LIKE '0x%'
        );`
    ];

    for (const sql of newPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.error(`Error creating policy: ${error.message}`);
        throw error;
      }
    }

    console.log('✅ Successfully updated RLS policies!');
    console.log('🎮 Flow wallet users can now access their data.');
    
  } catch (error) {
    console.error('❌ Failed to update policies:', error.message);
    process.exit(1);
  }
}

// Run the update
updatePolicies();
