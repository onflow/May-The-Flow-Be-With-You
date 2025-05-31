// MemoryLeaderboard Contract
// On-chain leaderboard for verified memory game scores

access(all) contract MemoryLeaderboard {

    // Events
    access(all) event ScoreSubmitted(player: Address, score: UInt64, gameType: String, culture: String, blockHeight: UInt64)
    access(all) event LeaderboardUpdated(gameType: String, culture: String, newTopScore: UInt64)

    // Storage paths
    access(all) let PlayerStatsStoragePath: StoragePath
    access(all) let PlayerStatsPublicPath: PublicPath
    access(all) let AdminStoragePath: StoragePath

    // Leaderboard entry structure
    access(all) struct LeaderboardEntry {
        access(all) let playerAddress: Address
        access(all) let score: UInt64
        access(all) let gameType: String
        access(all) let culture: String
        access(all) let blockHeight: UInt64
        access(all) let transactionId: String
        access(all) let vrfSeed: UInt64
        access(all) let timestamp: UFix64

        init(
            playerAddress: Address,
            score: UInt64,
            gameType: String,
            culture: String,
            blockHeight: UInt64,
            transactionId: String,
            vrfSeed: UInt64
        ) {
            self.playerAddress = playerAddress
            self.score = score
            self.gameType = gameType
            self.culture = culture
            self.blockHeight = blockHeight
            self.transactionId = transactionId
            self.vrfSeed = vrfSeed
            self.timestamp = getCurrentBlock().timestamp
        }
    }

    // Player statistics resource
    access(all) resource PlayerStats {
        access(all) var totalGames: UInt64
        access(all) var totalScore: UInt64
        access(all) var bestScore: UInt64
        access(all) var lastGameTimestamp: UFix64
        access(all) let gameHistory: [LeaderboardEntry]

        init() {
            self.totalGames = 0
            self.totalScore = 0
            self.bestScore = 0
            self.lastGameTimestamp = 0.0
            self.gameHistory = []
        }

        access(all) fun addScore(_ entry: LeaderboardEntry) {
            self.totalGames = self.totalGames + 1
            self.totalScore = self.totalScore + entry.score
            self.lastGameTimestamp = entry.timestamp
            
            if entry.score > self.bestScore {
                self.bestScore = entry.score
            }
            
            self.gameHistory.append(entry)
        }

        access(all) fun getStats(): {String: AnyStruct} {
            return {
                "totalGames": self.totalGames,
                "totalScore": self.totalScore,
                "bestScore": self.bestScore,
                "averageScore": self.totalGames > 0 ? self.totalScore / self.totalGames : 0,
                "lastGameTimestamp": self.lastGameTimestamp
            }
        }
    }

    // Global leaderboard storage
    access(contract) var globalLeaderboard: {String: [LeaderboardEntry]} // gameType_culture -> entries

    // Public interface for player stats
    access(all) resource interface PlayerStatsPublic {
        access(all) fun getStats(): {String: AnyStruct}
        access(all) fun getGameHistory(): [LeaderboardEntry]
    }

    // Admin resource for leaderboard management
    access(all) resource Admin {
        access(all) fun clearLeaderboard(gameType: String, culture: String) {
            let key = gameType.concat("_").concat(culture)
            MemoryLeaderboard.globalLeaderboard[key] = []
        }

        access(all) fun removeEntry(gameType: String, culture: String, playerAddress: Address) {
            let key = gameType.concat("_").concat(culture)
            if let entries = MemoryLeaderboard.globalLeaderboard[key] {
                let filteredEntries: [LeaderboardEntry] = []
                for entry in entries {
                    if entry.playerAddress != playerAddress {
                        filteredEntries.append(entry)
                    }
                }
                MemoryLeaderboard.globalLeaderboard[key] = filteredEntries
            }
        }
    }

    // Create player stats resource
    access(all) fun createPlayerStats(): @PlayerStats {
        return <- create PlayerStats()
    }

    // Submit a verified score to the leaderboard
    access(all) fun submitScore(
        player: Address,
        score: UInt64,
        gameType: String,
        culture: String,
        vrfSeed: UInt64
    ) {
        pre {
            score > 0: "Score must be greater than 0"
            gameType.length > 0: "Game type cannot be empty"
            culture.length > 0: "Culture cannot be empty"
        }

        let blockHeight = getCurrentBlock().height
        let transactionId = "tx_".concat(blockHeight.toString()).concat("_").concat(player.toString())

        let entry = LeaderboardEntry(
            playerAddress: player,
            score: score,
            gameType: gameType,
            culture: culture,
            blockHeight: blockHeight,
            transactionId: transactionId,
            vrfSeed: vrfSeed
        )

        // Add to global leaderboard
        let key = gameType.concat("_").concat(culture)
        if self.globalLeaderboard[key] == nil {
            self.globalLeaderboard[key] = []
        }

        self.globalLeaderboard[key]!.append(entry)

        // Sort leaderboard by score (descending)
        self.globalLeaderboard[key] = self.sortLeaderboard(self.globalLeaderboard[key]!)

        // Keep only top 100 entries per category
        if self.globalLeaderboard[key]!.length > 100 {
            self.globalLeaderboard[key] = self.globalLeaderboard[key]!.slice(from: 0, upTo: 100)
        }

        // Note: Player stats functionality removed for simplicity
        // Individual player stats can be tracked off-chain or in separate contract

        // Emit events
        emit ScoreSubmitted(
            player: player,
            score: score,
            gameType: gameType,
            culture: culture,
            blockHeight: blockHeight
        )

        if self.globalLeaderboard[key]!.length > 0 {
            emit LeaderboardUpdated(
                gameType: gameType,
                culture: culture,
                newTopScore: self.globalLeaderboard[key]![0].score
            )
        }
    }

    // Get top scores for a specific game type and culture
    access(all) fun getTopScores(gameType: String?, culture: String?, limit: Int): [LeaderboardEntry] {
        if gameType != nil && culture != nil {
            let key = gameType!.concat("_").concat(culture!)
            if let entries = self.globalLeaderboard[key] {
                return entries.slice(from: 0, upTo: limit < entries.length ? limit : entries.length)
            }
        } else {
            // Return top scores across all categories
            var allEntries: [LeaderboardEntry] = []
            for entries in self.globalLeaderboard.values {
                allEntries = allEntries.concat(entries)
            }
            allEntries = self.sortLeaderboard(allEntries)
            return allEntries.slice(from: 0, upTo: limit < allEntries.length ? limit : allEntries.length)
        }
        return []
    }

    // Get player's rank in a specific category
    access(all) fun getPlayerRank(player: Address, gameType: String, culture: String): UInt64? {
        let key = gameType.concat("_").concat(culture)
        if let entries = self.globalLeaderboard[key] {
            var rank: UInt64 = 1
            for entry in entries {
                if entry.playerAddress == player {
                    return rank
                }
                rank = rank + 1
            }
        }
        return nil
    }

    // Get total number of players in a category
    access(all) fun getTotalPlayers(gameType: String, culture: String): UInt64 {
        let key = gameType.concat("_").concat(culture)
        if let entries = self.globalLeaderboard[key] {
            return UInt64(entries.length)
        }
        return 0
    }

    // Helper function to sort leaderboard entries by score (descending)
    access(contract) fun sortLeaderboard(_ entries: [LeaderboardEntry]): [LeaderboardEntry] {
        if entries.length <= 1 {
            return entries
        }

        var sortedEntries = entries
        let length = sortedEntries.length

        // Simple bubble sort (sufficient for small arrays)
        var i = 0
        while i < length - 1 {
            var j = 0
            while j < length - i - 1 {
                if sortedEntries[j].score < sortedEntries[j + 1].score {
                    let temp = sortedEntries[j]
                    sortedEntries[j] = sortedEntries[j + 1]
                    sortedEntries[j + 1] = temp
                }
                j = j + 1
            }
            i = i + 1
        }

        return sortedEntries
    }

    init() {
        // Initialize storage paths
        self.PlayerStatsStoragePath = /storage/MemoryPlayerStats
        self.PlayerStatsPublicPath = /public/MemoryPlayerStats
        self.AdminStoragePath = /storage/MemoryLeaderboardAdmin

        // Initialize storage
        self.globalLeaderboard = {}

        // Create and store admin resource
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
    }
}
