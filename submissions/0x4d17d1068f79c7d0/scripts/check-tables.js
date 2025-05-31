#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('🔍 Checking what tables exist in your database...\n');

  try {
    // Check if tables exist by trying to query them
    const tablesToCheck = [
      'user_profiles',
      'user_progress', 
      'game_sessions',
      'practice_sessions',
      'achievements',
      'leaderboards',
      'memory_palaces'
    ];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: exists (${data?.length || 0} sample records)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    console.log('\n🔍 Checking database schema...');
    
    // Try to get table info from information_schema
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT table_name, column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name IN ('user_progress', 'game_sessions', 'practice_sessions')
          ORDER BY table_name, ordinal_position;
        `
      });

    if (schemaError) {
      console.log('❌ Could not check schema:', schemaError.message);
    } else {
      console.log('📋 Database schema:');
      console.log(schemaData);
    }

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

checkTables();
