# Modular Architecture Plan

> **Note**: For Flow blockchain implementation details, see [`FLOW_INTEGRATION_GUIDE.md`](./FLOW_INTEGRATION_GUIDE.md)

## 🎯 Design Goals

1. **Zero Duplication**: Single source of truth for game logic
2. **Mode Flexibility**: Seamless switching between off-chain and on-chain
3. **Progressive Enhancement**: Users can upgrade without losing progress
4. **Clean Separation**: Blockchain concerns isolated from game logic
5. **Testability**: Easy to test both modes independently

## 🏗️ Core Architecture

### **Layer 1: Pure Game Engine (Blockchain Agnostic)**

```typescript
// shared/engines/MemoryGameEngine.ts
export class MemoryGameEngine {
  // Pure game logic - no side effects
  static generateSequence(seed: number, difficulty: Difficulty): Item[];
  static validateAnswer(sequence: Item[], userAnswer: Item[]): GameResult;
  static calculateScore(result: GameResult, timeSpent: number): Score;
  static checkAchievements(
    userStats: UserStats,
    newScore: Score
  ): Achievement[];
}

// shared/engines/CulturalEngine.ts
export class CulturalEngine {
  static getThemeItems(culture: Culture, category: ItemCategory): Item[];
  static adaptGameForCulture(
    baseGame: GameConfig,
    culture: Culture
  ): GameConfig;
  static validateCulturalAuthenticity(items: Item[], culture: Culture): boolean;
}

// shared/engines/RandomnessEngine.ts
export interface RandomnessProvider {
  generateSeed(): Promise<number>;
  generateSecureRandom(min: number, max: number): Promise<number>;
  isVerifiable(): boolean;
}

export class RandomnessEngine {
  constructor(private provider: RandomnessProvider) {}

  async generateGameSequence(config: GameConfig): Promise<GameSequence>;
  async generateCommitReveal(): Promise<CommitRevealPair>;
}
```

### **Layer 2: Adapter Pattern (Mode Selection)**

```typescript
// shared/adapters/GameAdapter.ts
export interface GameAdapter {
  // Progress & Persistence
  saveProgress(userId: string, progress: GameProgress): Promise<void>;
  loadProgress(userId: string): Promise<GameProgress | null>;

  // Achievements
  unlockAchievement(userId: string, achievement: Achievement): Promise<void>;
  getAchievements(userId: string): Promise<Achievement[]>;

  // Leaderboards
  submitScore(userId: string, score: Score): Promise<void>;
  getLeaderboard(category: string): Promise<LeaderboardEntry[]>;

  // Randomness
  getRandomnessProvider(): RandomnessProvider;

  // Mode identification
  getMode(): "offchain" | "onchain";
  supportsFeature(feature: GameFeature): boolean;
}

// shared/adapters/OffChainAdapter.ts
export class OffChainAdapter implements GameAdapter {
  constructor(
    private supabase: SupabaseClient,
    private localStorage: Storage
  ) {}

  getRandomnessProvider(): RandomnessProvider {
    return new PseudoRandomProvider(); // Fast, local
  }

  async saveProgress(userId: string, progress: GameProgress): Promise<void> {
    // Save to Supabase + local backup
    await this.supabase
      .from("progress")
      .upsert({ user_id: userId, ...progress });
    this.localStorage.setItem(`progress_${userId}`, JSON.stringify(progress));
  }

  supportsFeature(feature: GameFeature): boolean {
    return ![
      "nft_achievements",
      "tournaments",
      "verifiable_randomness",
    ].includes(feature);
  }
}

// shared/adapters/OnChainAdapter.ts
export class OnChainAdapter implements GameAdapter {
  constructor(
    private flowService: FlowService,
    private supabase: SupabaseClient
  ) {}

  getRandomnessProvider(): RandomnessProvider {
    return new FlowVRFProvider(this.flowService); // Secure, verifiable
  }

  async unlockAchievement(
    userId: string,
    achievement: Achievement
  ): Promise<void> {
    // Mint NFT achievement on Flow
    const nftId = await this.flowService.mintAchievementNFT(
      userId,
      achievement
    );

    // Also save to Supabase for quick access
    await this.supabase.from("achievements").insert({
      user_id: userId,
      nft_id: nftId,
      ...achievement,
    });
  }

  supportsFeature(feature: GameFeature): boolean {
    return true; // Supports all features
  }
}
```

### **Layer 3: Unified Game Service**

