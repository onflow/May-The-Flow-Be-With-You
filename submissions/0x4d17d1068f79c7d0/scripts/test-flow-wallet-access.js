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

async function testFlowWalletAccess() {
  const testUserId = '0xf8d6e0586b0a20c7'; // Your Flow wallet address
  
  console.log('🧪 Testing Flow wallet access to database tables...\n');

  // Test 1: practice_sessions
  console.log('1. Testing practice_sessions table:');
  try {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', testUserId)
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Success: Can read practice_sessions (${data?.length || 0} records)`);
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  // Test 2: achievements
  console.log('2. Testing achievements table:');
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', testUserId)
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Success: Can read achievements (${data?.length || 0} records)`);
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  // Test 3: user_progress (should work)
  console.log('3. Testing user_progress table:');
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', testUserId)
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Success: Can read user_progress (${data?.length || 0} records)`);
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  // Test 4: game_sessions (should work)
  console.log('4. Testing game_sessions table:');
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', testUserId)
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Success: Can read game_sessions (${data?.length || 0} records)`);
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  console.log('\n📋 Next steps:');
  console.log('If practice_sessions or achievements show errors, run the fix-rls-policies.sql in your Supabase dashboard');
}

testFlowWalletAccess();
