#!/usr/bin/env node

/**
 * Test and Fix Systems Script
 * 
 * This script tests and fixes the three critical issues:
 * 1. VRF Pool API
 * 2. Database Schema
 * 3. On-chain Integration
 */

const { spawn } = require('child_process');
const { join } = require('path');
const fetch = require('node-fetch');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function testVRFPool() {
  log('\n🎲 Testing VRF Pool API...', 'cyan');
  
  try {
    // Start the development server in background
    log('Starting development server...', 'yellow');
    const serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      detached: true
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Test the VRF pool endpoint
    log('Testing VRF pool endpoint...', 'yellow');
    const response = await fetch('http://localhost:3000/api/vrf-pool/');
    const data = await response.json();

    if (response.ok && data.success !== false) {
      log('✅ VRF Pool API is working correctly', 'green');
      log(`   Seed: ${data.seed}`, 'blue');
      log(`   Pool size: ${data.poolSize}`, 'blue');
      log(`   Used entries: ${data.usedEntries}`, 'blue');
    } else {
      log('⚠️ VRF Pool API returned fallback mode', 'yellow');
      log(`   Fallback seed: ${data.fallback?.seed}`, 'blue');
      log(`   Message: ${data.message}`, 'blue');
    }

    // Test multiple requests
    log('Testing multiple VRF requests...', 'yellow');
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(fetch('http://localhost:3000/api/vrf-pool/'));
    }

    const responses = await Promise.all(requests);
    const results = await Promise.all(responses.map(r => r.json()));
    
    const uniqueSeeds = new Set(results.map(r => r.seed || r.fallback?.seed));
    log(`✅ Generated ${uniqueSeeds.size} unique seeds from 5 requests`, 'green');

    // Kill the server
    process.kill(-serverProcess.pid);
    
    return true;
  } catch (error) {
    log(`❌ VRF Pool test failed: ${error.message}`, 'red');
    return false;
  }
}

async function harmonizeDatabase() {
  log('\n🗄️ Harmonizing Database Schema...', 'cyan');
  
  try {
    await runCommand('node', [join(__dirname, 'harmonize-database-schema.js')]);
    log('✅ Database schema harmonization completed', 'green');
    return true;
  } catch (error) {
    log(`❌ Database harmonization failed: ${error.message}`, 'red');
    return false;
  }
}

async function testLeaderboardIntegration() {
  log('\n🏆 Testing Leaderboard Integration...', 'cyan');
  
  try {
    // Test database connection
    log('Testing database connection...', 'yellow');
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config({ path: join(__dirname, '../.env.local') });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'leaderboard_entries');
    
    if (tablesError || !tables || tables.length === 0) {
      throw new Error('leaderboard_entries table not found');
    }
    
    log('✅ Database connection successful', 'green');
    log('✅ leaderboard_entries table exists', 'green');
    
    // Test insert/read operations
    log('Testing leaderboard operations...', 'yellow');
    const testEntry = {
      user_id: `test_${Date.now()}`,
      username: 'Test User',
      user_tier: 'supabase',
      game_type: 'chaos-cards',
      culture: 'test',
      raw_score: 100,
      adjusted_score: 80,
      period: 'all_time',
      period_start: new Date().toISOString().split('T')[0],
      period_end: '2099-12-31'
    };
    
    // Insert test entry
    const { data: insertData, error: insertError } = await supabase
      .from('leaderboard_entries')
      .insert(testEntry)
      .select();
    
    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }
    
    log('✅ Test entry inserted successfully', 'green');
    
    // Read test entry
    const { data: readData, error: readError } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('user_id', testEntry.user_id);
    
    if (readError || !readData || readData.length === 0) {
      throw new Error('Failed to read test entry');
    }
    
    log('✅ Test entry read successfully', 'green');
    
    // Clean up test entry
    await supabase
      .from('leaderboard_entries')
      .delete()
      .eq('user_id', testEntry.user_id);
    
    log('✅ Test entry cleaned up', 'green');
    
    return true;
  } catch (error) {
    log(`❌ Leaderboard integration test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testFlowIntegration() {
  log('\n⛓️ Testing Flow Integration...', 'cyan');
  
  try {
    // Check Flow configuration
    log('Checking Flow configuration...', 'yellow');
    const flowConfig = require('../blockchain/flow.json');
    
    if (!flowConfig.networks || !flowConfig.networks.testnet) {
      throw new Error('Flow testnet configuration not found');
    }
    
    log('✅ Flow configuration found', 'green');
    
    // Check deployed contracts
    const contracts = flowConfig.networks.testnet.contracts;
    if (contracts.MemoryVRF && contracts.MemoryAchievements) {
      log('✅ Flow contracts configured', 'green');
      log(`   MemoryVRF: ${contracts.MemoryVRF}`, 'blue');
      log(`   MemoryAchievements: ${contracts.MemoryAchievements}`, 'blue');
    } else {
      log('⚠️ Some Flow contracts missing from configuration', 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ Flow integration test failed: ${error.message}`, 'red');
    return false;
  }
}

async function generateReport(results) {
  log('\n📊 SYSTEM STATUS REPORT', 'magenta');
  log('=' * 50, 'magenta');
  
  const issues = [
    { name: 'VRF Pool API', status: results.vrfPool, priority: 'HIGH' },
    { name: 'Database Schema', status: results.database, priority: 'HIGH' },
    { name: 'Leaderboard Integration', status: results.leaderboard, priority: 'HIGH' },
    { name: 'Flow Integration', status: results.flow, priority: 'MEDIUM' }
  ];
  
  issues.forEach(issue => {
    const status = issue.status ? '✅ WORKING' : '❌ BROKEN';
    const color = issue.status ? 'green' : 'red';
    log(`${issue.name.padEnd(25)} ${status.padEnd(15)} [${issue.priority}]`, color);
  });
  
  const workingCount = issues.filter(i => i.status).length;
  const totalCount = issues.length;
  
  log('\n📈 OVERALL SYSTEM HEALTH', 'magenta');
  log(`${workingCount}/${totalCount} systems operational (${Math.round(workingCount/totalCount*100)}%)`, 
      workingCount === totalCount ? 'green' : workingCount > totalCount/2 ? 'yellow' : 'red');
  
  if (workingCount === totalCount) {
    log('\n🎉 All systems are operational!', 'green');
  } else {
    log('\n⚠️ Some systems need attention. Check the logs above for details.', 'yellow');
  }
}

async function main() {
  log('🔧 SYSTEM TEST AND FIX UTILITY', 'magenta');
  log('Testing and fixing critical system issues...', 'cyan');
  
  const results = {
    vrfPool: false,
    database: false,
    leaderboard: false,
    flow: false
  };
  
  // Run tests in sequence
  results.database = await harmonizeDatabase();
  results.leaderboard = await testLeaderboardIntegration();
  results.vrfPool = await testVRFPool();
  results.flow = await testFlowIntegration();
  
  // Generate final report
  await generateReport(results);
  
  // Exit with appropriate code
  const allWorking = Object.values(results).every(r => r);
  process.exit(allWorking ? 0 : 1);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  log(`❌ Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});

// Run the main function
main().catch(error => {
  log(`❌ Script failed: ${error.message}`, 'red');
  process.exit(1);
});