```typescript
// shared/services/GameService.ts
export class GameService {
  constructor(private adapter: GameAdapter) {}

  async playGame(config: GameConfig): Promise<GameSession> {
    // 1. Generate game using pure engine
    const randomnessProvider = this.adapter.getRandomnessProvider();
    const randomnessEngine = new RandomnessEngine(randomnessProvider);
    const sequence = await randomnessEngine.generateGameSequence(config);

    // 2. Adapt for culture
    const culturalSequence = CulturalEngine.adaptGameForCulture(
      sequence,
      config.culture
    );

    // 3. Return session (no side effects yet)
    return new GameSession(culturalSequence, config);
  }

  async submitResult(
    session: GameSession,
    userAnswer: any[]
  ): Promise<GameResult> {
    // 1. Validate using pure engine
    const result = MemoryGameEngine.validateAnswer(
      session.sequence,
      userAnswer
    );
    const score = MemoryGameEngine.calculateScore(result, session.timeSpent);

    // 2. Check achievements
    const userStats = await this.adapter.loadProgress(session.userId);
    const newAchievements = MemoryGameEngine.checkAchievements(
      userStats,
      score
    );

    // 3. Persist using adapter (mode-specific)
    await this.adapter.saveProgress(session.userId, {
      ...userStats,
      lastScore: score,
    });
    await this.adapter.submitScore(session.userId, score);

    for (const achievement of newAchievements) {
      await this.adapter.unlockAchievement(session.userId, achievement);
    }

    return { ...result, score, newAchievements };
  }

  // Mode-aware feature access
  getAvailableFeatures(): GameFeature[] {
    return ALL_FEATURES.filter((feature) =>
      this.adapter.supportsFeature(feature)
    );
  }
}
```

## 🔄 Mode Switching Strategy

### **1. Seamless Upgrade Path**

```typescript
// shared/services/ModeUpgradeService.ts
export class ModeUpgradeService {
  async upgradeToOnChain(userId: string): Promise<UpgradeResult> {
    // 1. Export off-chain progress
    const offChainAdapter = new OffChainAdapter(supabase, localStorage);
    const progress = await offChainAdapter.loadProgress(userId);
    const achievements = await offChainAdapter.getAchievements(userId);

    // 2. Mint NFTs for existing achievements
    const onChainAdapter = new OnChainAdapter(flowService, supabase);
    const nftAchievements = [];

    for (const achievement of achievements) {
      const nftId = await onChainAdapter.unlockAchievement(userId, achievement);
      nftAchievements.push({ ...achievement, nftId });
    }

    // 3. Migrate progress to on-chain compatible format
    await onChainAdapter.saveProgress(userId, {
      ...progress,
      migratedAt: Date.now(),
      originalAchievements: achievements.length,
    });

    return {
      success: true,
      nftsMinted: nftAchievements.length,
      progressMigrated: true,
    };
  }
}
```

### **2. User Experience Flow**

```typescript
// components/ModeSelector.tsx
export function ModeSelector() {
  const { user } = useAuth();
  const [currentMode, setCurrentMode] = useState<"offchain" | "onchain">(
    "offchain"
  );

  const gameService = useMemo(() => {
    const adapter =
      currentMode === "onchain"
        ? new OnChainAdapter(flowService, supabase)
        : new OffChainAdapter(supabase, localStorage);

    return new GameService(adapter);
  }, [currentMode]);

  const availableFeatures = gameService.getAvailableFeatures();

  return (
    <div className="mode-selector">
      <div className="mode-toggle">
        <button
          onClick={() => setCurrentMode("offchain")}
          className={currentMode === "offchain" ? "active" : ""}
        >
          🎮 Practice Mode
          <span className="subtitle">Instant play, local progress</span>
        </button>

        <button
          onClick={() => setCurrentMode("onchain")}
          className={currentMode === "onchain" ? "active" : ""}
        >
          🏆 Competitive Mode
          <span className="subtitle">
            NFT achievements, global leaderboards
          </span>
        </button>
      </div>

      <FeatureComparison
        offChainFeatures={OFF_CHAIN_FEATURES}
        onChainFeatures={ON_CHAIN_FEATURES}
        currentMode={currentMode}
      />
    </div>
  );
}
```

## 🧪 Testing Strategy

### **1. Pure Function Testing**

