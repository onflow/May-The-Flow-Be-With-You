pub contract RockPaperScissors {
    // Define the possible moves
    pub enum Move: UInt8 {
        pub case rock
        pub case paper
        pub case scissors
    }

    // Define the possible game outcomes
    pub enum Outcome: UInt8 {
        pub case win
        pub case lose
        pub case draw
    }

    // Structure to store game results
    pub struct GameResult {
        pub let id: UInt64
        pub let playerMove: Move
        pub let computerMove: Move
        pub let outcome: Outcome
        pub let timestamp: UFix64
        pub let playerAddress: Address

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

    // Structure to store player statistics
    pub struct PlayerStats {
        pub let totalGames: UInt64
        pub let wins: UInt64
        pub let losses: UInt64
        pub let draws: UInt64
        pub let winRate: UFix64
        pub let favoriteMove: Move
        pub let lastPlayed: UFix64

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

    // Game state variables
    pub var gameHistory: {Address: [GameResult]}
    pub var playerStats: {Address: PlayerStats}
    pub var totalGamesPlayed: UInt64
    pub var topPlayers: [Address]
    pub var moveStats: {UInt8: UInt64} // Track popularity of each move

    init() {
        self.gameHistory = {}
        self.playerStats = {}
        self.totalGamesPlayed = 0
        self.topPlayers = []
        self.moveStats = {
            0: 0, // rock
            1: 0, // paper
            2: 0  // scissors
        }
    }

    // Function to determine the winner
    pub fun determineOutcome(playerMove: Move, computerMove: Move): Outcome {
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

    // Function to update player statistics
    pub fun updatePlayerStats(player: Address, outcome: Outcome, move: Move) {
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

        // Update move stats
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

    // Function to update top players
    pub fun updateTopPlayers(player: Address, winRate: UFix64) {
        if self.topPlayers.length == 0 {
            self.topPlayers.append(player)
            return
        }

        // Only keep top 10 players
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

        // Keep only top 10
        if newTopPlayers.length > 10 {
            newTopPlayers.removeLast()
        }

        self.topPlayers = newTopPlayers
    }

    // Function to play the game
    pub fun playGame(playerMove: Move, computerMove: Move) {
        self.totalGamesPlayed = self.totalGamesPlayed + 1
        let player = AuthAccount.authAccounts[0].address
        let outcome = self.determineOutcome(playerMove: playerMove, computerMove: computerMove)
        
        let result = GameResult(
            id: self.totalGamesPlayed,
            playerMove: playerMove,
            computerMove: computerMove,
            outcome: outcome,
            timestamp: getCurrentBlock().timestamp,
            playerAddress: player
        )

        // Update game history
        if self.gameHistory[player] == nil {
            self.gameHistory[player] = []
        }
        self.gameHistory[player]?.append(result)

        // Update player statistics
        self.updatePlayerStats(player: player, outcome: outcome, move: playerMove)
    }

    // Function to get a player's game history
    pub fun getPlayerHistory(player: Address): [GameResult]? {
        return self.gameHistory[player]
    }

    // Function to get a player's statistics
    pub fun getPlayerStats(player: Address): PlayerStats? {
        return self.playerStats[player]
    }

    // Function to get global move statistics
    pub fun getMoveStats(): {UInt8: UInt64} {
        return self.moveStats
    }

    // Function to get top players
    pub fun getTopPlayers(): [Address] {
        return self.topPlayers
    }

    // Function to get total games played
    pub fun getTotalGames(): UInt64 {
        return self.totalGamesPlayed
    }
} 