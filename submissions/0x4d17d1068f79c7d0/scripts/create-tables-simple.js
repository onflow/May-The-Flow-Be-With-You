#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('🔧 Creating missing tables step by step...\n');

  try {
    // Step 1: Create user_progress table using raw SQL
    console.log('Step 1: Creating user_progress table...');
    
    const createUserProgressSQL = `
      CREATE TABLE IF NOT EXISTS user_progress (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        game_type TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        experience_points INTEGER DEFAULT 0,
        total_sessions INTEGER DEFAULT 0,
        best_score INTEGER DEFAULT 0,
        average_accuracy DECIMAL(5,2) DEFAULT 0.0,
        total_time_played INTERVAL DEFAULT '0 seconds',
        streak_current INTEGER DEFAULT 0,
        streak_best INTEGER DEFAULT 0,
        last_played_at TIMESTAMP WITH TIME ZONE,
        statistics JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, game_type)
      );
    `;

    // Use the REST API directly to execute SQL
    const response1 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: createUserProgressSQL })
    });

    if (response1.ok) {
      console.log('✅ user_progress table created');
    } else {
      const error1 = await response1.text();
      console.log('❌ Error creating user_progress:', error1);
      
      // Try alternative approach - direct table creation
      console.log('🔄 Trying alternative approach...');
      
      // Let's try to create a simple record to test if table exists
      const { error: testError } = await supabase
        .from('user_progress')
        .select('*')
        .limit(1);
        
      if (testError && testError.message.includes('does not exist')) {
        console.log('❌ Table definitely does not exist. Need manual creation.');
        console.log('📋 Please run this SQL in your Supabase SQL Editor:');
        console.log('\n' + createUserProgressSQL + '\n');
      } else {
        console.log('✅ user_progress table seems to exist');
      }
    }

    // Step 2: Create game_sessions table
    console.log('Step 2: Creating game_sessions table...');
    
    const createGameSessionsSQL = `
      CREATE TABLE IF NOT EXISTS game_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        game_type TEXT NOT NULL,
        session_id TEXT UNIQUE NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        max_possible_score INTEGER NOT NULL DEFAULT 0,
        accuracy DECIMAL(5,2) NOT NULL DEFAULT 0.0,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        difficulty_level INTEGER NOT NULL DEFAULT 1,
        items_count INTEGER NOT NULL DEFAULT 0,
        perfect_game BOOLEAN DEFAULT FALSE,
        session_data JSONB DEFAULT '{}',
        flow_transaction_id TEXT,
        verification_status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `;

    const { error: testError2 } = await supabase
      .from('game_sessions')
      .select('*')
      .limit(1);
      
    if (testError2 && testError2.message.includes('does not exist')) {
      console.log('❌ game_sessions table does not exist. Need manual creation.');
      console.log('📋 Please run this SQL in your Supabase SQL Editor:');
      console.log('\n' + createGameSessionsSQL + '\n');
    } else {
      console.log('✅ game_sessions table seems to exist');
    }

    console.log('\n📋 MANUAL STEPS NEEDED:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/todqarjzydxrfcjnwyid');
    console.log('2. Click on "SQL Editor" in the left sidebar');
    console.log('3. Copy and paste the SQL from scripts/create-missing-tables.sql');
    console.log('4. Click "Run" to execute the SQL');
    console.log('5. Come back and test your Chaos Cards game');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createTables();
