# Unified Leaderboard Architecture Plan

## 🎯 **Goal: DRY, Clean, Single Source of Truth**

Since you're the only user and we're in development, this is the perfect time to eliminate all redundancy and create a clean, unified system.

## 🗑️ **What to Remove (Legacy Cleanup):**

### **1. Remove progressService.updateLeaderboards()**
- **File**: `progressService.ts` lines 420-507
- **Reason**: Redundant with LeaderboardService, creates duplicate logic
- **Impact**: Eliminates 80+ lines of duplicate ranking code

### **2. Remove Dual Table Support**
- **Tables**: Only use existing `leaderboards` table, remove all `leaderboard_entries` references
- **Files**: All fallback logic in progressService.ts, LeaderboardService.ts
- **Reason**: `leaderboard_entries` table doesn't exist, creates unnecessary complexity

### **3. Remove OffChainAdapter Leaderboard Logic**
- **File**: `OffChainAdapter.ts` lines 280-315 (local cache management)
- **Reason**: LeaderboardService handles this better
- **Impact**: Eliminates localStorage leaderboard caching

### **4. Consolidate Score Submission**
- **Remove**: progressService.updateLeaderboards() calls from OffChainAdapter
- **Keep**: Single path through LeaderboardService

## ✨ **Unified Architecture:**

### **Single Data Flow:**
```
Game End → useGameCore → GameService → LeaderboardService → Supabase
```

### **Single Source of Truth:**
- **Game Sessions**: `game_sessions` table (primary data)
- **Leaderboards**: `leaderboards` table (computed rankings)
- **Service**: `LeaderboardService` (single ranking logic)

### **Simplified Tables:**
```sql
-- PRIMARY: Game sessions (raw data)
game_sessions: user_id, game_type, score, accuracy, difficulty, session_data

-- COMPUTED: Leaderboards (rankings)
leaderboards: user_id, game_type, period, score, rank, total_sessions, average_accuracy
```

## 🔧 **Implementation Plan:**

### **Phase 1: Remove Legacy Code**
1. Delete `progressService.updateLeaderboards()` method
2. Remove all `leaderboard_entries` table references
3. Remove OffChainAdapter leaderboard caching
4. Remove dual table fallback logic

### **Phase 2: Enhance LeaderboardService**
1. Make it the single source for all leaderboard operations
2. Add real-time ranking calculation from `game_sessions`
3. Implement efficient caching
4. Add proper tier system integration

### **Phase 3: Simplify Score Submission**
1. GameService → LeaderboardService (direct)
2. Remove progressService from the flow
3. Single submission method with automatic ranking

### **Phase 4: Clean Database Schema**
1. Use only existing `leaderboards` table
2. Add missing fields if needed
3. Remove references to non-existent tables

## 📊 **New Unified Flow:**

### **Score Submission:**
```typescript
// Game ends
const result = await gameService.submitGameResult(userId, sessionId, gameResult, config);

// GameService calls LeaderboardService directly
await leaderboardService.submitScore(
  userId, username, score, gameType, culture, userTier, vrfSeed, flowAddress
);

// LeaderboardService handles everything:
// 1. Save to game_sessions
// 2. Calculate rankings from game_sessions
// 3. Update leaderboards table
// 4. Handle on-chain submission for Flow users
```

### **Leaderboard Display:**
```typescript
// UI components call LeaderboardService directly
const leaderboard = await leaderboardService.getOffChainLeaderboard(gameType, culture, limit);

// LeaderboardService:
// 1. Queries leaderboards table
// 2. Returns properly ranked data
// 3. Handles caching automatically
```

## 🎯 **Benefits of Unified Approach:**

### **Code Reduction:**
- **Remove ~200 lines** of duplicate ranking logic
- **Remove ~100 lines** of fallback table handling
- **Remove ~50 lines** of localStorage caching
- **Total: ~350 lines removed**

### **Simplified Maintenance:**
- Single place to modify ranking logic
- Single table schema to maintain
- Single service to debug
- Clear, linear data flow

### **Better Performance:**
- No duplicate calculations
- Efficient single-query rankings
- Proper database indexing
- Reduced complexity = faster execution

### **Future-Proof:**
- Easy to add new game types
- Simple to modify scoring algorithms
- Clear extension points for new features
- Blockchain integration already built-in

## 🔄 **Migration Strategy:**

Since you're the only user:
1. **No data migration needed** - just code cleanup
2. **Existing `leaderboards` table works perfectly**
3. **Existing `game_sessions` data is preserved**
4. **Zero downtime** - just deploy the cleaned code

## 📝 **Files to Modify:**

### **Major Changes:**
- `LeaderboardService.ts` - Enhance as single source of truth
- `GameService.ts` - Direct integration with LeaderboardService
- `progressService.ts` - Remove updateLeaderboards method
- `OffChainAdapter.ts` - Remove leaderboard logic

### **Minor Changes:**
- `Leaderboard.tsx` - Use LeaderboardService directly
- `UserStats.tsx` - Simplified data fetching
- Remove `DualLeaderboard.tsx` - Unnecessary complexity

## 🚀 **Result: Clean, DRY Architecture**

After cleanup:
- **Single responsibility**: LeaderboardService handles all leaderboard operations
- **Single data flow**: Game → GameService → LeaderboardService → Database
- **Single table**: Use existing `leaderboards` table efficiently
- **Single source of truth**: No conflicting ranking calculations
- **Maintainable**: Clear, linear code flow
- **Extensible**: Easy to add features without breaking existing code

This unified approach eliminates all redundancy while maintaining full functionality and making the codebase much cleaner and easier to maintain.
