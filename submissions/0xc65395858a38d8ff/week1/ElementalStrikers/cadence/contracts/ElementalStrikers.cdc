// ElementalStrikers.cdc

// Standard Flow contract imports
import FungibleToken from 0x9a0766d93b6608b7 // FungibleToken standard address for Testnet
import FlowToken from 0x7e60df042a9c0868     // FlowToken standard address for Testnet
import RandomBeaconHistory from 0x8c5303eaa26202d6 // RandomBeaconHistory for commit-reveal on Testnet

// TODO: Import or define a PRNG like Xorshift128plus
// For now, we'll use a very simple placeholder.
// import Xorshift128plus from "./Xorshift128plus.cdc" // Assuming it's in the same directory

access(all) contract ElementalStrikers {

    // Simple PRNG (Linear Congruential Generator)
    // NOT cryptographically secure for general purposes, but sufficient for deriving multiple
    // game variables from a single on-chain random seed for this MVP.
    access(all) struct PRNG {
        access(self) var state: UInt64
        access(self) let a: UInt64 // Multiplier
        access(self) let c: UInt64 // Increment
        access(self) let m: UInt64 // Modulus (should be large, ideally a power of 2 for bitwise ops if possible, or large prime)

        init(seed: UInt64, salt: UInt64) {
            // Constants for LCG - these are example values, can be tuned.
            self.a = 1664525
            self.c = 1013904223
            self.m = 4294967296 // 2^32 (Max value for UInt32, used here as UInt64 for simplicity with UInt64 state)
            // Combine seed and salt for initial state - simple xor for this example
            self.state = (seed ^ salt)
        }

        access(all) fun next(): UInt64 {
            self.state = (self.state * self.a + self.c) % self.m
            return self.state
        }
    }

    //-----------------------------------------------------------------------
    // Events
    //-----------------------------------------------------------------------
    event ContractInitialized()
    event GameCreated(gameId: UInt64, player1: Address, stakeAmount: UFix64, mode: String)
    event GameJoined(gameId: UInt64, player2: Address)
    // Using String for element for simplicity, could be UInt8 for Fuego=0, Agua=1, Planta=2
    event MoveMade(gameId: UInt64, player: Address, element: String)
    event GameCommittedToRandomness(gameId: UInt64, commitBlockHeight: UInt64)
    event GameResolved(
        gameId: UInt64,
        mode: String,
        winner: Address?,
        loser: Address?,
        player1Move: String,
        playerOrComputerMove: String, // For PvP: player2Move, For PvE: computerMove
        environmentalModifier: String,
        criticalHitTypeP1: String,
        criticalHitTypeP2OrComputer: String, // For PvP: player2Crit, For PvE: (can be "None" or flavor)
        winnings: UFix64
    )
    event StakeReturned(player: Address, amount: UFix64)
    event GameError(gameId: UInt64?, player: Address?, message: String)

    //-----------------------------------------------------------------------
    // Contract State & Constants
    //-----------------------------------------------------------------------

    access(all) let PlayerVaultStoragePath: StoragePath
    access(all) let GamePlayerPublicPath: PublicPath // For players to interact with games they are in

    access(all) let Elements: {String: String} // Defines what beats what

    access(all) enum GameStatus: UInt8 {
        access(all) case active // PvP: Game created, waiting for player 2. PvE: Should skip this, created as awaitingRandomness.
        access(all) case awaitingMoves // PvP: Both players joined, waiting for moves.
        access(all) case awaitingRandomness // Moves made (or game started for PvE), committed to randomness
        access(all) case resolved // Randomness received, game outcome determined, payouts (if any) done
    }

    access(all) enum GameMode: UInt8 {
        access(all) case PvPStaked
        access(all) case PvEPractice
    }

    // Structure for an individual game
    access(all) resource Game { // Using a resource for easier management of vaults and state
        access(all) let gameId: UInt64
        access(all) let mode: GameMode
        access(all) let player1: Address
        access(self) var player2: Address? // Only settable internally by the contract logic
        
        access(self) var player1Move: String? // "Fuego", "Agua", "Planta"
        access(self) var player2Move: String? // "Fuego", "Agua", "Planta"
        access(self) var computerMove: String? // Only for PvE
        
        access(all) let stakeAmount: UFix64
        access(self) let player1Vault: @FungibleToken.Vault? // Optional for PvE
        access(self) var player2Vault: @FungibleToken.Vault? // Optional, only for PvP
        
        access(all) var status: GameStatus
        access(self) var committedBlockHeight: UInt64? // Block height for commit-reveal
        
        // Fields to store results after reveal, before being part of a public struct
        access(self) var finalEnvironmentalModifier: String?
        access(self) var finalCriticalHitTypePlayer1: String?
        access(self) var finalCriticalHitTypeP2OrComputer: String? // PvP: P2 crit, PvE: (flavor / None)
        access(self) var finalWinner: Address?

        init(gameId: UInt64, mode: GameMode, player1: Address, player1StakeVault: @FungibleToken.Vault?, initialStakeAmount: UFix64, player1InitialMove: String?) {
            self.gameId = gameId
            self.mode = mode
            self.player1 = player1
            self.player2 = nil
            self.stakeAmount = initialStakeAmount
            self.player1Vault <- player1StakeVault // Will be nil if PvE
            self.player2Vault <- nil
            self.committedBlockHeight = nil
            self.finalEnvironmentalModifier = nil
            self.finalCriticalHitTypePlayer1 = nil
            self.finalCriticalHitTypeP2OrComputer = nil
            self.finalWinner = nil
            self.computerMove = nil

            if self.mode == GameMode.PvPStaked {
                self.player1Move = nil // Player 1 makes move via transaction
                self.status = GameStatus.active // Waiting for player 2
            } else { // PvEPractice
                assert(player1InitialMove != nil, message: "Player 1 initial move required for PvE practice game")
                self.player1Move = player1InitialMove!
                self.status = GameStatus.awaitingMoves // Will immediately transition to awaitingRandomness by commitToRandomness
            }
        }

        access(all) fun addPlayer2(player2: Address, player2StakeVault: @FungibleToken.Vault) {
            pre {
                self.mode == GameMode.PvPStaked : "Cannot add player 2 to a practice game"
                self.status == GameStatus.active : "Game not active for joining"
                self.player2 == nil : "Game already has two players"
                player2StakeVault.balance == self.stakeAmount : "Player 2 stake amount does not match"
                self.player2Vault == nil : "Player 2 vault already exists"
            }
            self.player2 = player2
            self.player2Vault <-! player2StakeVault
            self.status = GameStatus.awaitingMoves
        }

        access(all) fun setPlayerMove(player: Address, move: String): Bool { // Returns true if ready to commit
            pre {
                self.mode == GameMode.PvPStaked : "Player moves are set via transactions only for PvP games"
                move == "Fuego" || move == "Agua" || move == "Planta" : "Invalid element choice"
                self.status == GameStatus.awaitingMoves : "Game not awaiting moves"
            }
            var readyToCommit = false
            if player == self.player1 {
                if self.player1Move != nil { panic("Player 1 has already made a move") }
                self.player1Move = move
            } else if player == self.player2 {
                if self.player2Move != nil { panic("Player 2 has already made a move") }
                self.player2Move = move
            } else {
                panic("Player is not part of this game")
            }

            if self.player1Move != nil && self.player2Move != nil {
                readyToCommit = true
            }
            return readyToCommit
        }

        // Internal function to finalize game state after randomness is revealed
        access(contract) fun finalizeResolution(
            environmentalModifier: String,
            criticalHitTypeP1: String,
            criticalHitTypeP2OrComputer: String,
            winnerAddress: Address?,
            loserAddress: Address?,
            winningsToWinner: UFix64,
            computerGeneratedMove: String?
        ) {
            pre {
                self.status == GameStatus.awaitingRandomness : "Game not awaiting randomness to be resolved"
            }
            self.finalEnvironmentalModifier = environmentalModifier
            self.finalCriticalHitTypePlayer1 = criticalHitTypeP1
            self.finalCriticalHitTypeP2OrComputer = criticalHitTypeP2OrComputer
            self.finalWinner = winnerAddress
            self.status = GameStatus.resolved
            if self.mode == GameMode.PvEPractice {
                self.computerMove = computerGeneratedMove
            }

            if self.mode == GameMode.PvPStaked {
                // Payout logic only for PvPStaked games
                let p1Vault <- self.player1Vault!
                var p2VaultOpt = self.player2Vault
                if p2VaultOpt != nil {
                    self.player2Vault <- nil
                }

                if winnerAddress == self.player1 {
                    let winnerReceiver = getAccount(self.player1).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                        ?? panic("Cannot borrow receiver for player 1")
                    winnerReceiver.deposit(from: <- p1Vault)
                    if p2VaultOpt != nil {
                        winnerReceiver.deposit(from: <- p2VaultOpt!)
                    }
                } else if winnerAddress == self.player2 {
                    let winnerReceiver = getAccount(self.player2!).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                        ?? panic("Cannot borrow receiver for player 2")
                    if p2VaultOpt != nil {
                        winnerReceiver.deposit(from: <- p2VaultOpt!)
                    }
                    winnerReceiver.deposit(from: <- p1Vault)
                } else { // Draw
                    let p1Receiver = getAccount(self.player1).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                        ?? panic("Cannot borrow receiver for player 1 on draw")
                    p1Receiver.deposit(from: <- p1Vault)
                    emit StakeReturned(player: self.player1, amount: self.stakeAmount)
                    if self.player2 != nil && p2VaultOpt != nil {
                        let p2Receiver = getAccount(self.player2!).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                            ?? panic("Cannot borrow receiver for player 2 on draw")
                        p2Receiver.deposit(from: <- p2VaultOpt!)
                        emit StakeReturned(player: self.player2!, amount: self.stakeAmount)
                    }
                }
            } else { // PvEPractice - destroy dummy vaults if they existed (they shouldn't for PvE)
                if let vault1 = self.player1Vault {
                    destroy vault1
                }
                if let vault2 = self.player2Vault {
                     destroy vault2
                }
            }
            
            var resolvedPlayerOrComputerMove = ""
            if self.mode == GameMode.PvPStaked {
                resolvedPlayerOrComputerMove = self.player2Move!
            } else {
                resolvedPlayerOrComputerMove = self.computerMove!
            }

            emit GameResolved(
                gameId: self.gameId,
                mode: self.mode.toString(),
                winner: winnerAddress,
                loser: loserAddress,
                player1Move: self.player1Move!,
                playerOrComputerMove: resolvedPlayerOrComputerMove,
                environmentalModifier: environmentalModifier,
                criticalHitTypeP1: criticalHitTypeP1,
                criticalHitTypeP2OrComputer: criticalHitTypeP2OrComputer,
                winnings: winningsToWinner // This is the total pot, or P1's perspective if solo.
            )
        }
        
        // Commit to using randomness from the current block
        access(contract) fun commitToRandomness() {
            let condition = (self.mode == GameMode.PvPStaked && self.status == GameStatus.awaitingMoves && self.player1Move != nil && self.player2Move != nil) 
                         || (self.mode == GameMode.PvEPractice && self.status == GameStatus.awaitingMoves && self.player1Move != nil)
            assert(condition, message: "Game not ready/already committed")
            
            self.committedBlockHeight = getCurrentBlock().height
            self.status = GameStatus.awaitingRandomness
            emit GameCommittedToRandomness(gameId: self.gameId, commitBlockHeight: self.committedBlockHeight!)
        }
    }

    // Mapping of game IDs to Games
    access(all) var games: @{UInt64: Game}
    access(all) var nextGameId: UInt64

    //-----------------------------------------------------------------------
    // Contract Functions
    //-----------------------------------------------------------------------

    // This interface will be implemented by users to interact with their games
    access(all) resource interface GamePlayer {
        fun getGameDetails(gameId: UInt64): GameDetails?
        fun makeMove(gameId: UInt64, element: String)
        fun revealOutcome(gameId: UInt64) // New function for player to trigger reveal
    }

    // Struct to return game details safely
    access(all) struct GameDetails {
        access(all) let gameId: UInt64
        access(all) let mode: GameMode
        access(all) let player1: Address
        access(all) let player2: Address?
        access(all) let player1MoveMade: Bool
        access(all) let player2MoveMade: Bool
        access(all) let computerMove: String?
        access(all) let stakeAmount: UFix64
        access(all) let status: GameStatus 
        access(all) let committedBlockHeight: UInt64?
        access(all) let environmentalModifier: String?
        access(all) let criticalHitTypePlayer1: String?
        access(all) let criticalHitTypeP2OrComputer: String?
        access(all) let winner: Address?

        init(gameRef: &Game) {
            self.gameId = gameRef.gameId
            self.mode = gameRef.mode
            self.player1 = gameRef.player1
            self.player2 = gameRef.player2
            self.player1MoveMade = gameRef.player1Move != nil
            self.player2MoveMade = gameRef.player2Move != nil
            self.computerMove = gameRef.computerMove
            self.stakeAmount = gameRef.stakeAmount
            self.status = gameRef.status
            self.committedBlockHeight = gameRef.committedBlockHeight
            self.environmentalModifier = gameRef.finalEnvironmentalModifier
            self.criticalHitTypePlayer1 = gameRef.finalCriticalHitTypePlayer1
            self.criticalHitTypeP2OrComputer = gameRef.finalCriticalHitTypeP2OrComputer
            self.winner = gameRef.finalWinner
        }
    }


    // Actual resource that players will store to interact
    access(all) resource PlayerAgent: GamePlayer {
        access(self) let owner: Address

        init() {
            self.owner = self.account.address
        }

        fun getGameDetails(gameId: UInt64): GameDetails? {
            if let gameRef = ElementalStrikers.games[gameId] {
                // Allow anyone to see game details for now, or restrict to players
                return GameDetails(gameRef: gameRef)
            }
            return nil
        }

        fun makeMove(gameId: UInt64, element: String) {
            pre {
                element == "Fuego" || element == "Agua" || element == "Planta" : "Invalid element choice provided"
                ElementalStrikers.games[gameId] != nil : "Game does not exist"
            }
            let gameRef = ElementalStrikers.games[gameId] ?? panic("Game not found after check, critical error")
            
            if gameRef.status != GameStatus.awaitingMoves {
                emit GameError(gameId: gameId, player: self.owner, message: "Game not awaiting moves.")
                panic("Game not awaiting moves.")
            }
            if self.owner != gameRef.player1 && self.owner != gameRef.player2 {
                emit GameError(gameId: gameId, player: self.owner, message: "Player is not part of this game.")
                panic("Player is not part of this game")
            }
            
            let readyToCommit = gameRef.setPlayerMove(player: self.owner, move: element)
            emit MoveMade(gameId: gameId, player: self.owner, element: element)

            if readyToCommit {
                gameRef.commitToRandomness()
            }
        }

        // New function for player to trigger reveal
        fun revealOutcome(gameId: UInt64) {
            ElementalStrikers.revealGameOutcome(gameId: gameId, callingPlayerAddress: self.owner)
        }
    }

    fun createPlayerAgent(): @PlayerAgent {
        return <- create PlayerAgent()
    }


    fun createGame(player1StakeVault: @FungibleToken.Vault, initialStakeAmount: UFix64): UInt64 {
        pre {
            player1StakeVault.balance == initialStakeAmount : "Initial stake amount does not match vault balance."
            // Placeholder for FungibleToken.Receiver capability check if not directly taking vault
        }
        
        let player1Address = player1StakeVault.owner?.address ?? panic("Cannot determine owner of the stake vault")
        let gameId = self.nextGameId
        
        let newGame <- Game(
            gameId: gameId,
            mode: GameMode.PvPStaked,
            player1: player1Address,
            player1StakeVault: <-player1StakeVault,
            initialStakeAmount: initialStakeAmount,
            player1InitialMove: nil
        )
        
        let oldGame <- self.games[gameId] <- newGame // Store the new game resource
        destroy oldGame // Destroy the nil or old resource at that key

        self.nextGameId = self.nextGameId + 1
        emit GameCreated(gameId: gameId, player1: player1Address, stakeAmount: initialStakeAmount, mode: GameMode.PvPStaked.toString())
        return gameId
    }

    fun joinGame(gameId: UInt64, player2StakeVault: @FungibleToken.Vault) {
        pre {
            self.games[gameId] != nil : "Game with this ID does not exist."
            // player2StakeVault.owner != nil : "Player 2 vault has no owner." // owner is Address?, so this is good
        }
        let game = self.games[gameId] ?? panic("Game not found, though existence was checked.")
        
        if game.player2 != nil {
            emit GameError(gameId: gameId, player: player2StakeVault.owner?.address, message: "Game is already full.")
            panic("Game is already full")
        }
        if player2StakeVault.balance != game.stakeAmount {
            emit GameError(gameId: gameId, player: player2StakeVault.owner?.address, message: "Stake amount does not match game requirement.")
            panic("Stake amount does not match game requirement")
        }
        let player2Address = player2StakeVault.owner?.address ?? panic("Player 2 vault owner not found")

        game.addPlayer2(player2: player2Address, player2StakeVault: <-player2StakeVault)
        emit GameJoined(gameId: gameId, player2: player2Address)
    }

    // Public function to trigger randomness reveal and game resolution
    fun revealGameOutcome(gameId: UInt64, callingPlayerAddress: Address) {
        let game = self.games[gameId] ?? panic("Game to resolve not found")
        if game.status != GameStatus.awaitingRandomness {
            emit GameError(gameId: gameId, player: callingPlayerAddress, message: "Game not awaiting randomness.")
            return
        }
        let commitBlockHeight = game.committedBlockHeight ?? panic("Commit block height missing")
        
        var source: UInt64
        if Test.isTesting() && self.nextTestRandomSource != nil {
            source = self.nextTestRandomSource!
            self.nextTestRandomSource = nil // Consume the test source
        } else {
            source = RandomBeaconHistory.getSourceOfRandomness(atBlockHeight: commitBlockHeight)
                ?? panic("Failed source for block ".concat(commitBlockHeight.toString()))
        }

        let prng = PRNG(seed: source, salt: UInt64(gameId))
        
        let envRandom = prng.next()
        let critP1Random = prng.next()
        // For PvP, P2's crit is generated here. For PvE, computer's move is generated here.
        let thirdRandomVal = prng.next() 

        let environment = self.deriveEnvironmentFromRandom(envRandom)
        let critP1 = self.deriveHitEffectFromRandom(critP1Random)
        
        var winner: Address? = nil
        var loser: Address? = nil
        var winningsForWinner: UFix64 = 0.0
        var critP2OrComputer = "None"
        var finalPlayerOrComputerMove = ""

        let p1Move = game.player1Move!

        if game.mode == GameMode.PvPStaked {
            finalPlayerOrComputerMove = game.player2Move!
            critP2OrComputer = self.deriveHitEffectFromRandom(thirdRandomVal)

            if p1Move == finalPlayerOrComputerMove { // Elemental Draw
                // Apply environmental tie-breaker for PvP
                if environment == "Día Soleado" && (p1Move == "Fuego" || finalPlayerOrComputerMove == "Fuego") {
                    winner = (p1Move == "Fuego") ? game.player1 : game.player2
                    loser = (p1Move == "Fuego") ? game.player2 : game.player1
                } else if environment == "Lluvia Torrencial" && (p1Move == "Agua" || finalPlayerOrComputerMove == "Agua") {
                    winner = (p1Move == "Agua") ? game.player1 : game.player2
                    loser = (p1Move == "Agua") ? game.player2 : game.player1
                } else if environment == "Tierra Fértil" && (p1Move == "Planta" || finalPlayerOrComputerMove == "Planta") {
                    winner = (p1Move == "Planta") ? game.player1 : game.player2
                    loser = (p1Move == "Planta") ? game.player2 : game.player1
                } else {
                    // Still a draw if environment doesn't break the tie
                    winner = nil
                    loser = nil
                }
            } else if (self.Elements[p1Move] == finalPlayerOrComputerMove) { // Player 1 wins by element
                winner = game.player1
                loser = game.player2
            } else { // Player 2 wins by element
                winner = game.player2
                loser = game.player1
            }
            // Determine winnings for PvP
            if winner != nil {
                winningsForWinner = game.stakeAmount * 2.0
            } else {
                winningsForWinner = 0.0 // Stakes returned in finalizeResolution for a draw
            }

        } else { // GameMode.PvEPractice
            finalPlayerOrComputerMove = self.deriveElementFromRandom(thirdRandomVal)
            // critP2OrComputer remains "None" for PvE flavor

            if p1Move == finalPlayerOrComputerMove { // Elemental Draw
                // Apply environmental tie-breaker for PvE
                if environment == "Día Soleado" && p1Move == "Fuego" {
                    winner = game.player1
                } else if environment == "Lluvia Torrencial" && p1Move == "Agua" {
                    winner = game.player1
                } else if environment == "Tierra Fértil" && p1Move == "Planta" {
                    winner = game.player1
                } else if environment == "Día Soleado" && finalPlayerOrComputerMove == "Fuego" { 
                    // Computer wins tie break, no specific winner address needed for PvE loser if computer wins
                    loser = game.player1
                } else if environment == "Lluvia Torrencial" && finalPlayerOrComputerMove == "Agua" {
                    loser = game.player1
                } else if environment == "Tierra Fértil" && finalPlayerOrComputerMove == "Planta" {
                    loser = game.player1
                } else {
                    // Still a draw
                    winner = nil // Explicitly nil for PvE draw
                    loser = nil  // No specific loser if it's a pure draw against computer
                }
            } else if (self.Elements[p1Move] == finalPlayerOrComputerMove) { // Player 1 wins by element
                winner = game.player1
            } else { // Computer wins by element
                loser = game.player1
            }
            winningsForWinner = 0.0 // No actual winnings in PvE
        }
        
        game.finalizeResolution(
            environmentalModifier: environment, criticalHitTypeP1: critP1, criticalHitTypeP2OrComputer: critP2OrComputer,
            winnerAddress: winner, loserAddress: loser, winningsToWinner: winningsForWinner, computerGeneratedMove: (game.mode == GameMode.PvEPractice ? finalPlayerOrComputerMove : nil)
        )
    }

    // --- Placeholder PRNG-dependent functions ---
    // Replace with proper derivation from a PRNG sequence
    access(contract) fun deriveEnvironmentFromRandom(val: UInt64): String {
        let options = ["None", "Día Soleado", "Lluvia Torrencial", "Tierra Fértil"]
        return options[Int(val % UInt64(options.length))]
    }
    access(contract) fun deriveHitEffectFromRandom(val: UInt64): String {
        let options = ["None", "Critical", "Partial"]
        return options[Int(val % UInt64(options.length))]
    }
    access(contract) fun deriveElementFromRandom(val: UInt64): String {
        let options = ["Fuego", "Planta", "Agua"]
        return options[Int(val % UInt64(options.length))]
    }
    // --- End Placeholder ---

    // Add this new public function:
    fun getGamePublicDetails(gameId: UInt64): GameDetails? {
        if let gameRef = self.games[gameId] {
            return GameDetails(gameRef: gameRef)
        }
        return nil
    }

    // --- Test-only state and functions ---
    access(all) var nextTestRandomSource: UInt64? // Only used if Test.isTesting()
    fun setNextTestRandomSource(source: UInt64) {
        if !Test.isTesting() {
            panic("This function can only be called in a testing environment.")
        }
        self.nextTestRandomSource = source
    }
    // --- End Test-only --- 

    //-----------------------------------------------------------------------
    // Initialization
    //-----------------------------------------------------------------------
    init() {
        self.PlayerVaultStoragePath = /storage/ElementalStrikersPlayerVault01 // Increment or make unique for testing
        self.GamePlayerPublicPath = /public/ElementalStrikersGamePlayer01
        self.games <- {} // Initialize the dictionary for resources
        self.nextGameId = 1

        // Fuego > Planta > Agua > Fuego
        self.Elements = {
            "Fuego": "Planta",
            "Planta": "Agua",
            "Agua": "Fuego"
        }
        // Initialize test-only variable
        self.nextTestRandomSource = nil
        emit ContractInitialized()
    }
} 