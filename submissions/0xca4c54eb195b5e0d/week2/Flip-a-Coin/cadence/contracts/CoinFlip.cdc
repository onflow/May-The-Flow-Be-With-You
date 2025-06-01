pub contract CoinFlip {
    // Event emitted when a coin flip occurs
    pub event CoinFlipped(player: Address, result: Bool, timestamp: UFix64)
    
    // Struct to store flip history
    pub struct FlipRecord {
        pub let player: Address
        pub let result: Bool
        pub let timestamp: UFix64

        init(player: Address, result: Bool, timestamp: UFix64) {
            self.player = player
            self.result = result
            self.timestamp = timestamp
        }
    }

    // Dictionary to store player statistics
    pub var playerStats: {Address: PlayerStats}
    
    pub struct PlayerStats {
        pub var totalFlips: UInt64
        pub var wins: UInt64
        pub var currentStreak: UInt64
        pub var bestStreak: UInt64

        init() {
            self.totalFlips = 0
            self.wins = 0
            self.currentStreak = 0
            self.bestStreak = 0
        }
    }

    // Initialize the contract
    init() {
        self.playerStats = {}
    }

    // Flip the coin and return the result
    pub fun flipCoin(player: Address): Bool {
        // Generate a pseudo-random boolean
        // Note: In production, you'd want to use a VRF for true randomness
        let result = unsafeRandom() % 2 == 0
        
        // Update player stats
        if !self.playerStats.containsKey(player) {
            self.playerStats[player] = PlayerStats()
        }
        
        let stats = &self.playerStats[player] as &PlayerStats
        stats.totalFlips = stats.totalFlips + 1
        
        if result {
            stats.wins = stats.wins + 1
            stats.currentStreak = stats.currentStreak + 1
            if stats.currentStreak > stats.bestStreak {
                stats.bestStreak = stats.currentStreak
            }
        } else {
            stats.currentStreak = 0
        }

        // Emit the flip event
        emit CoinFlipped(player: player, result: result, timestamp: getCurrentBlock().timestamp)
        
        return result
    }

    // Get player statistics
    pub fun getPlayerStats(player: Address): PlayerStats? {
        return self.playerStats[player]
    }
} 