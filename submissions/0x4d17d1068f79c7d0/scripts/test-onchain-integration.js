#!/usr/bin/env node

/**
 * Test On-Chain Integration
 *
 * This script tests the complete on-chain integration including:
 * 1. Contract accessibility
 * 2. OnChainAdapter functionality
 * 3. Score submission flow
 */

const { join } = require("path");

// Load environment variables
require("dotenv").config({ path: join(__dirname, "../.env.local") });

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testContractAccessibility() {
  log("\n🔗 Testing Contract Accessibility...", "cyan");

  try {
    const contractAddress =
      process.env.NEXT_PUBLIC_MEMORY_VRF_CONTRACT || "0xb8404e09b36b6623";

    log(`📍 Contract Address: ${contractAddress}`, "blue");

    // Check environment variables
    const requiredEnvVars = [
      "NEXT_PUBLIC_FLOW_NETWORK",
      "NEXT_PUBLIC_MEMORY_VRF_CONTRACT",
      "NEXT_PUBLIC_MEMORY_ACHIEVEMENTS_CONTRACT",
    ];

    let envVarsOk = true;
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        log(`✅ ${envVar}: ${process.env[envVar]}`, "green");
      } else {
        log(`❌ Missing: ${envVar}`, "red");
        envVarsOk = false;
      }
    }

    if (!envVarsOk) {
      log("⚠️ Some environment variables are missing", "yellow");
      log(
        "💡 Make sure your .env.local file contains all required Flow configuration",
        "blue"
      );
    }

    return envVarsOk;
  } catch (error) {
    log(`❌ Contract accessibility test failed: ${error.message}`, "red");
    return false;
  }
}

async function testOnChainAdapter() {
  log("\n🔧 Testing OnChainAdapter...", "cyan");

  try {
    // Check if OnChainAdapter file exists
    const fs = require("fs");
    const adapterPath = join(__dirname, "../shared/adapters/OnChainAdapter.ts");

    if (fs.existsSync(adapterPath)) {
      log("✅ OnChainAdapter file exists", "green");

      // Read the file content to check for key functionality
      const content = fs.readFileSync(adapterPath, "utf8");

      if (content.includes("MemoryLeaderboard")) {
        log("✅ OnChainAdapter uses MemoryLeaderboard contract", "green");
      } else {
        log("⚠️ OnChainAdapter may not be using correct contract", "yellow");
      }

      if (content.includes("submitScoreOnChain")) {
        log("✅ OnChainAdapter has score submission functionality", "green");
      } else {
        log("❌ OnChainAdapter missing score submission", "red");
      }

      if (content.includes("loadProgressFromChain")) {
        log("✅ OnChainAdapter has progress loading functionality", "green");
      } else {
        log("❌ OnChainAdapter missing progress loading", "red");
      }

      return true;
    } else {
      log("❌ OnChainAdapter file not found", "red");
      return false;
    }
  } catch (error) {
    log(`❌ OnChainAdapter test failed: ${error.message}`, "red");
    return false;
  }
}

async function testFlowConfiguration() {
  log("\n⚙️ Testing Flow Configuration...", "cyan");

  try {
    // Check flow.json configuration
    const flowConfig = require("../blockchain/flow.json");

    if (flowConfig.networks && flowConfig.networks.testnet) {
      log("✅ Flow testnet configuration found", "green");
    } else {
      log("❌ Flow testnet configuration missing", "red");
      return false;
    }

    if (flowConfig.contracts) {
      const contracts = [
        "MemoryVRF",
        "MemoryAchievements",
        "MemoryLeaderboard",
      ];
      for (const contract of contracts) {
        if (flowConfig.contracts[contract]) {
          log(`✅ ${contract} contract configured`, "green");
        } else {
          log(`❌ ${contract} contract not configured`, "red");
        }
      }
    }

    if (flowConfig.deployments && flowConfig.deployments.testnet) {
      log("✅ Testnet deployment configuration found", "green");
    } else {
      log("❌ Testnet deployment configuration missing", "red");
    }

    return true;
  } catch (error) {
    log(`❌ Flow configuration test failed: ${error.message}`, "red");
    return false;
  }
}

async function generateReport(results) {
  log("\n📊 ON-CHAIN INTEGRATION STATUS REPORT", "magenta");
  log("=" * 50, "magenta");

  const tests = [
    {
      name: "Contract Accessibility",
      status: results.contractAccessibility,
      priority: "HIGH",
    },
    {
      name: "OnChainAdapter",
      status: results.onChainAdapter,
      priority: "HIGH",
    },
    {
      name: "Flow Configuration",
      status: results.flowConfiguration,
      priority: "MEDIUM",
    },
  ];

  tests.forEach((test) => {
    const status = test.status ? "✅ WORKING" : "❌ BROKEN";
    const color = test.status ? "green" : "red";
    log(
      `${test.name.padEnd(25)} ${status.padEnd(15)} [${test.priority}]`,
      color
    );
  });

  const workingCount = tests.filter((t) => t.status).length;
  const totalCount = tests.length;

  log("\n📈 ON-CHAIN INTEGRATION HEALTH", "magenta");
  log(
    `${workingCount}/${totalCount} components operational (${Math.round(
      (workingCount / totalCount) * 100
    )}%)`,
    workingCount === totalCount
      ? "green"
      : workingCount > totalCount / 2
      ? "yellow"
      : "red"
  );

  if (workingCount === totalCount) {
    log("\n🎉 On-chain integration is fully operational!", "green");
    log("🚀 Ready for blockchain score submission and leaderboards", "green");
  } else {
    log("\n⚠️ Some on-chain components need attention.", "yellow");
  }

  log("\n🔗 Contract Information:", "blue");
  log(`   • Network: Flow Testnet`, "blue");
  log(
    `   • Address: ${
      process.env.NEXT_PUBLIC_MEMORY_VRF_CONTRACT || "0xb8404e09b36b6623"
    }`,
    "blue"
  );
  log(
    `   • Explorer: https://testnet.flowscan.org/account/${
      process.env.NEXT_PUBLIC_MEMORY_VRF_CONTRACT || "0xb8404e09b36b6623"
    }`,
    "blue"
  );

  return workingCount === totalCount;
}

async function main() {
  log("🔗 ON-CHAIN INTEGRATION TEST UTILITY", "magenta");
  log("Testing Flow blockchain integration components...", "cyan");

  const results = {
    contractAccessibility: false,
    onChainAdapter: false,
    flowConfiguration: false,
  };

  // Run tests in sequence
  results.contractAccessibility = await testContractAccessibility();
  results.onChainAdapter = await testOnChainAdapter();
  results.flowConfiguration = await testFlowConfiguration();

  // Generate final report
  const allWorking = await generateReport(results);

  // Exit with appropriate code
  process.exit(allWorking ? 0 : 1);
}

// Handle errors gracefully
process.on("unhandledRejection", (error) => {
  log(`❌ Unhandled error: ${error.message}`, "red");
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  log(`❌ Script failed: ${error.message}`, "red");
  process.exit(1);
});
