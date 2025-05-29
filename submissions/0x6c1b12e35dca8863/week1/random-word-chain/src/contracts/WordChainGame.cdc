import RandomBeacon from 0x8c5303eaa26202d6

access(all) contract WordChainGame {

    access(all) event PlayerRegistered(player: Address)
    access(all) event WordSubmitted(player: Address, word: String, score: UInt64)

    access(all) struct PlayerInfo {
        access(all) var score: UInt64
        access(all) var wordsSubmitted: UInt64
        access(all) var currentLetters: [String]

        init() {
            self.score = 0
            self.wordsSubmitted = 0
            self.currentLetters = []
        }
    }

    access(all) var players: {Address: PlayerInfo}
    access(all) var validWords: {String: Bool}
    access(all) var letterFrequencies: [String]

    init() {
        self.players = {}
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
        }

        self.letterFrequencies = [
            "E", "E", "E", "E", "E",
            "A", "A", "A", "A",
            "I", "I", "I", "I",
            "O", "O", "O", "O",
            "U", "U", "U",
            "T", "T", "T", "T",
            "N", "N", "N", "N", 
            "S", "S", "S", "S",
            "R", "R", "R", "R",
            "H", "H", "H",
            "L", "L", "L",
            "D", "D", "D",
            "C", "C", "C",
            "M", "M", "M",
            "F", "F", 
            "P", "P",
            "G", "G", 
            "W", "W",
            "Y", "Y",
            "B", "B",
            "V",
            "K",
            "J",
            "X",
            "Q",
            "Z"
        ]
    }

    access(all) fun registerPlayer(player: Address) {
        if self.players[player] == nil {
            self.players[player] = PlayerInfo()
            self.getNewLetters(player: player, count: 7)
            emit PlayerRegistered(player: player)
        }
    }

    access(all) fun getNewLetters(player: Address, count: Int) {
        pre {
            self.players[player] != nil: "Player not registered"
            count > 0: "Count must be greater than zero"
        }

        let randomValue = RandomBeacon.getRandomField()
        let letters = self.randomToLetters(randomValue: randomValue, count: count)
        self.players[player]!.currentLetters = self.players[player]!.currentLetters.concat(letters)
    }

    access(all) fun randomToLetters(randomValue: UInt256, count: Int): [String] {
        var letters: [String] = []
        var remainingValue = randomValue
        let frequencySize = UInt256(self.letterFrequencies.length)

        var i = 0
        while i < count {
            let letterIndex = Int(remainingValue % frequencySize)
            remainingValue = remainingValue / frequencySize
            letters.append(self.letterFrequencies[letterIndex])
            i = i + 1
        }

        return letters
    }

    access(all) fun submitWord(player: Address, word: String): Bool {
        pre {
            self.players[player] != nil: "Player not registered"
            word.length > 2: "Word must be at least 3 letters long"
        }

        let upperWord = word.uppercased()

        if self.validWords[upperWord] != true {
            return false
        }

        if !self.playerHasLetters(player: player, word: upperWord) {
            return false
        }

        self.removeLetters(player: player, word: upperWord)

        let score = UInt64(word.length)
        self.players[player]!.score = self.players[player]!.score + score
        self.players[player]!.wordsSubmitted = self.players[player]!.wordsSubmitted + 1

        self.getNewLetters(player: player, count: upperWord.length)
        emit WordSubmitted(player: player, word: upperWord, score: score)

        return true
    }

    access(all) fun playerHasLetters(player: Address, word: String): Bool {
        let playerLetters = self.players[player]!.currentLetters.slice(from: 0, upTo: self.players[player]!.currentLetters.length)
        let chars = word.utf8
        var i = 0
        while i < chars.length {
            let char = String.fromUTF8([chars[i]])!
            var found = false
            var j = 0
            while j < playerLetters.length {
                if playerLetters[j] == char {
                    playerLetters.remove(at: j)
                    found = true
                    break
                }
                j = j + 1
            }
            if !found {
                return false
            }
            i = i + 1
        }

        return true
    }

    access(all) fun removeLetters(player: Address, word: String) {
        var playerLetters = self.players[player]!.currentLetters
        let chars = word.utf8
        var i = 0
        while i < chars.length {
            let char = String.fromUTF8([chars[i]])!
            var j = 0
            while j < playerLetters.length {
                if playerLetters[j] == char {
                    playerLetters.remove(at: j)
                    break
                }
                j = j + 1
            }
            i = i + 1
        }
        self.players[player]!.currentLetters = playerLetters
    }

    access(all) view fun getPlayerInfo(player: Address): PlayerInfo? {
        return self.players[player]
    }

    access(all) view fun getTopPlayers(limit: Int): [Address] {
        let addresses = self.players.keys
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

        let resultCount = addresses.length < limit ? addresses.length : limit
        return addresses.slice(from: 0, upTo: resultCount)
    }
}
