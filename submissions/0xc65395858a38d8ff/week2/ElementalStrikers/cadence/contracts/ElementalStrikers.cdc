// ElementalStrikers.cdc

// Standard Flow contract imports
import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import RandomBeaconHistory from "RandomBeaconHistory"

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
    access(all) event ContractInitialized()
    access(all) event GameCreated(gameId: UInt64, player1: Address, stakeAmount: UFix64, mode: UInt8)
    access(all) event GameJoined(gameId: UInt64, player2: Address)
    // Using String for element for simplicity, could be UInt8 for Fuego=0, Agua=1, Planta=2
    access(all) event MoveMade(gameId: UInt64, player: Address, element: String)
    access(all) event GameCommittedToRandomness(gameId: UInt64, commitBlockHeight: UInt64)
    access(all) event GameResolved(
        gameId: UInt64,
        mode: UInt8,
        winner: Address?,
        loser: Address?,
        player1Move: String,
        playerOrComputerMove: String, // For PvP: player2Move, For PvE: computerMove
        environmentalModifier: String,
        criticalHitTypeP1: String,
        criticalHitTypeP2OrComputer: String, // For PvP: player2Crit, For PvE: (can be "None" or flavor)
        winnings: UFix64
    )
    access(all) event StakeReturned(player: Address, amount: UFix64)
    access(all) event GameError(gameId: UInt64?, player: Address?, message: String)
    access(all) event RoundResolved(
        gameId: UInt64,
        roundNumber: UInt64,
        player1Move: String,
        player2Move: String?, // Player 2 or Computer move
        roundWinner: Address?,
        environmentalModifier: String,
        criticalHitTypeP1: String,
        criticalHitTypeP2OrComputer: String,
        player1Score: UInt64,
        player2Score: UInt64,
        isGameOver: Bool
    )
    // Events for Double or Nothing
    access(all) event DoubleOffered(gameId: UInt64, offeredBy: Address, newTotalStakePerPlayer: UFix64)
    access(all) event DoubleOfferResponded(gameId: UInt64, accepted: Bool, newTotalStakePerPlayer: UFix64?)
    access(all) event GameForfeitedByRejectingDouble(gameId: UInt64, winner: Address, loser: Address, winnings: UFix64)

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
        access(all) case awaitingDoubleOffer // New status: After a round ends (game not over), perdedor de la ronda puede ofrecer doblar.
        access(all) case awaitingDoubleResponse // New status: After an offer to double is made.
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
        access(all) var player2: Address? 
        
        access(all) var player1Move: String? 
        access(all) var player2Move: String? 
        access(all) var computerMove: String? 
        
        access(all) let stakeAmount: UFix64 // Original stake per player
        access(all) var currentStakeAmount: UFix64 // Current total stake per player (can be doubled)
        access(all) var player1Vault: @{FungibleToken.Vault}? 
        access(all) var player2Vault: @{FungibleToken.Vault}? 
        // Vaults for additional stake if double is accepted
        access(all) var player1ExtraStakeVault: @{FungibleToken.Vault}?
        access(all) var player2ExtraStakeVault: @{FungibleToken.Vault}?
        
        access(all) var status: GameStatus
        access(all) var committedBlockHeight: UInt64? 
        
        // Fields to store results after reveal, before being part of a public struct
        access(all) var finalEnvironmentalModifier: String? 
        access(all) var finalCriticalHitTypePlayer1: String? 
        access(all) var finalCriticalHitTypeP2OrComputer: String? 
        access(all) var finalWinner: Address? 

        // New fields for multi-round games
        access(all) let initialMaxWins: UInt64 // Max wins needed initially
        access(all) var currentMaxWins: UInt64 // Max wins needed currently (can increase)
        access(all) var currentRound: UInt64 // The current round number (starts at 1)
        access(all) var player1Score: UInt64 // Player 1's score
        access(all) var player2Score: UInt64 // Player 2's score

        // New fields for "double or nothing"
        access(all) var doubleOfferedBy: Address?
        access(all) var lastRoundWinner: Address?
        access(all) var lastRoundLoser: Address?

        init(gameId: UInt64, mode: GameMode, player1: Address, player1StakeVault: @{FungibleToken.Vault}?, initialStakeAmount: UFix64, player1InitialMove: String?, initialMaxWins: UInt64) { // Renamed totalRounds to initialMaxWins
            self.gameId = gameId
            self.mode = mode
            self.player1 = player1
            self.player2 = nil
            self.stakeAmount = initialStakeAmount
            self.currentStakeAmount = initialStakeAmount // Initialize current stake
            self.player1Vault <- player1StakeVault
            self.player2Vault <- nil
            self.player1ExtraStakeVault <- nil // Initialize extra stake vaults
            self.player2ExtraStakeVault <- nil // Initialize extra stake vaults
            self.committedBlockHeight = nil
            self.finalEnvironmentalModifier = nil
            self.finalCriticalHitTypePlayer1 = nil
            self.finalCriticalHitTypeP2OrComputer = nil
            self.finalWinner = nil
            self.computerMove = nil
            self.player2Move = nil // Inicialización añadida
            
            // Initialize new fields
            self.initialMaxWins = initialMaxWins // Store initial max wins
            self.currentMaxWins = initialMaxWins // Set current max wins to initial
            self.currentRound = 1
            self.player1Score = 0
            self.player2Score = 0

            // Initialize double or nothing fields
            self.doubleOfferedBy = nil
            self.lastRoundWinner = nil
            self.lastRoundLoser = nil

            if self.mode == GameMode.PvPStaked {
                self.player1Move = nil // Player 1 makes move via transaction
                self.status = GameStatus.active // Waiting for player 2
            } else { // PvEPractice
                assert(player1InitialMove != nil, message: "Player 1 initial move required for PvE practice game")
                self.player1Move = player1InitialMove!
                self.status = GameStatus.awaitingMoves // Will immediately transition to awaitingRandomness by commitToRandomness
                // Note: PvE practice games might not make sense with multiple rounds/scoring in this structure
                // but we add fields for consistency. We can revisit PvE multi-round later if needed.
            }
        }

        // New helper functions for multi-round state management
        access(contract) fun incrementPlayer1Score() {
            self.player1Score = self.player1Score + 1
        }

        access(contract) fun incrementPlayer2Score() {
            self.player2Score = self.player2Score + 1
        }

        access(contract) fun advanceRound() {
            self.currentRound = self.currentRound + 1
            self.player1Move = nil
            self.player2Move = nil // Reset moves for next round
            self.committedBlockHeight = nil // Reset commitment for next round
            self.status = GameStatus.awaitingMoves // Go back to awaiting moves
            // DO NOT reset currentMaxWins here
        }

        // Add setter methods for fields that need to be modified
        access(contract) fun setLastRoundWinner(winner: Address?) {
            self.lastRoundWinner = winner
        }

        access(contract) fun setLastRoundLoser(loser: Address?) {
            self.lastRoundLoser = loser
        }

        access(all) fun setStatus(newStatus: GameStatus) {
            self.status = newStatus
        }

        access(all) fun setDoubleOfferedBy(offerer: Address?) {
            self.doubleOfferedBy = offerer
        }

        access(all) fun offerDoubleOrNothing(offererAddress: Address) {
            pre {
                self.status == GameStatus.awaitingDoubleOffer : "Game is not awaiting a double offer."
                offererAddress == self.lastRoundLoser : "Only the loser of the game can offer to double."
                // The check for the offerer's balance to cover the additional stake
                // is done in the transaction's prepare phase, as the contract cannot directly access account balances.
            }

            self.setDoubleOfferedBy(offerer: offererAddress)
            self.setStatus(newStatus: GameStatus.awaitingDoubleResponse)

            let newTotalStakePerPlayer = self.currentStakeAmount * 2.0 // This is the stake *if* the double is accepted.

            emit DoubleOffered(gameId: self.gameId, offeredBy: offererAddress, newTotalStakePerPlayer: newTotalStakePerPlayer)
            log("Player ".concat(offererAddress.toString()).concat(" offered to double the stake for game ").concat(self.gameId.toString()).concat(". New potential stake per player if accepted: ").concat(newTotalStakePerPlayer.toString()))
        }

        access(all) fun addPlayer2(player2: Address, player2StakeVault: @{FungibleToken.Vault}) {
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
                // Handle resources one by one to avoid resource loss

                if winnerAddress == self.player1 {
                    let winnerReceiver = getAccount(self.player1).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                        ?? panic("Cannot borrow receiver for player 1")
                    
                    // Handle player1Vault
                    if self.player1Vault != nil {
                        let movedVault <- self.player1Vault <- nil
                        let vault <- movedVault!
                        winnerReceiver.deposit(from: <-vault)
                    }
                    
                    // Handle player2Vault
                    if self.player2Vault != nil {
                        let movedVault <- self.player2Vault <- nil
                        let vault <- movedVault!
                        winnerReceiver.deposit(from: <-vault)
                    }
                    
                    // Handle player1ExtraStakeVault
                    if self.player1ExtraStakeVault != nil {
                        let movedVault <- self.player1ExtraStakeVault <- nil
                        let vault <- movedVault!
                        winnerReceiver.deposit(from: <-vault)
                    }
                    
                    // Handle player2ExtraStakeVault
                    if self.player2ExtraStakeVault != nil {
                        let movedVault <- self.player2ExtraStakeVault <- nil
                        let vault <- movedVault!
                        winnerReceiver.deposit(from: <-vault)
                    }

                } else if winnerAddress == self.player2 && self.player2 != nil {
                    let winnerReceiver = getAccount(self.player2!).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                        ?? panic("Cannot borrow receiver for player 2")

                    // Handle player1Vault
                    if self.player1Vault != nil {
                        let movedVault <- self.player1Vault <- nil
                        let vault <- movedVault!
                        winnerReceiver.deposit(from: <-vault)
                    }
                    
                    // Handle player2Vault
                    if self.player2Vault != nil {
                        let movedVault <- self.player2Vault <- nil
                        let vault <- movedVault!
                        winnerReceiver.deposit(from: <-vault)
                    }
                    
                    // Handle player1ExtraStakeVault
                    if self.player1ExtraStakeVault != nil {
                        let movedVault <- self.player1ExtraStakeVault <- nil
                        let vault <- movedVault!
                        winnerReceiver.deposit(from: <-vault)
                    }
                    
                    // Handle player2ExtraStakeVault
                    if self.player2ExtraStakeVault != nil {
                        let movedVault <- self.player2ExtraStakeVault <- nil
                        let vault <- movedVault!
                        winnerReceiver.deposit(from: <-vault)
                    }
                } else { // Draw - cada jugador recibe su stake (base + extra) de vuelta
                    // Handle player1Vault
                    if self.player1Vault != nil {
                        let p1Receiver = getAccount(self.player1).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                            ?? panic("Cannot borrow receiver for player 1 on draw")
                        
                        let movedVault <- self.player1Vault <- nil
                        let vault <- movedVault!
                        let amount = vault.balance
                        p1Receiver.deposit(from: <-vault)
                        emit StakeReturned(player: self.player1, amount: amount)
                    }
                    
                    // Handle player1ExtraStakeVault
                    if self.player1ExtraStakeVault != nil {
                        let p1Receiver = getAccount(self.player1).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                            ?? panic("Cannot borrow receiver for player 1 (extra stake) on draw")
                        
                        let movedVault <- self.player1ExtraStakeVault <- nil
                        let vault <- movedVault!
                        p1Receiver.deposit(from: <-vault)
                    }
                    
                    // Handle player2 vaults if player2 exists
                    if self.player2 != nil {
                        // Handle player2Vault
                        if self.player2Vault != nil {
                            let p2Receiver = getAccount(self.player2!).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                                ?? panic("Cannot borrow receiver for player 2 on draw")
                            
                            let movedVault <- self.player2Vault <- nil
                            let vault <- movedVault!
                            let amount = vault.balance
                            p2Receiver.deposit(from: <-vault)
                            emit StakeReturned(player: self.player2!, amount: amount)
                        }
                        
                        // Handle player2ExtraStakeVault
                        if self.player2ExtraStakeVault != nil {
                            let p2Receiver = getAccount(self.player2!).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                                ?? panic("Cannot borrow receiver for player 2 (extra stake) on draw")
                            
                            let movedVault <- self.player2ExtraStakeVault <- nil
                            let vault <- movedVault!
                            p2Receiver.deposit(from: <-vault)
                        }
                    }
                }
            } else { // PvEPractice - destroy all vaults if they exist
                // Handle player1Vault
                if self.player1Vault != nil {
                    let movedVault <- self.player1Vault <- nil
                    let vault <- movedVault!
                    destroy vault
                }
                
                // Handle player2Vault
                if self.player2Vault != nil {
                    let movedVault <- self.player2Vault <- nil
                    let vault <- movedVault!
                    destroy vault
                }
                
                // Handle player1ExtraStakeVault
                if self.player1ExtraStakeVault != nil {
                    let movedVault <- self.player1ExtraStakeVault <- nil
                    let vault <- movedVault!
                    destroy vault
                }
                
                // Handle player2ExtraStakeVault
                if self.player2ExtraStakeVault != nil {
                    let movedVault <- self.player2ExtraStakeVault <- nil
                    let vault <- movedVault!
                    destroy vault
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
                mode: self.mode.rawValue,
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
        access(all) fun getGameDetails(gameId: UInt64): GameDetails?
        access(all) fun makeMove(gameId: UInt64, element: String)
        access(all) fun revealOutcome(gameId: UInt64)
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
        access(all) let stakeAmount: UFix64 // Original stake
        access(all) var currentStakeAmount: UFix64 // Current stake, could be doubled
        access(all) let status: GameStatus 
        access(all) let committedBlockHeight: UInt64?
        access(all) let environmentalModifier: String?
        access(all) let criticalHitTypePlayer1: String?
        access(all) let criticalHitTypeP2OrComputer: String?
        access(all) let winner: Address?
        access(all) var doubleOfferedBy: Address? // Who offered to double
        access(all) let maxWins: UInt64 // Current max wins for the game

        init(gameRef: &Game) {
            self.gameId = gameRef.gameId
            self.player1 = gameRef.player1
            self.player2 = gameRef.player2
            self.player1MoveMade = gameRef.player1Move != nil
            self.player2MoveMade = gameRef.player2Move != nil
            self.computerMove = gameRef.computerMove
            self.stakeAmount = gameRef.stakeAmount
            self.currentStakeAmount = gameRef.currentStakeAmount // Add current stake
            self.status = gameRef.status
            self.committedBlockHeight = gameRef.committedBlockHeight
            self.environmentalModifier = gameRef.finalEnvironmentalModifier
            self.criticalHitTypePlayer1 = gameRef.finalCriticalHitTypePlayer1
            self.criticalHitTypeP2OrComputer = gameRef.finalCriticalHitTypeP2OrComputer
            self.winner = gameRef.finalWinner
            self.mode = gameRef.mode
            self.doubleOfferedBy = gameRef.doubleOfferedBy // Add double offered by
            self.maxWins = gameRef.currentMaxWins // Reflect current max wins
        }
    }


    // Actual resource that players will store to interact
    access(all) resource PlayerAgent: GamePlayer {
        access(self) let ownerAddress: Address // Renamed from owner to avoid conflict with built-in self.owner for resource account
        init(account: &Account) { self.ownerAddress = account.address } // Use passed account to get address

        access(all) fun getGameDetails(gameId: UInt64): GameDetails? {
            if let gameRef = ElementalStrikers.borrowGame(gameId: gameId) { // Use borrowGame
                return GameDetails(gameRef: gameRef)
            }
            return nil
        }

        access(all) fun makeMove(gameId: UInt64, element: String) {
            pre {
                element == "Fuego" || element == "Agua" || element == "Planta" : "Invalid element choice provided"
                ElementalStrikers.games[gameId] != nil : "Game does not exist"
            }
            let gameRef = &ElementalStrikers.games[gameId] as &Game? ?? panic("Game not found after check, critical error")
            
            if gameRef.status != GameStatus.awaitingMoves {
                emit GameError(gameId: gameId, player: self.ownerAddress, message: "Game not awaiting moves.")
                panic("Game not awaiting moves.")
            }
            if self.ownerAddress != gameRef.player1 && self.ownerAddress != gameRef.player2 {
                emit GameError(gameId: gameId, player: self.ownerAddress, message: "Player is not part of this game.")
                panic("Player is not part of this game")
            }
            
            let readyToCommit = gameRef.setPlayerMove(player: self.ownerAddress, move: element)
            emit MoveMade(gameId: gameId, player: self.ownerAddress, element: element)

            if readyToCommit {
                gameRef.commitToRandomness()
            }
        }

        // New function for player to trigger reveal
        access(all) fun revealOutcome(gameId: UInt64) {
            ElementalStrikers.revealGameOutcome(gameId: gameId, callingPlayerAddress: self.ownerAddress)
        }
    }

    access(all) fun createPlayerAgent(account: &Account): @PlayerAgent {
        return <- create PlayerAgent(account: account)
    }


    access(all) fun createGame(player1Address: Address, player1StakeVault: @{FungibleToken.Vault}, initialStakeAmount: UFix64, initialMaxWins: UInt64): UInt64 { // Renamed totalRounds parameter
        pre {
            player1StakeVault.balance == initialStakeAmount : "Initial stake amount does not match vault balance."
            initialMaxWins > 0 : "Initial max wins must be greater than zero." // Updated check
        }
        
        // No longer needed as player1Address is a parameter:
        // let player1Address = player1StakeVault.owner?.address ?? panic("Cannot determine owner of the stake vault")

        let gameId = self.nextGameId
        
        let newGame <- create Game(
            gameId: gameId,
            mode: GameMode.PvPStaked,
            player1: player1Address, // Use the passed player1Address
            player1StakeVault: <-player1StakeVault,
            initialStakeAmount: initialStakeAmount,
            player1InitialMove: nil,
            initialMaxWins: initialMaxWins // Pass the new parameter to the constructor
        )

        let oldGame <- self.games[gameId] <- newGame
        destroy oldGame

        self.nextGameId = self.nextGameId + 1
        emit GameCreated(gameId: gameId, player1: player1Address, stakeAmount: initialStakeAmount, mode: GameMode.PvPStaked.rawValue)

        return gameId
    }

    // Creates a new PvE practice game
    access(all) fun createPracticeGame(player1Address: Address, player1Choice: String): UInt64 {
        pre {
            player1Choice == "Fuego" || player1Choice == "Agua" || player1Choice == "Planta" : "Invalid element choice provided"
        }

        let gameId = self.nextGameId

        // Create a new Game resource for a PvE practice game
        let newGame <- create Game(
            gameId: gameId,
            mode: GameMode.PvEPractice, // Set mode to practice
            player1: player1Address,
            player1StakeVault: nil, // No stake for practice games
            initialStakeAmount: 0.0, // No stake amount
            player1InitialMove: player1Choice, // Player 1's move is set at creation
            initialMaxWins: 1 // For PvE, let's default to 1 win needed. Max wins concept is less relevant for current PvE.
        )

        // Immediately commit to randomness for practice games as Player 2 (computer) move is derived from it.
        // The game status will transition from awaitingMoves (set in init) to awaitingRandomness.
        newGame.commitToRandomness()
        
        let oldGame <- self.games[gameId] <- newGame // Store the new game resource
        destroy oldGame // Destroy the nil or old resource at that key

        self.nextGameId = self.nextGameId + 1
        emit GameCreated(gameId: gameId, player1: player1Address, stakeAmount: 0.0, mode: GameMode.PvEPractice.rawValue)

        return gameId
    }

    access(all) fun joinGame(gameId: UInt64, player2Address: Address, player2StakeVault: @{FungibleToken.Vault}) {
        pre {
            self.games[gameId] != nil : "Game with this ID does not exist."
            // player2StakeVault.owner != nil : "Player 2 vault has no owner." // owner is Address?, so this is good
        }
        
        // Borrow a reference to the game
        let gameRef = &self.games[gameId] as &Game? ?? panic("Game not found, though existence was checked.")
        
        if gameRef.player2 != nil {
            emit GameError(gameId: gameId, player: player2Address, message: "Game is already full.") // Use player2Address for logging
            panic("Game is already full")
        }
        if player2StakeVault.balance != gameRef.stakeAmount {
            emit GameError(gameId: gameId, player: player2Address, message: "Stake amount does not match game requirement.") // Use player2Address for logging
            panic("Stake amount does not match game requirement")
        }
        // Removed: let player2Address = player2StakeVault.owner?.address ?? panic("Player 2 vault owner not found")

        gameRef.addPlayer2(player2: player2Address, player2StakeVault: <-player2StakeVault) // Use the passed player2Address
        emit GameJoined(gameId: gameId, player2: player2Address)
    }

    // Public function to trigger randomness reveal and game resolution
    // Refactored to resolve a single round in a multi-round game
    access(all) fun revealGameOutcome(gameId: UInt64, callingPlayerAddress: Address) {
        // Get game reference
        let gameRef = &self.games[gameId] as &Game?
        assert(gameRef != nil, message: "Game does not exist")
        let game = gameRef! // Safe to force unwrap after assert

        // Check status - Must be awaiting randomness for this round
        if game.status != GameStatus.awaitingRandomness {
            emit GameError(gameId: gameId, player: callingPlayerAddress, message: "Game not awaiting randomness for round resolution.")
            panic("Game not awaiting randomness for round resolution.")
        }

        let committedBlockHeight = game.committedBlockHeight!
        let currentBlockHeight = getCurrentBlock().height
        let revealDelay: UInt64 = 10 // Example delay: wait 10 blocks for randomness

        // Check if enough blocks have passed for randomness to be potentially available
        if currentBlockHeight < committedBlockHeight + revealDelay {
            emit GameError(gameId: gameId, player: callingPlayerAddress, message: "Not enough blocks have passed since round commitment.")
            log("Game ID: ".concat(gameId.toString()).concat(" committed at block: ").concat(committedBlockHeight.toString()).concat(". Current block: ").concat(currentBlockHeight.toString()).concat(". Need block height: ").concat((committedBlockHeight + revealDelay).toString()).concat(" for round resolution."))
            // Do NOT panic here, just exit if not ready
            return
        }

        // --- Get Randomness Seed ---
        // (Keep the simplified MVP seed logic for now)
        let prngSeed = committedBlockHeight // Simplified seed for MVP testing
        let prng = PRNG(seed: prngSeed, salt: gameId + game.currentRound) // Include round number in salt

        // Derive outcomes using the PRNG
        var computerMove: String? = nil
        // If PvE game, determine computer's move using randomness
        if game.mode == GameMode.PvEPractice {
             computerMove = self.deriveElementFromRandom(val: prng.next())
        }

        let environmentalModifier = self.deriveEnvironmentFromRandom(val: prng.next())
        let criticalHitP1 = self.deriveHitEffectFromRandom(val: prng.next())
        let criticalHitP2OrComputer = self.deriveHitEffectFromRandom(val: prng.next())

        // Determine ROUND winner (simplified logic for MVP)
        var roundWinnerAddress: Address? = nil

        let player1Move = game.player1Move! // Safe to force unwrap in awaitingRandomness state for this round
        // Get the opponent's move (Player 2 in PvP, Computer in PvE)
        let player2OrComputerMove = game.mode == GameMode.PvPStaked ? game.player2Move! : (computerMove ?? panic("Computer move not determined for PvE game round")) // Ensure computerMove is not nil for PvE

        // Basic win/loss/draw logic based on elements (Fuego > Planta, Planta > Agua, Agua > Fuego)
        let player1WinsRoundBasic = self.Elements[player1Move] == player2OrComputerMove
        let player2OrComputerWinsRoundBasic = self.Elements[player2OrComputerMove] == player1Move

        if player1WinsRoundBasic && !player2OrComputerWinsRoundBasic { // Player 1 wins the round
            roundWinnerAddress = game.player1
            game.incrementPlayer1Score() // Use helper function
        } else if player2OrComputerWinsRoundBasic && !player1WinsRoundBasic { // Player 2 or Computer wins the round
             roundWinnerAddress = game.mode == GameMode.PvPStaked ? game.player2 : nil // Computer doesn't win score for account
             game.incrementPlayer2Score() // Use helper function
        } else { // Draw round
            roundWinnerAddress = nil
            // Scores remain unchanged in a draw
        }

        // Check if the match is over ("Best of N" logic)
        let winningScore = game.currentMaxWins // Corrected logic: winning score is simply currentMaxWins
        let isGameOver = game.player1Score >= winningScore || game.player2Score >= winningScore

        // Emit RoundResolved event
         emit RoundResolved(
            gameId: game.gameId,
            roundNumber: game.currentRound,
            player1Move: player1Move,
            player2Move: player2OrComputerMove,
            roundWinner: roundWinnerAddress,
            environmentalModifier: environmentalModifier,
            criticalHitTypeP1: criticalHitP1,
            criticalHitTypeP2OrComputer: criticalHitP2OrComputer,
            player1Score: game.player1Score,
            player2Score: game.player2Score,
            isGameOver: isGameOver
        )


        if isGameOver {
            // Match is over, finalize resolution (handles payouts)
            // Need to pass final winner and winnings to finalizeResolution
            var finalWinnerAddress: Address? = nil
            var finalLoserAddress: Address? = nil
            var totalWinnings: UFix64 = 0.0

            if game.player1Score > game.player2Score {
                finalWinnerAddress = game.player1
                finalLoserAddress = game.player2 // Only applies in PvP
                // Use currentStakeAmount for winnings as it might have been doubled
                totalWinnings = game.mode == GameMode.PvPStaked ? game.currentStakeAmount * 2.0 : 0.0
            } else if game.player2Score > game.player1Score {
                finalWinnerAddress = game.player2 // Only applies in PvP
                finalLoserAddress = game.player1
                // Use currentStakeAmount for winnings
                 totalWinnings = game.mode == GameMode.PvPStaked ? game.currentStakeAmount * 2.0 : 0.0
            } else { // Draw overall match - return stakes in PvP
                // This is an overall game draw after all rounds according to maxWins.
                finalWinnerAddress = nil // No winner in draw
                finalLoserAddress = nil
                // Each player gets their current stake back
                totalWinnings = game.mode == GameMode.PvPStaked ? game.currentStakeAmount : 0.0 // This is per player in case of draw
                
                // Directly finalize resolution for a game draw, no double or nothing.
                game.finalizeResolution(
                    environmentalModifier: environmentalModifier,
                    criticalHitTypeP1: criticalHitP1,
                    criticalHitTypeP2OrComputer: criticalHitP2OrComputer,
                    winnerAddress: finalWinnerAddress,
                    loserAddress: finalLoserAddress,
                    winningsToWinner: totalWinnings,
                    computerGeneratedMove: computerMove
                )
                log("Game ID: ".concat(gameId.toString()).concat(" resolved as a DRAW after ").concat(game.currentRound.toString()).concat(" rounds."))
                return // Exit early for game draw
            }

            // If we reach here, there is a winner and a loser for the game.
            // Instead of finalizing, set up for a double or nothing offer from the game loser.
            if finalWinnerAddress != nil && finalLoserAddress != nil {
                game.setLastRoundWinner(winner: finalWinnerAddress) // game winner
                game.setLastRoundLoser(loser: finalLoserAddress)   // game loser
                game.setStatus(newStatus: GameStatus.awaitingDoubleOffer)
                log("Game ID: ".concat(gameId.toString()).concat(" finished. Player ").concat(finalLoserAddress!.toString()).concat(" (game loser) can offer to double. Winner: ").concat(finalWinnerAddress!.toString()).concat(". Score: P1 ").concat(game.player1Score.toString()).concat(" - P2 ").concat(game.player2Score.toString()))
            } else {
                // This should not be reached if the logic above for draw or win/loss is correct.
                // Fallback to finalize if something unexpected happened.
                game.finalizeResolution(
                    environmentalModifier: environmentalModifier,
                    criticalHitTypeP1: criticalHitP1,
                    criticalHitTypeP2OrComputer: criticalHitP2OrComputer,
                    winnerAddress: finalWinnerAddress, // Could be nil if state is inconsistent
                    loserAddress: finalLoserAddress,   // Could be nil
                    winningsToWinner: totalWinnings,
                    computerGeneratedMove: computerMove
                )
                log("Game ID: ".concat(gameId.toString()).concat(" resolved (unexpected state during game over)."))
            }

        } else {
            // Match is NOT over, advance to the next round.
            // No double or nothing offer between rounds.
            game.advanceRound() // Use helper function to increment round, clear moves, set status to awaitingMoves
            log("Game ID: ".concat(gameId.toString()).concat(" - Round ").concat((game.currentRound - 1).toString()).concat(" resolved. Moving to Round ").concat(game.currentRound.toString()).concat(". Score: P1 ").concat(game.player1Score.toString()).concat(" - P2 ").concat(game.player2Score.toString()))
        }
    }

    // --- Placeholder PRNG-dependent functions ---
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
    access(all) fun getGamePublicDetails(gameId: UInt64): GameDetails? {
        if let gameRef = ElementalStrikers.borrowGame(gameId: gameId) { // Use borrowGame
            return GameDetails(gameRef: gameRef)
        }
        return nil
    }

    // Function to allow borrowing a game reference (mutable)
    // Needed for transactions like offerDouble and respondToDoubleOffer to modify game state.
    access(all) fun borrowGame(gameId: UInt64): &Game? {
        return &self.games[gameId] as &Game?
    }

    //-----------------------------------------------------------------------
    // Initialization
    //-----------------------------------------------------------------------
    init() {
        self.PlayerVaultStoragePath = /storage/ElementalStrikersPlayerAgentV4 
        self.GamePlayerPublicPath = /public/ElementalStrikersGamePlayerV4
        self.games <- {}
        self.nextGameId = 1
        self.Elements = {"Fuego": "Planta", "Planta": "Agua", "Agua": "Fuego"}
        // self.nextTestRandomSource = nil // Commented out for deployment
        emit ContractInitialized()
    }
} 