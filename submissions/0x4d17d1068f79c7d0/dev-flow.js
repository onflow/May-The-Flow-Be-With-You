#!/usr/bin/env node
/**
 * Flow Development Environment Launcher
 * Starts Flow emulator, dev wallet, and Next.js development server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Flow Development Environment...\n');

// Function to spawn a process with proper error handling
function spawnProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    cwd: __dirname,
    ...options
  });

  child.on('error', (error) => {
    console.error(`Failed to start ${command}:`, error);
  });

  return child;
}

// Start Flow emulator
console.log('📦 Starting Flow Emulator...');
const emulator = spawnProcess('flow', ['emulator', 'start'], {
  env: { ...process.env, FLOW_EMULATOR_PORT: '3569' }
});

// Wait a bit for emulator to start, then start dev wallet
setTimeout(() => {
  console.log('💳 Starting Flow Dev Wallet...');
  const devWallet = spawnProcess('flow', ['dev-wallet']);
  
  // Wait a bit more, then start Next.js
  setTimeout(() => {
    console.log('🌐 Starting Next.js Development Server...');
    const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
    const nextServer = spawnProcess('node', [nextBin, 'dev', '--turbopack'], {
      env: {
        ...process.env,
        NODE_PATH: path.join(__dirname, 'node_modules'),
        NEXT_PUBLIC_FLOW_NETWORK: 'emulator'
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development environment...');
      nextServer.kill();
      devWallet.kill();
      emulator.kill();
      process.exit(0);
    });

  }, 3000);
}, 5000);

console.log(`
🎯 Development Environment Starting...

Services will be available at:
- Flow Emulator: http://localhost:3569
- Flow Dev Wallet: http://localhost:8701
- Next.js App: http://localhost:3000
- Dev Wallet Harness: http://localhost:8701/harness

Press Ctrl+C to stop all services.
`);
