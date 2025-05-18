// EmojiChainGame.cdc

import RandomBeacon from 0x8c5303eaa26202d6 // Flow testnet RandomBeacon address

pub contract EmojiChainGame {
    // Events
    pub event GameStarted(player: Address, level: UInt64, timestamp: UInt64)
    pub event SequenceMatched(player: Address, level: UInt64, score: UInt64)
    pub event HighScoreAchieved(player: Address, score: UInt64)
    
    // Store player information
    pub struct PlayerStats {
        pub var highScore: UInt64
        pub var gamesPlayed: UInt64
        pub var totalScore: UInt64
        pub var currentLevel: UInt64
        
        init() {
            self.highScore = 0
            self.gamesPlayed = 0
            self.totalScore = 0
            self.currentLevel = 0
        }
    }
    
    // Game session information
    pub struct GameSession {
        pub var currentSequence: [String]
        pub var level: UInt64
        pub var score: UInt64
        pub var startTime: UInt64
        pub var hasPowerUp: Bool
        
        init() {
            self.currentSequence = []
            self.level = 1
            self.score = 0
            self.startTime = getCurrentBlock().timestamp
            self.hasPowerUp = false
        }
    }
    
    // Available emoji set
    pub var emojiSet: [String]
    
    // Power-up emoji set
    pub var powerUpEmojiSet: [String]
    
    // Mapping from player address to their stats
    pub var playerStats: {Address: PlayerStats}
    
    // Mapping from player address to their current game session
    pub var gameSessions: {Address: GameSession}
    
    // Top players (addresses) sorted by high score
    pub var topPlayers: [Address]
    
    // Initialize the contract
    init() {
        self.emojiSet = [
            "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", 
            "😉", "😊", "😋", "😎", "😍", "😘", "🥰", "😗", 
            "😙", "😚", "🙂", "🤗", "🤩", "🤔", "🤨", "😐", 
            "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐",
            "😯", "😪", "😫", "🥱", "😴", "😌", "😛", "😜",
            "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑"
        ]
        
        self.powerUpEmojiSet = [
            "⏱️", // Extra time
            "🔍", // Hint
            "🌟", // Double points
            "🛡️", // Protection from mistake
            "🔄"  // Retry level
        ]
        
        self.playerStats = {}
        self.gameSessions = {}
        self.topPlayers = []
    }
    
    // Start a new game session for a player
    pub fun startGame(player: Address) {
        // Register player if first time
        if self.playerStats[player] == nil {
            self.playerStats[player] = PlayerStats()
        }
        
        // Increment games played
        self.playerStats[player]!.gamesPlayed = self.playerStats[player]!.gamesPlayed + 1
        
        // Reset current level
        self.playerStats[player]!.currentLevel = 1
        
        // Create a new game session
        self.gameSessions[player] = GameSession()
        
        // Generate initial sequence
        self.generateSequence(player: player)
        
        emit GameStarted(player: player, level: 1, timestamp: getCurrentBlock().timestamp)
    }
    
    // Generate a random emoji sequence for the player's current level
    pub fun generateSequence(player: Address) {
        pre {
            self.gameSessions[player] != nil: "No active game session"
        }
        
        // Get the current level of the player
        let level = self.gameSessions[player]!.level
        
        // Calculate sequence length based on level
        // Start with 3 emojis at level 1, add one more every 2 levels
        let sequenceLength = 3 + (level - 1) / 2
        
        // Request random value from Flow's randomness source
        let randomValue = RandomBeacon.getRandomField()
        
        // Generate sequence
        let sequence = self.randomToEmojiSequence(randomValue: randomValue, length: sequenceLength)
        
        // Add potential power-up (10% chance, but not on level 1)
        if level > 1 && (randomValue % 10) == 0 {
            // Use another part of the random value to select power-up
            let powerUpIndex = Int(randomValue / 10) % self.powerUpEmojiSet.length
            let powerUpEmoji = self.powerUpEmojiSet[powerUpIndex]
            
            // Insert power-up at random position
            let insertPosition = Int(randomValue / 100) % sequence.length
            sequence.insert(at: insertPosition, powerUpEmoji)
            
            self.gameSessions[player]!.hasPowerUp = true
        } else {
            self.gameSessions[player]!.hasPowerUp = false
        }
        
        // Update the game session with the new sequence
        self.gameSessions[player]!.currentSequence = sequence
    }
    
    // Convert a random value to an emoji sequence
    pub fun randomToEmojiSequence(randomValue: UInt256, length: UInt64): [String] {
        var sequence: [String] = []
        var remainingValue = randomValue
        
        // Get total number of emojis in the set
        let emojiCount = UInt256(self.emojiSet.length)
        
        // Generate the requested number of emojis
        var i: UInt64 = 0
        while i < length {
            // Get a value within the bounds of our emoji set
            let emojiIndex = Int(remainingValue % emojiCount)
            
            // Update remaining value for next emoji
            remainingValue = remainingValue / emojiCount
            
            // Add the selected emoji
            sequence.append(self.emojiSet[emojiIndex])
            
            i = i + 1
        }
        
        return sequence
    }
    
    // Check if player's input sequence matches the generated sequence
    pub fun checkSequence(player: Address, inputSequence: [String]): Bool {
        pre {
            self.gameSessions[player] != nil: "No active game session"
            inputSequence.length == self.gameSessions[player]!.currentSequence.length: 
                "Input sequence length does not match"
        }
        
        let correctSequence = self.gameSessions[player]!.currentSequence
        
        // Check if sequences match
        var i = 0
        while i < correctSequence.length {
            if correctSequence[i] != inputSequence[i] {
                return false
            }
            i = i + 1
        }
        
        return true
    }
    
    // Submit a player's sequence attempt
    pub fun submitSequence(player: Address, inputSequence: [String]): Bool {
        pre {
            self.gameSessions[player] != nil: "No active game session"
        }
        
        // Check if the input sequence matches the generated sequence
        let isMatch = self.checkSequence(player: player, inputSequence: inputSequence)
        
        if isMatch {
            // Calculate score based on level and sequence length
            let level = self.gameSessions[player]!.level
            let basePoints = level * UInt64(inputSequence.length) * 10
            
            // Bonus for containing power-up emoji
            let pointsWithBonus = self.gameSessions[player]!.hasPowerUp 
                ? basePoints * 2 
                : basePoints
            
            // Update session score
            self.gameSessions[player]!.score = self.gameSessions[player]!.score + pointsWithBonus
            
            // Update level
            self.gameSessions[player]!.level = level + 1
            self.playerStats[player]!.currentLevel = level + 1
            
            // Generate new sequence for next level
            self.generateSequence(player: player)
            
            emit SequenceMatched(
                player: player, 
                level: level, 
                score: self.gameSessions[player]!.score
            )
            
            return true
        }
        
        // If match failed, update the player's total score and check for high score
        let finalScore = self.gameSessions[player]!.score
        self.playerStats[player]!.totalScore = self.playerStats[player]!.totalScore + finalScore
        
        // Check if this is a new high score
        if finalScore > self.playerStats[player]!.highScore {
            self.playerStats[player]!.highScore = finalScore
            emit HighScoreAchieved(player: player, score: finalScore)
            
            // Update top players list
            self.updateTopPlayers(player: player)
        }
        
        // Clear the game session
        self.gameSessions.remove(key: player)
        
        return false
    }
    
    // Update the top players list
    pub fun updateTopPlayers(player: Address) {
        // If player is already in the list, remove them
        var playerIndex = -1
        var i = 0
        while i < self.topPlayers.length {
            if self.topPlayers[i] == player {
                playerIndex = i
                break
            }
            i = i + 1
        }
        
        if playerIndex >= 0 {
            self.topPlayers.remove(at: playerIndex)
        }
        
        // Find the position to insert the player based on high score
        let playerScore = self.playerStats[player]!.highScore
        var insertPosition = self.topPlayers.length // Default to end of list
        
        i = 0
        while i < self.topPlayers.length {
            let otherPlayer = self.topPlayers[i]
            let otherScore = self.playerStats[otherPlayer]!.highScore
            
            if playerScore > otherScore {
                insertPosition = i
                break
            }
            i = i + 1
        }
        
        // Insert player at the found position
        self.topPlayers.insert(at: insertPosition, player)
        
        // Keep only top 10 players
        if self.topPlayers.length > 10 {
            self.topPlayers.removeLast()
        }
    }
    
    // Get a player's current sequence
    pub fun getCurrentSequence(player: Address): [String]? {
        return self.gameSessions[player]?.currentSequence
    }
    
    // Get a player's stats
    pub fun getPlayerStats(player: Address): PlayerStats? {
        return self.playerStats[player]
    }
    
    // Get a player's current game session
    pub fun getGameSession(player: Address): GameSession? {
        return self.gameSessions[player]
    }
    
    // Get top players with their scores
    pub fun getTopPlayerScores(limit: Int): {Address: UInt64} {
        let result: {Address: UInt64} = {}
        let count = self.topPlayers.length < limit ? self.topPlayers.length : limit
        
        var i = 0
        while i < count {
            let player = self.topPlayers[i]
            result[player] = self.playerStats[player]!.highScore
            i = i + 1
        }
        
        return result
    }
    
    // Utility function to get current block
    pub fun getCurrentBlock(): Block {
        return getCurrentBlock()
    }
}