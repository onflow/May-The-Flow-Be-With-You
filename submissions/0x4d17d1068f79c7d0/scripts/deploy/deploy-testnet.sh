#!/bin/bash

# Deploy Flow Contracts to Testnet
# This script deploys MemoryVRF and MemoryAchievements contracts to Flow testnet

set -e

echo "🚀 Deploying Flow Contracts to Testnet"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "blockchain/flow.json" ]; then
    echo "❌ Error: Must run from project root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected: blockchain/flow.json should exist"
    exit 1
fi

# Load environment variables from .env.local if it exists
if [ -f ".env.local" ]; then
    echo "📋 Loading environment variables from .env.local..."
    export $(grep -v '^#' .env.local | xargs)
    echo "✅ Environment variables loaded"
else
    echo "⚠️  No .env.local file found"
fi

# Check if Flow CLI is installed
if ! command -v flow &> /dev/null; then
    echo "❌ Flow CLI not found. Please install it first:"
    echo "   brew install flow-cli"
    echo "   or visit: https://developers.flow.com/tools/flow-cli/install"
    exit 1
fi

echo "✅ Flow CLI found: $(flow version)"

# Check environment variables
if [ -z "$FLOW_TESTNET_ADDRESS" ] || [ -z "$FLOW_TESTNET_PRIVATE_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   FLOW_TESTNET_ADDRESS - Your testnet account address"
    echo "   FLOW_TESTNET_PRIVATE_KEY - Your testnet account private key"
    echo ""
    echo "💡 To get testnet account:"
    echo "   1. Visit: https://testnet-faucet.onflow.org/"
    echo "   2. Create account and fund with testnet FLOW"
    echo "   3. Export private key and set environment variables"
    echo ""
    echo "   Example:"
    echo "   export FLOW_TESTNET_ADDRESS=0x1234567890abcdef"
    echo "   export FLOW_TESTNET_PRIVATE_KEY=your_private_key_here"
    exit 1
fi

echo "✅ Environment variables configured"
echo "   Account: $FLOW_TESTNET_ADDRESS"

# Change to blockchain directory
cd blockchain

# Verify contracts exist
if [ ! -f "contracts/MemoryVRF.cdc" ]; then
    echo "❌ MemoryVRF.cdc not found in contracts/"
    exit 1
fi

if [ ! -f "contracts/MemoryAchievements.cdc" ]; then
    echo "❌ MemoryAchievements.cdc not found in contracts/"
    exit 1
fi

echo "✅ Contract files found"

# Create a temporary flow.json with actual environment variable values
echo "🔧 Creating temporary flow.json with testnet configuration..."
cp flow.json flow.json.backup

# Replace environment variables with actual values in flow.json
sed -i.tmp "s/\$FLOW_TESTNET_ADDRESS/$FLOW_TESTNET_ADDRESS/g" flow.json
sed -i.tmp "s/\$FLOW_TESTNET_PRIVATE_KEY/$FLOW_TESTNET_PRIVATE_KEY/g" flow.json
rm flow.json.tmp

echo "✅ Temporary flow.json created"

# Check account balance
echo "🔍 Checking testnet account balance..."
BALANCE=$(flow accounts get $FLOW_TESTNET_ADDRESS --network testnet --format json | jq -r '.balance')

if [ "$BALANCE" = "0.00000000" ]; then
    echo "❌ Account has no FLOW tokens. Please fund your account:"
    echo "   Visit: https://testnet-faucet.onflow.org/"
    echo "   Address: $FLOW_TESTNET_ADDRESS"
    exit 1
fi

echo "✅ Account balance: $BALANCE FLOW"

# Function to cleanup on exit
cleanup() {
    if [ -f "flow.json.backup" ]; then
        echo "🧹 Cleaning up temporary files..."
        mv flow.json.backup flow.json
        echo "✅ Original flow.json restored"
    fi
}

# Set trap to cleanup on exit (success or failure)
trap cleanup EXIT

# Deploy contracts
echo "📦 Deploying contracts to testnet..."

# Deploy MemoryVRF first (no dependencies)
echo "  📝 Deploying MemoryVRF..."
if flow project deploy --network testnet --update; then
    echo "  ✅ Contracts deployed successfully"
else
    echo "  ❌ Failed to deploy contracts"
    echo "  💡 Common issues:"
    echo "     - Insufficient FLOW balance for gas"
    echo "     - Contract already exists (use --update flag)"
    echo "     - Network connectivity issues"
    exit 1
fi

# Get deployed contract addresses
echo "🔍 Getting deployed contract addresses..."
MEMORY_VRF_ADDRESS=$(flow accounts get $FLOW_TESTNET_ADDRESS --network testnet --format json | jq -r '.contracts.MemoryVRF.address // empty')
MEMORY_ACHIEVEMENTS_ADDRESS=$(flow accounts get $FLOW_TESTNET_ADDRESS --network testnet --format json | jq -r '.contracts.MemoryAchievements.address // empty')

if [ -z "$MEMORY_VRF_ADDRESS" ]; then
    MEMORY_VRF_ADDRESS=$FLOW_TESTNET_ADDRESS
fi

if [ -z "$MEMORY_ACHIEVEMENTS_ADDRESS" ]; then
    MEMORY_ACHIEVEMENTS_ADDRESS=$FLOW_TESTNET_ADDRESS
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "📋 Contract Addresses:"
echo "  • MemoryVRF: $MEMORY_VRF_ADDRESS"
echo "  • MemoryAchievements: $MEMORY_ACHIEVEMENTS_ADDRESS"
echo "  • Network: Flow Testnet"
echo ""
echo "🔗 Next Steps:"
echo "  1. Update your .env.local file:"
echo "     NEXT_PUBLIC_FLOW_NETWORK=testnet"
echo "     NEXT_PUBLIC_MEMORY_VRF_CONTRACT=$MEMORY_VRF_ADDRESS"
echo "     NEXT_PUBLIC_MEMORY_ACHIEVEMENTS_CONTRACT=$MEMORY_ACHIEVEMENTS_ADDRESS"
echo ""
echo "  2. Test the deployment:"
echo "     flow scripts execute scripts/test-vrf.cdc --network testnet"
echo ""
echo "  3. Update your frontend configuration"
echo ""
echo "🌐 Useful Links:"
echo "  • Flow Testnet Explorer: https://testnet.flowscan.org/"
echo "  • Your Account: https://testnet.flowscan.org/account/$FLOW_TESTNET_ADDRESS"
echo "  • Testnet Faucet: https://testnet-faucet.onflow.org/"
echo ""
echo "✨ Your contracts are now live on Flow Testnet!"
