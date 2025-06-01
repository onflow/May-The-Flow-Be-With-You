# Week 1: Randomness Revolution - Source Code

## 🔗 **Implementation Location**
All source code for Week 1 features is integrated throughout the main application.

## 📁 **Key Files**

### **Flow VRF Integration**
- `blockchain/contracts/MemoryVRF.cdc` - Flow smart contract for VRF
- `shared/services/FlowVRFService.ts` - VRF service implementation
- `app/api/vrf-pool/route.ts` - VRF pool API endpoint

### **Randomness Systems**
- `shared/services/GameService.ts` - Game randomization logic
- `shared/adapters/OffChainAdapter.ts` - Random seed generation
- `shared/utils/randomization.ts` - Utility functions for randomness

### **Chaos Cards Game**
- `shared/components/games/ChaosCards.tsx` - Main game component
- `shared/components/games/ChaosCardsGame.tsx` - Game logic
- `shared/data/cultural-content.ts` - Cultural card content

### **Memory Palace Randomization**
- `shared/components/games/MemoryPalace.tsx` - Palace game component
- `shared/components/games/MemoryPalaceGame.tsx` - Randomized layouts
- `shared/data/memory-palace-content.ts` - Cultural palace content

## 🎮 **Live Demo**
- **URL**: https://memoreee.netlify.app/randomness-revolution
- **Games**: All games use VRF-powered randomization
- **Contract**: `0xb8404e09b36b6623` on Flow testnet

## 🔧 **How to Run**
```bash
cd submissions/0x4d17d1068f79c7d0
bun install
bun run dev
# Navigate to /randomness-revolution
```

## 📊 **Technical Features**
- Flow VRF smart contract integration
- Hybrid randomness (local + blockchain)
- Seeded randomization for reproducibility
- Cultural content randomization
- Anti-cheat verification system
