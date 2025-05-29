import RandomBeacon from 0x8c5303eaa26202d6

access(all) contract EmojiChainGame {

    access(all) event GameStarted(player: Address, level: UInt64, timestamp: UInt64)
    access(all) event SequenceMatched(player: Address, level: UInt64, score: UInt64)
    access(all) event HighScoreAchieved(player: Address, score: UInt64)

    access(all) struct PlayerStats {
        access(all) var highScore: UInt64
        access(all) var gamesPlayed: UInt64
        access(all) var totalScore: UInt64
        access(all) var currentLevel: UInt64

        init() {
            self.highScore = 0
            self.gamesPlayed = 0
            self.totalScore = 0
            self.currentLevel = 0
        }
    }

    access(all) struct GameSession {
        access(all) var currentSequence: [String]
        access(all) var level: UInt64
        access(all) var score: UInt64
        access(all) var startTime: UInt64
        access(all) var hasPowerUp: Bool

        init() {
            self.currentSequence = []
            self.level = 1
            self.score = 0
            self.startTime = getCurrentBlock().timestamp
            self.hasPowerUp = false
        }
    }

    access(all) var emojiSet: [String]
    access(all) var powerUpEmojiSet: [String]
    access(all) var playerStats: {Address: PlayerStats}
    access(all) var gameSessions: {Address: GameSession}
    access(all) var topPlayers: [Address]

    init() {
        self.emojiSet = [
            "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆",
            "😉", "😊", "😋", "😎", "😍", "😘", "🥰", "😗",
            "😙", "😚", "🙂", "🤗", "🤩", "🤔", "🤨", "😐",
            "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐",
            "😯", "😪", "😫", "🥱", "😴", "😌", "😛", "😜",
            "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑"
        ]

        self.powerUpEmojiSet = ["⏱️", "🔍", "🌟", "🛡️", "🔄"]
        self.playerStats = {}
        self.gameSessions = {}
        self.topPlayers = []
    }

    access(all) fun startGame(player: Address) {
        if self.playerStats[player] == nil {
            self.playerStats[player] = PlayerStats()
        }
        self.playerStats[player]!.gamesPlayed = self.playerStats[player]!.gamesPlayed + 1
        self.playerStats[player]!.currentLevel = 1
        self.gameSessions[player] = GameSession()
        self.generateSequence(player: player)
        emit GameStarted(player: player, level: 1, timestamp: getCurrentBlock().timestamp)
    }

    access(all) fun generateSequence(player: Address) {
        pre {
            self.gameSessions[player] != nil: "No active game session"
        }

        let level = self.gameSessions[player]!.level
        let sequenceLength = 3 + (level - 1) / 2
        let randomValue = RandomBeacon.getRandomField()
        let sequence = self.randomToEmojiSequence(randomValue: randomValue, length: sequenceLength)

        if level > 1 && (randomValue % 10) == 0 {
            let powerUpIndex = Int(randomValue / 10) % self.powerUpEmojiSet.length
            let powerUpEmoji = self.powerUpEmojiSet[powerUpIndex]
            let insertPosition = Int(randomValue / 100) % sequence.length
            sequence.insert(at: insertPosition, powerUpEmoji)
            self.gameSessions[player]!.hasPowerUp = true
        } else {
            self.gameSessions[player]!.hasPowerUp = false
        }

        self.gameSessions[player]!.currentSequence = sequence
    }

    access(all) fun randomToEmojiSequence(randomValue: UInt256, length: UInt64): [String] {
        var sequence: [String] = []
        var remainingValue = randomValue
        let emojiCount = UInt256(self.emojiSet.length)

        var i: UInt64 = 0
        while i < length {
            let emojiIndex = Int(remainingValue % emojiCount)
            remainingValue = remainingValue / emojiCount
            sequence.append(self.emojiSet[emojiIndex])
            i = i + 1
        }

        return sequence
    }

    access(all) fun checkSequence(player: Address, inputSequence: [String]): Bool {
        pre {
            self.gameSessions[player] != nil: "No active game session"
            inputSequence.length == self.gameSessions[player]!.currentSequence.length:
                "Input sequence length does not match"
        }

        let correctSequence = self.gameSessions[player]!.currentSequence
        var i = 0
        while i < correctSequence.length {
            if correctSequence[i] != inputSequence[i] {
                return false
            }
            i = i + 1
        }

        return true
    }

    access(all) fun submitSequence(player: Address, inputSequence: [String]): Bool {
        pre {
            self.gameSessions[player] != nil: "No active game session"
        }

        let isMatch = self.checkSequence(player: player, inputSequence: inputSequence)

        if isMatch {
            let level = self.gameSessions[player]!.level
            let basePoints = level * UInt64(inputSequence.length) * 10
            let pointsWithBonus = self.gameSessions[player]!.hasPowerUp
                ? basePoints * 2
                : basePoints

            self.gameSessions[player]!.score = self.gameSessions[player]!.score + pointsWithBonus
            self.gameSessions[player]!.level = level + 1
            self.playerStats[player]!.currentLevel = level + 1
            self.generateSequence(player: player)

            emit SequenceMatched(
                player: player,
                level: level,
                score: self.gameSessions[player]!.score
            )

            return true
        }

        let finalScore = self.gameSessions[player]!.score
        self.playerStats[player]!.totalScore = self.playerStats[player]!.totalScore + finalScore

        if finalScore > self.playerStats[player]!.highScore {
            self.playerStats[player]!.highScore = finalScore
            emit HighScoreAchieved(player: player, score: finalScore)
            self.updateTopPlayers(player: player)
        }

        self.gameSessions.remove(key: player)
        return false
    }

    access(all) fun updateTopPlayers(player: Address) {
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

        let playerScore = self.playerStats[player]!.highScore
        var insertPosition = self.topPlayers.length

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

        self.topPlayers.insert(at: insertPosition, player)

        if self.topPlayers.length > 10 {
            self.topPlayers.removeLast()
        }
    }

    access(all) view fun getCurrentSequence(player: Address): [String]? {
        return self.gameSessions[player]?.currentSequence
    }

    access(all) view fun getPlayerStats(player: Address): PlayerStats? {
        return self.playerStats[player]
    }

    access(all) view fun getGameSession(player: Address): GameSession? {
        return self.gameSessions[player]
    }

    access(all) view fun getTopPlayerScores(limit: Int): {Address: UInt64} {
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

    access(all) view fun getCurrentBlock(): Block {
        return getCurrentBlock()
    }
}
