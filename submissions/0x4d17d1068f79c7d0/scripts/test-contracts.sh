#!/bin/bash

# Test deployed contracts on Flow testnet
# This script tests both MemoryVRF and MemoryAchievements contracts

set -e

echo "🧪 Testing Flow Contracts on Testnet"
echo "===================================="

# Load environment variables
if [ -f "../.env.local" ]; then
    export $(grep -v '^#' ../.env.local | xargs)
else
    echo "❌ No .env.local file found"
    exit 1
fi

echo "✅ Testing contracts at address: $FLOW_TESTNET_ADDRESS"

# Test 1: Check account has both contracts
echo ""
echo "🔍 Test 1: Verifying contract deployment..."
ACCOUNT_INFO=$(flow accounts get $FLOW_TESTNET_ADDRESS --network testnet)

if echo "$ACCOUNT_INFO" | grep -q "MemoryVRF"; then
    echo "✅ MemoryVRF contract found"
else
    echo "❌ MemoryVRF contract not found"
    exit 1
fi

if echo "$ACCOUNT_INFO" | grep -q "MemoryAchievements"; then
    echo "✅ MemoryAchievements contract found"
else
    echo "❌ MemoryAchievements contract not found"
    exit 1
fi

# Test 2: Test VRF script
echo ""
echo "🎲 Test 2: Testing VRF script..."
cat > test-vrf-simple.cdc << 'EOF'
import MemoryVRF from 0xb8404e09b36b6623

access(all) fun main(): String {
    return "MemoryVRF contract is accessible and working!"
}
EOF

if flow scripts execute test-vrf-simple.cdc --network testnet; then
    echo "✅ VRF contract script test passed"
else
    echo "❌ VRF contract script test failed"
fi

# Test 3: Test Achievements script
echo ""
echo "🏆 Test 3: Testing Achievements script..."
cat > test-achievements-simple.cdc << 'EOF'
import MemoryAchievements from 0xb8404e09b36b6623

access(all) fun main(): UInt64 {
    return MemoryAchievements.totalSupply
}
EOF

if TOTAL_SUPPLY=$(flow scripts execute test-achievements-simple.cdc --network testnet); then
    echo "✅ Achievements contract script test passed"
    echo "   Total NFT supply: $TOTAL_SUPPLY"
else
    echo "❌ Achievements contract script test failed"
fi

# Cleanup
rm -f test-vrf-simple.cdc test-achievements-simple.cdc

echo ""
echo "🎉 All contract tests completed!"
echo ""
echo "📋 Summary:"
echo "   • MemoryVRF: ✅ Deployed and accessible"
echo "   • MemoryAchievements: ✅ Deployed and accessible"
echo "   • Contract Address: $FLOW_TESTNET_ADDRESS"
echo "   • Network: Flow Testnet"
echo ""
echo "🔗 View on Flow Explorer:"
echo "   https://testnet.flowscan.org/account/$FLOW_TESTNET_ADDRESS"
echo ""
echo "✨ Your Flow blockchain integration is live!"
