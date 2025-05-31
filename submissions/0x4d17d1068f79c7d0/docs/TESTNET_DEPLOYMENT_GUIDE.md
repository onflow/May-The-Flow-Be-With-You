# Flow Testnet Deployment Guide

> **Deploy your contracts to Flow Testnet and activate VRF service**

## **Prerequisites**

### 1. **Install Flow CLI**
```bash
# macOS
brew install flow-cli

# Or download from: https://developers.flow.com/tools/flow-cli/install
```

### 2. **Create Flow Testnet Account**
1. Visit [Flow Testnet Faucet](https://testnet-faucet.onflow.org/)
2. Create a new account or connect existing wallet
3. Fund account with testnet FLOW tokens (free)
4. Export your private key

### 3. **Set Environment Variables**
```bash
# Add to your .env.local file
export FLOW_TESTNET_ADDRESS=0x1234567890abcdef  # Your testnet address
export FLOW_TESTNET_PRIVATE_KEY=your_private_key_here  # Your private key
```

## **Step 1: Deploy Contracts**

### **Option A: Using Deployment Script (Recommended)**
```bash
# From project root
./scripts/deploy/deploy-testnet.sh
```

### **Option B: Manual Deployment**
```bash
# Change to blockchain directory
cd blockchain

# Deploy to testnet
flow project deploy --network testnet --update
```

## **Step 2: Update Environment Configuration**

After successful deployment, update your `.env.local`:

```bash
# Flow Network Configuration
NEXT_PUBLIC_FLOW_NETWORK=testnet

# Contract Addresses (replace with actual deployed addresses)
NEXT_PUBLIC_MEMORY_VRF_CONTRACT=0x1234567890abcdef
NEXT_PUBLIC_MEMORY_ACHIEVEMENTS_CONTRACT=0x1234567890abcdef

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## **Step 3: Test Deployment**

### **Test Contract Deployment**
```bash
# Test VRF contract
flow scripts execute blockchain/scripts/test-vrf.cdc $FLOW_TESTNET_ADDRESS --network testnet

# Test with transaction
flow transactions send blockchain/transactions/TestVRF.cdc --network testnet --signer testnet-account
```

### **Test Frontend Integration**
```bash
# Start development server
bun run dev

# Navigate to any game page and try connecting Flow wallet
# On-chain mode should now be available
```

## **Step 4: Verify Everything Works**

### **✅ Checklist**
- [ ] Contracts deployed to testnet
- [ ] Environment variables updated
- [ ] Frontend connects to testnet
- [ ] Wallet connection works
- [ ] VRF generates real blockchain randomness
- [ ] Transaction links work in Flow explorer

### **🔍 Troubleshooting**

#### **"Insufficient FLOW balance"**
- Visit [testnet faucet](https://testnet-faucet.onflow.org/) to get more tokens
- Each VRF request costs ~0.001 FLOW

#### **"Contract not found"**
- Verify contract addresses in environment variables
- Check deployment was successful
- Ensure you're using the correct network

#### **"Wallet connection failed"**
- Make sure WalletConnect project ID is set
- Try different wallet (Flow Wallet, Blocto, etc.)
- Check browser console for errors

#### **"VRF request failed"**
- Ensure wallet is connected
- Check account has sufficient FLOW balance
- Verify contract is deployed correctly

## **Step 5: Production Considerations**

### **Security**
- Never commit private keys to version control
- Use environment variables for all sensitive data
- Consider using Flow CLI key management

### **Performance**
- VRF requests take 2-5 seconds on testnet
- Show loading states to users
- Cache results when possible

### **User Experience**
- Provide clear instructions for wallet setup
- Link to testnet faucet for new users
- Show transaction status and links

## **🎉 Success!**

Your Flow contracts are now live on testnet! Users can:

- ✅ Connect Flow wallets
- ✅ Play games with verifiable randomness
- ✅ Earn NFT achievements (when implemented)
- ✅ Participate in competitive modes
- ✅ View transactions on Flow explorer

## **Next Steps**

1. **Test with real users** - Share testnet link for feedback
2. **Implement NFT achievements** - Mint achievements as NFTs
3. **Add competitive features** - Tournaments, leaderboards
4. **Deploy to mainnet** - When ready for production

## **Useful Links**

- [Flow Testnet Explorer](https://testnet.flowscan.org/)
- [Flow Testnet Faucet](https://testnet-faucet.onflow.org/)
- [Flow Documentation](https://developers.flow.com/)
- [FCL Documentation](https://developers.flow.com/tools/clients/fcl-js)

Your blockchain gaming platform is now live! 🚀
