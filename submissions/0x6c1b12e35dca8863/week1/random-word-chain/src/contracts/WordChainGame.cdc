// WordChainGame.cdc

import RandomBeacon from 0x8c5303eaa26202d6 // Flow testnet RandomBeacon address

pub contract WordChainGame {
    // Event for when a player registers
    pub event PlayerRegistered(player: Address)
    
    // Event for when a player submits a valid word
    pub event WordSubmitted(player: Address, word: String, score: UInt64)
    
    // Store player information
    pub struct PlayerInfo {
        pub var score: UInt64
        pub var wordsSubmitted: UInt64
        pub var currentLetters: [String]
        
        init() {
            self.score = 0
            self.wordsSubmitted = 0
            self.currentLetters = []
        }
    }
    
    // Dictionary mapping player addresses to their info
    pub var players: {Address: PlayerInfo}
    
    // Dictionary of valid words (simplified dictionary - would be larger in production)
    pub var validWords: {String: Bool}
    
    // Letter frequencies for more natural distribution
    // Based on common English letter frequencies
    pub var letterFrequencies: [String]
    
    // Initialize the contract
    init() {
        self.players = {}
        
        // Initialize with some sample valid words
        self.validWords = {
            "CAT": true,
            "DOG": true,
            "FLOW": true,
            "BLOCKCHAIN": true,
            "RANDOM": true,
            "GAME": true,
            "PLAY": true,
            "WORD": true,
            "CHAIN": true,
            "TOKEN": true,
            "SMART": true,
            "CONTRACT": true
            // In a real implementation, this would be much larger
        }
        
        // Initialize letter frequencies array
        // Letters repeated based on their frequency in English
        self.letterFrequencies = [
            // Vowels (common)
            "E", "E", "E", "E", "E",
            "A", "A", "A", "A",
            "I", "I", "I", "I",
            "O", "O", "O", "O",
            "U", "U", "U",
            // Common consonants
            "T", "T", "T", "T",
            "N", "N", "N", "N", 
            "S", "S", "S", "S",
            "R", "R", "R", "R",
            "H", "H", "H",
            "L", "L", "L",
            "D", "D", "D",
            "C", "C", "C",
            "M", "M", "M",
            // Less common consonants
            "F", "F", 
            "P", "P",
            "G", "G", 
            "W", "W",
            "Y", "Y",
            "B", "B",
            "V",
            "K",
            // Rare consonants
            "J",
            "X",
            "Q",
            "Z"
        ]
    }
    
    // Register a new player
    pub fun registerPlayer(player: Address) {
        if self.players[player] == nil {
            self.players[player] = PlayerInfo()
            
            // Give them initial random letters
            self.getNewLetters(player: player, count: 7)
            
            emit PlayerRegistered(player: player)
        }
    }
    
    // Get new random letters
    pub fun getNewLetters(player: Address, count: Int) {
        pre {
            self.players[player] != nil: "Player not registered"
            count > 0: "Count must be greater than zero"
        }
        
        // Request random value from Flow's randomness source
        let randomValue = RandomBeacon.getRandomField()
        
        // Convert random value to letters
        let letters = self.randomToLetters(randomValue: randomValue, count: count)
        
        // Add letters to player's available letters
        self.players[player]!.currentLetters = self.players[player]!.currentLetters.concat(letters)
    }
    
    // Convert a random value to letters using the frequency table
    pub fun randomToLetters(randomValue: UInt256, count: Int): [String] {
        var letters: [String] = []
        var remainingValue = randomValue
        
        // Get total number of letters in the frequency array
        let frequencySize = UInt256(self.letterFrequencies.length)
        
        // Generate the requested number of letters
        var i = 0
        while i < count {
            // Get a value within the bounds of our frequency array
            let letterIndex = Int(remainingValue % frequencySize)
            
            // Update remaining value for next letter
            remainingValue = remainingValue / frequencySize
            
            // Add the selected letter
            letters.append(self.letterFrequencies[letterIndex])
            
            i = i + 1
        }
        
        return letters
    }
    
    // Submit a word
    pub fun submitWord(player: Address, word: String): Bool {
        pre {
            self.players[player] != nil: "Player not registered"
            word.length > 2: "Word must be at least 3 letters long"
        }
        
        // Convert word to uppercase for consistency
        let upperWord = word.uppercased()
        
        // Check if word is valid
        if self.validWords[upperWord] != true {
            return false
        }
        
        // Check if player has the letters
        if !self.playerHasLetters(player: player, word: upperWord) {
            return false
        }
        
        // Remove used letters
        self.removeLetters(player: player, word: upperWord)
        
        // Calculate score (1 point per letter)
        let score = UInt64(word.length)
        self.players[player]!.score = self.players[player]!.score + score
        self.players[player]!.wordsSubmitted = self.players[player]!.wordsSubmitted + 1
        
        // Replace used letters with new random ones
        self.getNewLetters(player: player, count: upperWord.length)
        
        emit WordSubmitted(player: player, word: upperWord, score: score)
        
        return true
    }
    
    // Check if player has the letters to form a word
    pub fun playerHasLetters(player: Address, word: String): Bool {
        let playerLetters = self.players[player]!.currentLetters.slice(from: 0, upTo: self.players[player]!.currentLetters.length)
        
        // For each letter in the word
        let chars = word.utf8
        var i = 0
        while i < chars.length {
            let char = String.fromUTF8([chars[i]])!
            
            // Find this letter in the player's letters
            var found = false
            var j = 0
            while j < playerLetters.length {
                if playerLetters[j] == char {
                    // Remove this letter to avoid counting it twice
                    playerLetters.remove(at: j)
                    found = true
                    break
                }
                j = j + 1
            }
            
            // If letter not found, player doesn't have the required letters
            if !found {
                return false
            }
            
            i = i + 1
        }
        
        return true
    }
    
    // Remove used letters from player's collection
    pub fun removeLetters(player: Address, word: String) {
        var playerLetters = self.players[player]!.currentLetters
        
        // For each letter in the word
        let chars = word.utf8
        var i = 0
        while i < chars.length {
            let char = String.fromUTF8([chars[i]])!
            
            // Find this letter in the player's letters
            var j = 0
            while j < playerLetters.length {
                if playerLetters[j] == char {
                    // Remove this letter
                    playerLetters.remove(at: j)
                    break
                }
                j = j + 1
            }
            
            i = i + 1
        }
        
        self.players[player]!.currentLetters = playerLetters
    }
    
    // Get player info
    pub fun getPlayerInfo(player: Address): PlayerInfo? {
        return self.players[player]
    }
    
    // Get top players
    pub fun getTopPlayers(limit: Int): [Address] {
        let addresses = self.players.keys
        
        // Sort addresses by score (simple bubble sort)
        var i = 0
        while i < addresses.length {
            var j = 0
            while j < addresses.length - i - 1 {
                if self.players[addresses[j]]!.score < self.players[addresses[j+1]]!.score {
                    let temp = addresses[j]
                    addresses[j] = addresses[j+1]
                    addresses[j+1] = temp
                }
                j = j + 1
            }
            i = i + 1
        }
        
        // Return top N addresses
        let resultCount = addresses.length < limit ? addresses.length : limit
        return addresses.slice(from: 0, upTo: resultCount)
    }
}