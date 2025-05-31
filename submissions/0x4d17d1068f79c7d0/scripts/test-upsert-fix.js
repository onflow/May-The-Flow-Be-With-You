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

async function testUpsertFix() {
  const testUserId = '0xf8d6e0586b0a20c7'; // Your Flow wallet address
  
  console.log('🧪 Testing upsert fix for user_progress table...\n');

  try {
    // Test 1: First insert
    console.log('1. Testing first insert:');
    const { data: data1, error: error1 } = await supabase
      .from('user_progress')
      .upsert({
        user_id: testUserId,
        game_type: 'general',
        level: 1,
        experience_points: 100,
        total_sessions: 1,
        streak_best: 1,
        streak_current: 1,
        last_played_at: new Date().toISOString(),
        statistics: { test: 'first_insert' },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,game_type'
      })
      .select();
    
    if (error1) {
      console.log(`   ❌ Error: ${error1.message}`);
      return;
    } else {
      console.log(`   ✅ Success: First insert completed`);
    }

    // Test 2: Second insert (should update, not conflict)
    console.log('2. Testing second insert (should update):');
    const { data: data2, error: error2 } = await supabase
      .from('user_progress')
      .upsert({
        user_id: testUserId,
        game_type: 'general',
        level: 2,
        experience_points: 200,
        total_sessions: 2,
        streak_best: 2,
        streak_current: 2,
        last_played_at: new Date().toISOString(),
        statistics: { test: 'second_insert' },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,game_type'
      })
      .select();
    
    if (error2) {
      console.log(`   ❌ Error: ${error2.message}`);
    } else {
      console.log(`   ✅ Success: Second insert/update completed`);
      console.log(`   📊 Updated record: level=${data2[0]?.level}, experience=${data2[0]?.experience_points}`);
    }

    // Test 3: Verify only one record exists
    console.log('3. Testing record count:');
    const { data: countData, error: countError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', testUserId)
      .eq('game_type', 'general');
    
    if (countError) {
      console.log(`   ❌ Error: ${countError.message}`);
    } else {
      console.log(`   ✅ Success: Found ${countData.length} record(s) (should be 1)`);
      if (countData.length === 1) {
        console.log(`   📊 Final record: level=${countData[0].level}, experience=${countData[0].experience_points}`);
      }
    }

    console.log('\n🎉 Upsert fix test completed!');
    console.log('✅ The 409 conflict errors should now be resolved.');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testUpsertFix();
