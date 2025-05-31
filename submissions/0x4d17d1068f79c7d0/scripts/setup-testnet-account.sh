#!/bin/bash

# Setup Flow Testnet Account
# This script helps you create or verify a Flow testnet account for deployment

set -e

echo "🔧 Flow Testnet Account Setup"
echo "============================="

# Check if Flow CLI is installed
if ! command -v flow &> /dev/null; then
    echo "❌ Flow CLI not found. Please install it first:"
    echo "   brew install flow-cli"
    exit 1
fi

echo "✅ Flow CLI found: $(flow version)"

echo ""
echo "Choose an option:"
echo "1. Create a new testnet account"
echo "2. Verify existing account configuration"
echo "3. Get account info from address"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🆕 Creating new testnet account..."
        echo ""
        
        # Generate a new key pair
        echo "🔑 Generating new key pair..."
        KEY_PAIR=$(flow keys generate --sig-algo ECDSA_P256 --hash-algo SHA3_256)
        
        # Extract private and public keys
        PRIVATE_KEY=$(echo "$KEY_PAIR" | grep "Private Key" | awk '{print $3}')
        PUBLIC_KEY=$(echo "$KEY_PAIR" | grep "Public Key" | awk '{print $3}')
        
        echo "✅ Key pair generated:"
        echo "   Private Key: $PRIVATE_KEY"
        echo "   Public Key: $PUBLIC_KEY"
        echo ""
        
        # Create account on testnet
        echo "🌐 Creating account on testnet..."
        ACCOUNT_RESULT=$(flow accounts create --key $PUBLIC_KEY --sig-algo ECDSA_P256 --hash-algo SHA3_256 --network testnet)
        
        # Extract account address
        ACCOUNT_ADDRESS=$(echo "$ACCOUNT_RESULT" | grep "Address" | awk '{print $2}')
        
        echo "✅ Account created successfully!"
        echo "   Address: $ACCOUNT_ADDRESS"
        echo ""
        
        # Fund the account
        echo "💰 Please fund your account with testnet FLOW tokens:"
        echo "   1. Visit: https://testnet-faucet.onflow.org/"
        echo "   2. Enter address: $ACCOUNT_ADDRESS"
        echo "   3. Request testnet FLOW tokens"
        echo ""
        
        # Generate .env.local configuration
        echo "📝 Add these to your .env.local file:"
        echo ""
        echo "FLOW_TESTNET_ADDRESS=$ACCOUNT_ADDRESS"
        echo "FLOW_TESTNET_PRIVATE_KEY=$PRIVATE_KEY"
        echo ""
        
        # Ask if user wants to update .env.local automatically
        read -p "Would you like to update .env.local automatically? (y/n): " update_env
        
        if [[ $update_env == "y" || $update_env == "Y" ]]; then
            # Backup existing .env.local if it exists
            if [ -f ".env.local" ]; then
                cp .env.local .env.local.backup
                echo "✅ Backed up existing .env.local to .env.local.backup"
            fi
            
            # Update or create .env.local
            if grep -q "FLOW_TESTNET_ADDRESS" .env.local 2>/dev/null; then
                # Update existing entries
                sed -i.tmp "s/FLOW_TESTNET_ADDRESS=.*/FLOW_TESTNET_ADDRESS=$ACCOUNT_ADDRESS/" .env.local
                sed -i.tmp "s/FLOW_TESTNET_PRIVATE_KEY=.*/FLOW_TESTNET_PRIVATE_KEY=$PRIVATE_KEY/" .env.local
                rm .env.local.tmp
            else
                # Add new entries
                echo "" >> .env.local
                echo "# Flow Testnet Account" >> .env.local
                echo "FLOW_TESTNET_ADDRESS=$ACCOUNT_ADDRESS" >> .env.local
                echo "FLOW_TESTNET_PRIVATE_KEY=$PRIVATE_KEY" >> .env.local
            fi
            
            echo "✅ Updated .env.local with new account details"
        fi
        
        echo ""
        echo "🎯 Next steps:"
        echo "   1. Fund your account at: https://testnet-faucet.onflow.org/"
        echo "   2. Wait a few minutes for funding to complete"
        echo "   3. Run: ./scripts/test-account.sh"
        echo "   4. Run: bun run flow:deploy:testnet"
        ;;
        
    2)
        echo ""
        echo "🔍 Verifying existing account configuration..."
        
        # Load environment variables
        if [ -f ".env.local" ]; then
            export $(grep -v '^#' .env.local | xargs)
        else
            echo "❌ No .env.local file found"
            exit 1
        fi
        
        if [ -z "$FLOW_TESTNET_ADDRESS" ] || [ -z "$FLOW_TESTNET_PRIVATE_KEY" ]; then
            echo "❌ Missing FLOW_TESTNET_ADDRESS or FLOW_TESTNET_PRIVATE_KEY in .env.local"
            exit 1
        fi
        
        echo "   Address: $FLOW_TESTNET_ADDRESS"
        echo "   Private Key: ${FLOW_TESTNET_PRIVATE_KEY:0:8}..."
        echo ""
        
        # Get account info
        if flow accounts get $FLOW_TESTNET_ADDRESS --network testnet > /dev/null 2>&1; then
            ACCOUNT_INFO=$(flow accounts get $FLOW_TESTNET_ADDRESS --network testnet --format json)
            BALANCE=$(echo $ACCOUNT_INFO | jq -r '.balance')
            PUBLIC_KEY=$(echo $ACCOUNT_INFO | jq -r '.keys[0].publicKey')
            
            echo "✅ Account found on testnet"
            echo "   Balance: $BALANCE FLOW"
            echo "   Public Key: $PUBLIC_KEY"
            echo ""
            
            # Derive public key from private key to verify match
            DERIVED_KEY=$(flow keys derive $FLOW_TESTNET_PRIVATE_KEY --sig-algo ECDSA_P256 --hash-algo SHA3_256 | grep "Public Key" | awk '{print $3}')
            
            if [ "$PUBLIC_KEY" = "$DERIVED_KEY" ]; then
                echo "✅ Private key matches account public key"
                echo "✅ Account configuration is correct"
            else
                echo "❌ Private key does not match account public key"
                echo "   Account Public Key: $PUBLIC_KEY"
                echo "   Derived Public Key: $DERIVED_KEY"
                echo ""
                echo "💡 This means the private key in .env.local doesn't belong to this account"
                echo "   Please use option 1 to create a new account or get the correct private key"
            fi
        else
            echo "❌ Account not found on testnet"
            echo "   Please verify the address or create a new account"
        fi
        ;;
        
    3)
        echo ""
        read -p "Enter Flow testnet account address (0x...): " address
        
        if flow accounts get $address --network testnet > /dev/null 2>&1; then
            echo ""
            echo "✅ Account found on testnet"
            flow accounts get $address --network testnet
        else
            echo ""
            echo "❌ Account not found on testnet"
        fi
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1, 2, or 3."
        exit 1
        ;;
esac

echo ""
echo "🔗 Useful Links:"
echo "   • Flow Testnet Faucet: https://testnet-faucet.onflow.org/"
echo "   • Flow Testnet Explorer: https://testnet.flowscan.org/"
echo "   • Flow CLI Documentation: https://developers.flow.com/tools/flow-cli"
