#!/bin/bash

# Deploy Flow Contracts for Memoreee
# This script starts the emulator and deploys the VRF and Achievements contracts

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BLOCKCHAIN_DIR="$PROJECT_ROOT/blockchain"

echo "🚀 Starting Flow Blockchain Integration Deployment"
echo "=================================================="
echo "📁 Project Root: $PROJECT_ROOT"
echo "📁 Blockchain Dir: $BLOCKCHAIN_DIR"

# Change to blockchain directory where flow.json is located
cd "$BLOCKCHAIN_DIR" || {
    echo "❌ Failed to change to blockchain directory: $BLOCKCHAIN_DIR"
    exit 1
}

# Check if Flow CLI is installed
if ! command -v flow &> /dev/null; then
    echo "❌ Flow CLI not found. Please install it first:"
    echo "   brew install flow-cli"
    exit 1
fi

echo "✅ Flow CLI found"

# Start the emulator in the background
echo "🔄 Starting Flow emulator..."
flow emulator start --verbose &
EMULATOR_PID=$!

# Wait for emulator to start
echo "⏳ Waiting for emulator to initialize..."
sleep 5

# Check if emulator is running
if ! curl -s http://localhost:8080/v1/blocks/latest > /dev/null; then
    echo "❌ Emulator failed to start"
    kill $EMULATOR_PID 2>/dev/null
    exit 1
fi

echo "✅ Emulator running on http://localhost:8080"

# Deploy contracts
echo "📦 Deploying contracts..."

# Deploy MemoryVRF contract first (no dependencies)
echo "  📝 Deploying MemoryVRF..."
if flow project deploy --network emulator --update; then
    echo "  ✅ MemoryVRF deployed successfully"
else
    echo "  ❌ Failed to deploy MemoryVRF"
    kill $EMULATOR_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Flow Blockchain Integration Complete!"
echo "========================================"
echo ""
echo "📋 Deployment Summary:"
echo "  • Network: Flow Emulator (localhost:3569)"
echo "  • Account: f8d6e0586b0a20c7"
echo "  • MemoryVRF: ✅ Deployed"
echo "  • MemoryAchievements: ✅ Deployed"
echo ""
echo "🔗 Next Steps:"
echo "  1. Update frontend to use deployed contracts"
echo "  2. Test VRF functionality in games"
echo "  3. Test NFT minting for achievements"
echo ""
echo "🌐 Emulator URLs:"
echo "  • Flow Emulator: http://localhost:8080"
echo "  • Flow Dev Wallet: http://localhost:8701"
echo ""
echo "⚠️  Keep this terminal open to maintain the emulator"
echo "    Press Ctrl+C to stop the emulator"

# Keep the script running to maintain emulator
wait $EMULATOR_PID