```typescript
// tests/engines/MemoryGameEngine.test.ts
describe("MemoryGameEngine", () => {
  it("generates consistent sequences for same seed", () => {
    const sequence1 = MemoryGameEngine.generateSequence(12345, "medium");
    const sequence2 = MemoryGameEngine.generateSequence(12345, "medium");
    expect(sequence1).toEqual(sequence2);
  });

  it("calculates scores correctly", () => {
    const result = { correct: 8, total: 10, accuracy: 0.8 };
    const score = MemoryGameEngine.calculateScore(result, 30000); // 30 seconds
    expect(score.points).toBe(800); // 8 * 100 base points
    expect(score.timeBonus).toBeGreaterThan(0);
  });
});
```

### **2. Adapter Testing**

```typescript
// tests/adapters/OffChainAdapter.test.ts
describe("OffChainAdapter", () => {
  it("saves and loads progress correctly", async () => {
    const adapter = new OffChainAdapter(mockSupabase, mockLocalStorage);
    const progress = { level: 5, totalScore: 1000 };

    await adapter.saveProgress("user123", progress);
    const loaded = await adapter.loadProgress("user123");

    expect(loaded).toEqual(progress);
  });

  it("reports correct feature support", () => {
    const adapter = new OffChainAdapter(mockSupabase, mockLocalStorage);
    expect(adapter.supportsFeature("nft_achievements")).toBe(false);
    expect(adapter.supportsFeature("local_progress")).toBe(true);
  });
});
```

## 📊 Benefits of This Architecture

### **For Users:**

- **Instant Start**: No blockchain knowledge required
- **Smooth Upgrade**: Keep all progress when going on-chain
- **Feature Discovery**: Gradually learn about blockchain benefits
- **Choice**: Use the mode that fits their needs

### **For Developers:**

- **Single Codebase**: No duplication between modes
- **Easy Testing**: Pure functions are simple to test
- **Flexible Deployment**: Can deploy off-chain only if needed
- **Future-Proof**: Easy to add new modes or features

### **For Hackathon Judges:**

- **Clear Progression**: Shows evolution from Web2 to Web3
- **Technical Depth**: Demonstrates advanced architecture patterns
- **User-Centric**: Prioritizes user experience over technical complexity
- **Scalable**: Architecture supports future growth and features

This architecture ensures we can deliver both modes without code duplication while providing a clear upgrade path that showcases the value of blockchain integration.

## 👥 Multi-Tier User System

### User Tiers & Benefits

| Tier             | Authentication    | Scoring                   | Leaderboard Access        | Benefits                           | Requirements |
| ---------------- | ----------------- | ------------------------- | ------------------------- | ---------------------------------- | ------------ |
| **🕶️ Anonymous** | None              | Full (personal only)      | None                      | Instant play, no barriers          | None         |
| **📧 Supabase**  | Email/OAuth       | 80% of earned score       | Off-chain only            | Progress tracking, social features | Email signup |
| **⛓️ Flow**      | Wallet connection | 100% + blockchain bonuses | Both off-chain & on-chain | Full scoring, verification, NFTs   | Flow wallet  |

### 🏆 Dual Leaderboard Architecture

#### 📊 Off-Chain Leaderboard (Supabase Database)

- **Purpose**: Fast, social leaderboard for all authenticated users
- **Participants**: Supabase users (80% scoring) + Flow users (100% scoring)
- **Features**: Real-time updates, usernames, cultural categories
- **Benefits**: Immediate feedback, social competition, progress tracking

#### ⛓️ On-Chain Leaderboard (Flow Blockchain)

- **Purpose**: Immutable, verifiable leaderboard for Flow users only
- **Participants**: Flow users who submit transaction after game completion
- **Features**: VRF verification, block height tracking, explorer links
- **Benefits**: Tamper-proof records, provable fairness, full transparency

### 🎮 User Experience Flow

#### Anonymous User Journey

1. **Instant Play** → No signup required, immediate access
2. **Full Personal Scoring** → Track progress locally
3. **Leaderboard Prompt** → "Sign up to compete with others!"
4. **Conversion Incentive** → See what they're missing

#### Supabase User Journey

1. **Email Signup** → Join off-chain leaderboard
2. **80% Scoring** → Reduced points as upgrade incentive
3. **Social Features** → Usernames, achievements, progress tracking
4. **Flow Wallet Prompt** → "Get 100% scoring + blockchain verification"

#### Flow User Journey

1. **Wallet Connection** → Full platform access
2. **100% Scoring** → Maximum points earned
3. **VRF Competitive Mode** → Provably fair randomness
4. **Transaction Submission** → Submit scores to blockchain
5. **Dual Leaderboards** → Compete on both off-chain and on-chain boards
6. **NFT Achievements** → Mint verifiable accomplishments

