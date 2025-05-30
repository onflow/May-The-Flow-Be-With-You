#!/usr/bin/env bun
/**
 * Development server launcher with Bun
 * Uses Bun's fast runtime for Next.js development
 */

const { spawn } = require("child_process");
const path = require("path");

// Get the project root directory (two levels up from scripts/dev/)
const projectRoot = path.resolve(__dirname, "..", "..");

// Use local Next.js binary
const nextBin = path.join(
  projectRoot,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

// Start the development server with Bun
const child = spawn("bun", ["--bun", nextBin, "dev", "--turbopack"], {
  stdio: "inherit",
  cwd: projectRoot,
  env: {
    ...process.env,
    NODE_PATH: path.join(projectRoot, "node_modules"),
  },
});

child.on("error", (error) => {
  console.error("Failed to start development server:", error);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code);
});
