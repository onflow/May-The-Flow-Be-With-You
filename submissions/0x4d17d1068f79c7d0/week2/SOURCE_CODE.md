# Week 2: Actually Fun Games - Source Code

## 🔗 **Implementation Location**
All source code for Week 2 features is integrated throughout the main application.

## 📁 **Key Files**

### **Game Components**
- `shared/components/games/ChaosCards.tsx` - Chaos Cards game
- `shared/components/games/MemoryPalace.tsx` - Memory Palace game
- `shared/components/games/SpeedChallenge.tsx` - Speed Challenge game
- `app/games/page.tsx` - Main games page

### **Competition Systems**
- `shared/services/leaderboardService.ts` - Leaderboard management
- `shared/components/Leaderboard.tsx` - Leaderboard display
- `shared/components/UserStats.tsx` - User statistics
- `shared/services/progressService.ts` - Progress tracking

### **Game Logic**
- `shared/services/GameService.ts` - Core game mechanics
- `shared/providers/GameProvider.tsx` - Game state management
- `shared/adapters/OffChainAdapter.ts` - Score submission
- `shared/adapters/OnChainAdapter.ts` - Blockchain integration

### **Achievement System**
- `shared/components/Achievements.tsx` - Achievement display
- `shared/services/progressService.ts` - Achievement logic
- `shared/data/achievements.ts` - Achievement definitions

## 🎮 **Live Demo**
- **URL**: https://memoreee.netlify.app/games
- **Games**: Chaos Cards, Memory Palace, Speed Challenge
- **Leaderboards**: Real-time competition
- **Achievements**: NFT-backed accomplishments

## 🔧 **How to Run**
```bash
cd submissions/0x4d17d1068f79c7d0
bun install
bun run dev
# Navigate to /games
```

## 📊 **Technical Features**
- Three distinct game types
- Real-time leaderboards
- Achievement system with NFTs
- Progressive difficulty scaling
- Multi-tier user authentication
- Cross-platform compatibility
