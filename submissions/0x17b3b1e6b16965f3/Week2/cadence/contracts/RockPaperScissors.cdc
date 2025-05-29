access(all)
contract RockPaperScissors {

    access(all)
    enum Move: UInt8 {
        access(all) case rock
        access(all) case paper
        access(all) case scissors
    }

    access(all)
    enum Outcome: UInt8 {
        access(all) case win
        access(all) case lose
        access(all) case draw
    }

    access(all)
    struct GameResult {
        access(all) let id: UInt64
        access(all) let playerMove: Move
        access(all) let computerMove: Move
        access(all) let outcome: Outcome
        access(all) let timestamp: UFix64
        access(all) let playerAddress: Address

        init(
            id: UInt64,
            playerMove: Move,
            computerMove: Move,
            outcome: Outcome,
            timestamp: UFix64,
            playerAddress: Address
        ) {
            self.id = id
            self.playerMove = playerMove
            self.computerMove = computerMove
            self.outcome = outcome
            self.timestamp = timestamp
            self.playerAddress = playerAddress
        }
    }

    access(all)
    struct PlayerStats {
        access(all) let totalGames: UInt64
        access(all) let wins: UInt64
        access(all) let losses: UInt64
        access(all) let draws: UInt64
        access(all) let winRate: UFix64
        access(all) let favoriteMove: Move
        access(all) let lastPlayed: UFix64

        init(
            totalGames: UInt64,
            wins: UInt64,
            losses: UInt64,
            draws: UInt64,
            winRate: UFix64,
            favoriteMove: Move,
            lastPlayed: UFix64
        ) {
            self.totalGames = totalGames
            self.wins = wins
            self.losses = losses
            self.draws = draws
            self.winRate = winRate
            self.favoriteMove = favoriteMove
            self.lastPlayed = lastPlayed
        }
    }

    access(all) var gameHistory: {Address: [GameResult]}
    access(all) var playerStats: {Address: PlayerStats}
    access(all) var totalGamesPlayed: UInt64
    access(all) var topPlayers: [Address]
    access(all) var moveStats: {UInt8: UInt64}

    init() {
        self.gameHistory = {}
        self.playerStats = {}
        self.totalGamesPlayed = 0
        self.topPlayers = []
        self.moveStats = {
            0: 0,
            1: 0,
            2: 0
        }
    }

    access(all)
    view fun determineOutcome(playerMove: Move, computerMove: Move): Outcome {
        if playerMove == computerMove {
            return Outcome.draw
        }

        switch playerMove {
            case Move.rock:
                return computerMove == Move.scissors ? Outcome.win : Outcome.lose
            case Move.paper:
                return computerMove == Move.rock ? Outcome.win : Outcome.lose
            case Move.scissors:
                return computerMove == Move.paper ? Outcome.win : Outcome.lose
        }

        return Outcome.draw
    }

    access(all)
    fun updatePlayerStats(player: Address, outcome: Outcome, move: Move) {
        var stats = self.playerStats[player] ?? PlayerStats(
            totalGames: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            winRate: 0.0,
            favoriteMove: move,
            lastPlayed: getCurrentBlock().timestamp
        )

        let newTotalGames = stats.totalGames + 1
        var newWins = stats.wins
        var newLosses = stats.losses
        var newDraws = stats.draws

        switch outcome {
            case Outcome.win:
                newWins = newWins + 1
            case Outcome.lose:
                newLosses = newLosses + 1
            case Outcome.draw:
                newDraws = newDraws + 1
        }

        let newWinRate = UFix64(newWins) / UFix64(newTotalGames)

        self.moveStats[move.rawValue] = self.moveStats[move.rawValue]! + 1

        self.playerStats[player] = PlayerStats(
            totalGames: newTotalGames,
            wins: newWins,
            losses: newLosses,
            draws: newDraws,
            winRate: newWinRate,
            favoriteMove: move,
            lastPlayed: getCurrentBlock().timestamp
        )

        self.updateTopPlayers(player: player, winRate: newWinRate)
    }

    access(all)
    fun updateTopPlayers(player: Address, winRate: UFix64) {
        if self.topPlayers.length == 0 {
            self.topPlayers.append(player)
            return
        }

        var inserted = false
        var newTopPlayers: [Address] = []

        for topPlayer in self.topPlayers {
            if !inserted && winRate > (self.playerStats[topPlayer]?.winRate ?? 0.0) {
                newTopPlayers.append(player)
                inserted = true
            }
            newTopPlayers.append(topPlayer)
        }

        if !inserted && newTopPlayers.length < 10 {
            newTopPlayers.append(player)
        }

        if newTopPlayers.length > 10 {
            newTopPlayers.removeLast()
        }

        self.topPlayers = newTopPlayers
    }

    access(all)
    fun playGame(playerMove: Move, computerMove: Move) {
        self.totalGamesPlayed = self.totalGamesPlayed + 1

        let player = getAccount(0x0).address // Replace with real account retrieval

        let outcome = self.determineOutcome(playerMove: playerMove, computerMove: computerMove)

        let result = GameResult(
            id: self.totalGamesPlayed,
            playerMove: playerMove,
            computerMove: computerMove,
            outcome: outcome,
            timestamp: getCurrentBlock().timestamp,
            playerAddress: player
        )

        if self.gameHistory[player] == nil {
            self.gameHistory[player] = []
        }
        self.gameHistory[player]?.append(result)

        self.updatePlayerStats(player: player, outcome: outcome, move: playerMove)
    }

    access(all)
    view fun getPlayerHistory(player: Address): [GameResult]? {
        return self.gameHistory[player]
    }

    access(all)
    view fun getPlayerStats(player: Address): PlayerStats? {
        return self.playerStats[player]
    }

    access(all)
    view fun getMoveStats(): {UInt8: UInt64} {
        return self.moveStats
    }

    access(all)
    view fun getTopPlayers(): [Address] {
        return self.topPlayers
    }

    access(all)
    view fun getTotalGames(): UInt64 {
        return self.totalGamesPlayed
    }
}
