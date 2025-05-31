#!/usr/bin/env node

// Blockchain Test Suite Runner
// Run with: node blockchain/tests/run-all-tests.js

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running Blockchain Test Suite...\n');

const tests = [
  {
    name: 'VRF Integration Test',
    command: 'node',
    args: ['blockchain/tests/vrf-integration.test.js'],
    description: 'Tests VRF configuration and integration'
  },
  {
    name: 'Network Detection Test', 
    command: 'node',
    args: ['blockchain/tests/network-detection.test.js'],
    description: 'Tests network mismatch detection logic'
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n🔄 Running: ${test.name}`);
    console.log(`📝 ${test.description}`);
    console.log(`💻 Command: ${test.command} ${test.args.join(' ')}\n`);

    const child = spawn(test.command, test.args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      const status = code === 0 ? '✅ PASSED' : '❌ FAILED';
      console.log(`\n${status}: ${test.name} (exit code: ${code})`);
      resolve({ name: test.name, passed: code === 0, code });
    });

    child.on('error', (error) => {
      console.error(`❌ ERROR running ${test.name}:`, error.message);
      resolve({ name: test.name, passed: false, error: error.message });
    });
  });
}

async function runAllTests() {
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUITE SUMMARY');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status} - ${result.name}`);
    
    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
  });

  console.log('\n📈 RESULTS:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Blockchain integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the output above for details.');
  }

  console.log('\n💡 Tips:');
  console.log('• Run individual tests: node blockchain/tests/[test-name].test.js');
  console.log('• Check environment variables in .env.local');
  console.log('• Verify Flow wallet network matches app configuration');
  console.log('• For Cadence tests, run: flow test');

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Handle process interruption
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Test suite interrupted by user');
  process.exit(1);
});

// Run the test suite
runAllTests().catch((error) => {
  console.error('💥 Test suite failed with error:', error);
  process.exit(1);
});
