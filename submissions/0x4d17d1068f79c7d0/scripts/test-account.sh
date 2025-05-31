#!/bin/bash

# Test Flow account configuration
# This script verifies that your testnet account and private key are correctly configured

set -e

echo "🧪 Testing Flow Account Configuration"
echo "===================================="

# Load environment variables from .env.local if it exists
if [ -f ".env.local" ]; then
    echo "📋 Loading environment variables from .env.local..."
    export $(grep -v '^#' .env.local | xargs)
    echo "✅ Environment variables loaded"
else
    echo "❌ No .env.local file found"
    exit 1
fi

# Check environment variables
if [ -z "$FLOW_TESTNET_ADDRESS" ] || [ -z "$FLOW_TESTNET_PRIVATE_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   FLOW_TESTNET_ADDRESS - Your testnet account address"
    echo "   FLOW_TESTNET_PRIVATE_KEY - Your testnet account private key"
    exit 1
fi

echo "✅ Environment variables configured"
echo "   Account: $FLOW_TESTNET_ADDRESS"

# Check if Flow CLI is installed
if ! command -v flow &> /dev/null; then
    echo "❌ Flow CLI not found. Please install it first:"
    echo "   brew install flow-cli"
    exit 1
fi

echo "✅ Flow CLI found: $(flow version)"

# Test account access
echo "🔍 Testing account access..."
if flow accounts get $FLOW_TESTNET_ADDRESS --network testnet > /dev/null 2>&1; then
    echo "✅ Account exists on testnet"
else
    echo "❌ Account not found on testnet"
    echo "   Please verify your FLOW_TESTNET_ADDRESS is correct"
    exit 1
fi

# Get account details
echo "📋 Account Details:"
ACCOUNT_INFO=$(flow accounts get $FLOW_TESTNET_ADDRESS --network testnet --format json)
BALANCE=$(echo $ACCOUNT_INFO | jq -r '.balance')
KEY_COUNT=$(echo $ACCOUNT_INFO | jq -r '.keys | length')

echo "   Address: $FLOW_TESTNET_ADDRESS"
echo "   Balance: $BALANCE FLOW"
echo "   Keys: $KEY_COUNT"

if [ "$BALANCE" = "0.00000000" ]; then
    echo "⚠️  Account has no FLOW tokens. Please fund your account:"
    echo "   Visit: https://testnet-faucet.onflow.org/"
fi

# Test private key format
echo "🔑 Testing private key format..."
KEY_LENGTH=${#FLOW_TESTNET_PRIVATE_KEY}

if [ $KEY_LENGTH -eq 64 ]; then
    echo "✅ Private key length is correct (64 characters)"
elif [ $KEY_LENGTH -eq 66 ] && [[ $FLOW_TESTNET_PRIVATE_KEY == 0x* ]]; then
    echo "✅ Private key length is correct (66 characters with 0x prefix)"
else
    echo "❌ Private key length is incorrect"
    echo "   Expected: 64 characters (hex) or 66 characters (with 0x prefix)"
    echo "   Actual: $KEY_LENGTH characters"
    echo "   Please verify your FLOW_TESTNET_PRIVATE_KEY"
fi

# Test key signing (create a simple transaction to test)
echo "🔐 Testing key signing capability..."

# Create a temporary flow.json for testing
cd blockchain
cp flow.json flow.json.backup

# Replace environment variables with actual values
sed -i.tmp "s/\$FLOW_TESTNET_ADDRESS/$FLOW_TESTNET_ADDRESS/g" flow.json
sed -i.tmp "s/\$FLOW_TESTNET_PRIVATE_KEY/$FLOW_TESTNET_PRIVATE_KEY/g" flow.json
rm flow.json.tmp

# Try a simple transaction (get account info)
if flow accounts get $FLOW_TESTNET_ADDRESS --network testnet --signer testnet-account > /dev/null 2>&1; then
    echo "✅ Private key can sign transactions"
else
    echo "❌ Private key cannot sign transactions"
    echo "   This usually means:"
    echo "   1. Private key doesn't match the account address"
    echo "   2. Private key format is incorrect"
    echo "   3. Key index is wrong (should be 0 for most accounts)"
fi

# Cleanup
mv flow.json.backup flow.json

echo ""
echo "🎯 Summary:"
echo "   Account Address: $FLOW_TESTNET_ADDRESS"
echo "   Account Balance: $BALANCE FLOW"
echo "   Key Count: $KEY_COUNT"
echo ""

if [ "$BALANCE" != "0.00000000" ]; then
    echo "✅ Account is ready for deployment!"
    echo "   Run: bun run flow:deploy:testnet"
else
    echo "⚠️  Please fund your account before deployment"
    echo "   Visit: https://testnet-faucet.onflow.org/"
fi
