#!/usr/bin/env node
/**
 * Development server launcher
 * Bypasses global Next.js installations and uses local version
 */

const { spawn } = require('child_process');
const path = require('path');

// Use local Next.js binary
const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');

// Start the development server
const child = spawn('node', [nextBin, 'dev', '--turbopack'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_PATH: path.join(__dirname, 'node_modules')
  }
});

child.on('error', (error) => {
  console.error('Failed to start development server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});
