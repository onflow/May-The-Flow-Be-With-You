access(all) contract CoinFlip {

    access(all) event CoinFlipped(player: Address, result: Bool, timestamp: UFix64)

    access(all) struct FlipRecord {
        access(all) let player: Address
        access(all) let result: Bool
        access(all) let timestamp: UFix64

        init(player: Address, result: Bool, timestamp: UFix64) {
            self.player = player
            self.result = result
            self.timestamp = timestamp
        }
    }

    access(all) var playerStats: {Address: PlayerStats}

    access(all) struct PlayerStats {
        access(all) var totalFlips: UInt64
        access(all) var wins: UInt64
        access(all) var currentStreak: UInt64
        access(all) var bestStreak: UInt64

        init() {
            self.totalFlips = 0
            self.wins = 0
            self.currentStreak = 0
            self.bestStreak = 0
        }
    }

    init() {
        self.playerStats = {}
    }

    access(all) fun flipCoin(player: Address): Bool {
        let result = unsafeRandom() % 2 == 0

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

        emit CoinFlipped(player: player, result: result, timestamp: getCurrentBlock().timestamp)

        return result
    }

    access(all) view fun getPlayerStats(player: Address): PlayerStats? {
        return self.playerStats[player]
    }
}