## 🔄 **Architectural Evolution: From Blockchain-First to Hybrid-First**

### **Original Vision vs. Production Reality**

**Initial Approach (Blockchain-First)**:

```typescript
// Theoretical ideal - blockchain for everything
await submitToBlockchain(score); // Required for all scores
await mintNFT(achievement); // Required for all achievements
await verifyVRF(randomness); // Required for all games
```

**Production Approach (Hybrid-First)**:

```typescript
// Production reality - strategic blockchain usage
await supabase.insert({ score }); // Always reliable
if (isHighValueScore(score)) {
  // Strategic enhancement
  try {
    await submitToBlockchain(score);
  } catch {
    // Optional verification
    /* User progress already saved */
  } // Graceful degradation
}
```

### **Why We Evolved the Architecture**

#### **Technical Challenges Encountered**

1. **FCL Complexity**: Flow Client Library development issues (address resolution, cache conflicts)
2. **Network Dependencies**: Blockchain availability affecting core gameplay
3. **User Experience**: Wallet connection barriers reducing adoption
4. **Development Velocity**: Time spent on blockchain debugging vs. game features

#### **Industry Research Findings**

- **NBA Top Shot**: Uses hybrid approach (off-chain + strategic on-chain)
- **Dapper Wallet Games**: Prioritize UX with optional blockchain features
- **Successful Web3 Games**: Focus on gameplay first, blockchain enhancement second

### **Hybrid Architecture Benefits**

#### **Reliability Metrics**

- **Off-chain reliability**: 99.9% (Supabase + localStorage)
- **Blockchain reliability**: ~95% (network dependent)
- **Hybrid reliability**: 99.9% (off-chain always works, blockchain enhances)

#### **User Adoption Impact**

```typescript
// Blockchain-first: High barrier to entry
const userJourney = [
  "Install wallet", // 70% drop-off
  "Get testnet tokens", // 50% drop-off
  "Connect wallet", // 30% drop-off
  "Play game", // 15% remaining
];

// Hybrid-first: Progressive enhancement
const userJourney = [
  "Play game", // 100% can start
  "See progress", // 95% continue
  "Optional signup", // 60% convert
  "Optional wallet", // 20% upgrade to blockchain
];
```

### **Strategic Blockchain Usage Criteria**

#### **When to Use Blockchain**

```typescript
function shouldUseBlockchain(action: GameAction): boolean {
  const criteria = {
    highValueScore: action.score >= 800, // Top 10% threshold
    perfectGame: action.accuracy === 1.0, // Achievement worthy
    nftMinting: action.type === "achievement", // Permanent asset
    tournament: action.context === "competitive", // Verification critical
    userChoice: action.userRequested === true, // Explicit user intent
  };

  return Object.values(criteria).some(Boolean);
}
```

#### **Blockchain Value Proposition**

- **Verification**: Tamper-proof high scores
- **Permanence**: NFT achievements that persist forever
- **Interoperability**: Cross-platform reputation
- **Transparency**: Provably fair randomness
- **Ownership**: True digital asset ownership

### **Implementation Strategy**

#### **Off-Chain First (Primary)**

```typescript
// Always save to reliable storage first
const result = await offChainAdapter.saveScore(score);
if (!result.success) {
  throw new Error("Core save failed"); // This should never happen
}
```

#### **Blockchain Enhancement (Secondary)**

```typescript
// Optionally enhance with blockchain
if (isBlockchainWorthy(score)) {
  try {
    const txId = await onChainAdapter.verifyScore(score);
    await offChainAdapter.updateVerificationStatus(score.id, txId);
    showSuccess("Score verified on blockchain!");
  } catch (error) {
    // Blockchain failed, but core functionality succeeded
    showInfo("Score saved! Blockchain verification can be retried later.");
  }
}
```

### **Future Architecture Considerations**

#### **Scaling Strategy**

1. **Phase 1**: Hybrid approach with strategic blockchain usage
2. **Phase 2**: Increased blockchain adoption as infrastructure matures
3. **Phase 3**: Full blockchain integration when user adoption supports it

#### **Monitoring & Optimization**

- Track blockchain verification rates (target: 20%+ for eligible actions)
- Monitor user conversion from off-chain to on-chain features
- A/B test blockchain value propositions
- Optimize eligibility thresholds based on user behavior

**Conclusion**: Our hybrid-first architecture provides the reliability of Web2 with the innovation of Web3, creating a production-ready platform that strategically leverages blockchain technology where it adds the most value while maintaining excellent user experience for all users.
