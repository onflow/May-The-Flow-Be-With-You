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
        access(all) var player2: Address? // Cambiado de access(self) a access(all)
        
        access(all) var player1Move: String? // Cambiado de access(self) a access(all)
        access(all) var player2Move: String? // Cambiado de access(self) a access(all)
        access(all) var computerMove: String? // Cambiado de access(self) a access(all)
        
        access(all) let stakeAmount: UFix64
        access(all) var player1Vault: @{FungibleToken.Vault}? // Cambiado de let a var
        access(all) var player2Vault: @{FungibleToken.Vault}? // Cambiado de access(self) a access(all)
        
        access(all) var status: GameStatus
        access(all) var committedBlockHeight: UInt64? // Cambiado de access(self) a access(all)
        
        // Fields to store results after reveal, before being part of a public struct
        access(all) var finalEnvironmentalModifier: String? // Cambiado de access(self) a access(all)
        access(all) var finalCriticalHitTypePlayer1: String? // Cambiado de access(self) a access(all)
        access(all) var finalCriticalHitTypeP2OrComputer: String? // Cambiado de access(self) a access(all)
        access(all) var finalWinner: Address? // Cambiado de access(self) a access(all)

        init(gameId: UInt64, mode: GameMode, player1: Address, player1StakeVault: @{FungibleToken.Vault}?, initialStakeAmount: UFix64, player1InitialMove: String?) {
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
            self.player2Move = nil // Inicialización añadida

            if self.mode == GameMode.PvPStaked {
                self.player1Move = nil // Player 1 makes move via transaction
                self.status = GameStatus.active // Waiting for player 2
            } else { // PvEPractice
                assert(player1InitialMove != nil, message: "Player 1 initial move required for PvE practice game")
                self.player1Move = player1InitialMove!
                self.status = GameStatus.awaitingMoves // Will immediately transition to awaitingRandomness by commitToRandomness
            }
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
                // Extraer los vaults a variables locales usando el operador de intercambio
                var p1Vault: @{FungibleToken.Vault}? <- nil
                p1Vault <-> self.player1Vault
                
                if p1Vault != nil {
                    let unwrappedP1Vault <- p1Vault!
                    
                    if winnerAddress == self.player1 {
                        let winnerReceiver = getAccount(self.player1).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                            ?? panic("Cannot borrow receiver for player 1")
                        
                        // El ganador recibe su vault
                        winnerReceiver.deposit(from: <-unwrappedP1Vault)
                        
                        // Y el vault del otro jugador si existe
                        var p2Vault: @{FungibleToken.Vault}? <- nil
                        p2Vault <-> self.player2Vault
                        
                        if p2Vault != nil {
                            let unwrappedP2Vault <- p2Vault!
                            winnerReceiver.deposit(from: <-unwrappedP2Vault)
                        } else {
                            destroy p2Vault
                        }
                    } else if winnerAddress == self.player2 && self.player2 != nil {
                        let winnerReceiver = getAccount(self.player2!).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                            ?? panic("Cannot borrow receiver for player 2")
                        
                        // El ganador recibe ambos vaults
                        var p2Vault: @{FungibleToken.Vault}? <- nil
                        p2Vault <-> self.player2Vault
                        
                        if p2Vault != nil {
                            let unwrappedP2Vault <- p2Vault!
                            winnerReceiver.deposit(from: <-unwrappedP2Vault)
                        } else {
                            destroy p2Vault
                        }
                        
                        winnerReceiver.deposit(from: <-unwrappedP1Vault)
                    } else { // Draw - cada jugador recibe su stake de vuelta
                        let p1Receiver = getAccount(self.player1).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                            ?? panic("Cannot borrow receiver for player 1 on draw")
                        
                        p1Receiver.deposit(from: <-unwrappedP1Vault)
                        emit StakeReturned(player: self.player1, amount: self.stakeAmount)
                        
                        if self.player2 != nil {
                            var p2Vault: @{FungibleToken.Vault}? <- nil
                            p2Vault <-> self.player2Vault
                            
                            if p2Vault != nil {
                                let unwrappedP2Vault <- p2Vault!
                                let p2Receiver = getAccount(self.player2!).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                                    ?? panic("Cannot borrow receiver for player 2 on draw")
                                
                                p2Receiver.deposit(from: <-unwrappedP2Vault)
                                emit StakeReturned(player: self.player2!, amount: self.stakeAmount)
                            } else {
                                destroy p2Vault
                            }
                        }
                    }
                } else {
                    destroy p1Vault
                }
            } else { // PvEPractice - extraer y destruir vaults si existieran
                var p1Vault: @{FungibleToken.Vault}? <- nil
                p1Vault <-> self.player1Vault
                
                if p1Vault != nil {
                    let unwrappedP1Vault <- p1Vault!
                    destroy unwrappedP1Vault
                } else {
                    destroy p1Vault
                }
                
                var p2Vault: @{FungibleToken.Vault}? <- nil
                p2Vault <-> self.player2Vault
                
                if p2Vault != nil {
                    let unwrappedP2Vault <- p2Vault!
                    destroy unwrappedP2Vault
                } else {
                    destroy p2Vault
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
        access(all) let stakeAmount: UFix64
        access(all) let status: GameStatus 
        access(all) let committedBlockHeight: UInt64?
        access(all) let environmentalModifier: String?
        access(all) let criticalHitTypePlayer1: String?
        access(all) let criticalHitTypeP2OrComputer: String?
        access(all) let winner: Address?

        init(gameRef: &Game) {
            self.gameId = gameRef.gameId
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
            self.mode = gameRef.mode
        }
    }


    // Actual resource that players will store to interact
    access(all) resource PlayerAgent: GamePlayer {
        access(self) let ownerAddress: Address // Renamed from owner to avoid conflict with built-in self.owner for resource account
        init(account: &Account) { self.ownerAddress = account.address } // Use passed account to get address

        access(all) fun getGameDetails(gameId: UInt64): GameDetails? {
            if let gameRef = &ElementalStrikers.games[gameId] as &Game? {
                // Allow anyone to see game details for now, or restrict to players
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


    access(all) fun createGame(player1Address: Address, player1StakeVault: @{FungibleToken.Vault}, initialStakeAmount: UFix64): UInt64 {
        pre {
            player1StakeVault.balance == initialStakeAmount : "Initial stake amount does not match vault balance."
            // Placeholder for FungibleToken.Receiver capability check if not directly taking vault
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
            player1InitialMove: nil
        )
        
        let oldGame <- self.games[gameId] <- newGame // Store the new game resource
        destroy oldGame // Destroy the nil or old resource at that key

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
            player1InitialMove: player1Choice // Player 1's move is set at creation
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
    access(all) fun revealGameOutcome(gameId: UInt64, callingPlayerAddress: Address) {
        // Get game reference
        let gameRef = &self.games[gameId] as &Game?
        assert(gameRef != nil, message: "Game does not exist")
        let game = gameRef! // Safe to force unwrap after assert

        // Check status
        if game.status != GameStatus.awaitingRandomness {
            emit GameError(gameId: gameId, player: callingPlayerAddress, message: "Game not awaiting randomness.")
            panic("Game not awaiting randomness.")
        }

        let committedBlockHeight = game.committedBlockHeight!
        let currentBlockHeight = getCurrentBlock().height
        let revealDelay: UInt64 = 10 // Example delay: wait 10 blocks for randomness

        // Check if enough blocks have passed for randomness to be potentially available
        if currentBlockHeight < committedBlockHeight + revealDelay {
            emit GameError(gameId: gameId, player: callingPlayerAddress, message: "Not enough blocks have passed since commitment.")
            log("Game ID: ".concat(gameId.toString()).concat(" committed at block: ").concat(committedBlockHeight.toString()).concat(". Current block: ").concat(currentBlockHeight.toString()).concat(". Need block height: ").concat((committedBlockHeight + revealDelay).toString()))
            // Do NOT panic here, just exit if not ready
            return
        }

        // --- Get Randomness Seed ---
        // In a real application, you would interact with a trusted Randomness Provider contract
        // (like a RandomBeaconHistory consumer) to get a *verifiable* random seed
        // for the committed block height.
        // For this MVP testing, we will use the block height itself as a simplified seed,
        // acknowledging this is NOT cryptographically secure for production.
        // If you have a RandomBeaconHistory consumer contract deployed and linked,
        // you would use something like:
        // let randomnessProvider = getAccount(PROVIDER_ADDRESS).getCapability(PROVIDER_PUBLIC_PATH)
        //     .borrow<&RandomBeaconHistory.Consumer{RandomnessProvider}>()
        //     ?? panic("Could not borrow Randomness Provider capability")
        // let randomData = randomnessProvider.getRandomBeaconData(blockHeight: committedBlockHeight)
        //     ?? panic("Could not get random data for block ".concat(committedBlockHeight.toString()))
        // let prngSeed = randomData.slice(0, 8).toUInt64() // Example: use first 8 bytes as seed

        // --- Simplified MVP Seed from Block Height ---
        let prngSeed = committedBlockHeight // Simplified seed for MVP testing

        let prng = PRNG(seed: prngSeed, salt: gameId)

        // Derive outcomes using the PRNG
        var computerMove: String? = nil
        // If PvE game, determine computer's move using randomness
        if game.mode == GameMode.PvEPractice {
             computerMove = self.deriveElementFromRandom(val: prng.next())
             // The computerMove field is set within finalizeResolution
             // game.computerMove = computerMove // REMOVED: Direct assignment not allowed
        }

        let environmentalModifier = self.deriveEnvironmentFromRandom(val: prng.next())
        let criticalHitP1 = self.deriveHitEffectFromRandom(val: prng.next())
        let criticalHitP2OrComputer = self.deriveHitEffectFromRandom(val: prng.next())

        // Determine winner (simplified logic for MVP)
        var winnerAddress: Address? = nil
        var loserAddress: Address? = nil
        var winnings: UFix64 = 0.0 // Winnings are total pot for winner in PvP, 0 otherwise

        let player1Move = game.player1Move! // Safe to force unwrap in awaitingRandomness state
        // Get the opponent's move (Player 2 in PvP, Computer in PvE)
        let player2OrComputerMove = game.mode == GameMode.PvPStaked ? game.player2Move! : (computerMove ?? panic("Computer move not determined for PvE game")) // Ensure computerMove is not nil for PvE

        // Basic win/loss/draw logic based on elements (Fuego > Planta, Planta > Agua, Agua > Fuego)
        let player1WinsBasic = self.Elements[player1Move] == player2OrComputerMove
        let player2OrComputerWinsBasic = self.Elements[player2OrComputerMove] == player1Move

        // NOTE: Environmental modifier and critical hits are derived but NOT
        // implemented in the win/loss logic for this MVP. This would require
        // more complex combat rules.

        if player1WinsBasic && !player2OrComputerWinsBasic { // Player 1 wins (based on basic element rule)Paciente
            winnerAddress = game.player1
            loserAddress = game.mode == GameMode.PvPStaked ? game.player2 : nil // No explicit loser in PvE
            if game.mode == GameMode.PvPStaked {
                winnings = game.stakeAmount * 2.0 // Winner takes the full pot (both stakes)
            } else {
                winnings = 0.0 // No winnings in practice games
            }
        } else if player2OrComputerWinsBasic && !player1WinsBasic { // Player 2 or Computer wins
             // Winner is Player 2 in PvP. In PvE, there is no "winner address" for the computer,
             // but we track the outcome for logging/event.
            winnerAddress = game.mode == GameMode.PvPStaked ? game.player2 : nil
            loserAddress = game.player1 // Player 1 is the loser in PvE if computer wins
             if game.mode == GameMode.PvPStaked {
                winnings = game.stakeAmount * 2.0 // Winner takes the full pot (both stakes)
            } else {
                winnings = 0.0 // No winnings in practice games
            }
        } else { // Draw
            winnerAddress = nil // Draw has no winner
            loserAddress = nil
            // In a draw, staked tokens are returned. Winnings represent the total received.
            winnings = game.mode == GameMode.PvPStaked ? game.stakeAmount : 0.0 // Stakes returned in PvP draw, 0 in PvE
        }

        // Call finalizeResolution to update game state and handle payouts/events
        // finalizeResolution will set game.computerMove if it's a PvE game
        game.finalizeResolution(
            environmentalModifier: environmentalModifier,
            criticalHitTypeP1: criticalHitP1,
            criticalHitTypeP2OrComputer: criticalHitP2OrComputer,
            winnerAddress: winnerAddress,
            loserAddress: loserAddress,
            winningsToWinner: winnings, // This is the total received by winner or stake returned in draw
            computerGeneratedMove: computerMove // Pass computer move for PvE logging in event
        )

        log("Game ID: ".concat(gameId.toString()).concat(" resolved."))
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
        if let gameRef = &self.games[gameId] as &Game? {
            return GameDetails(gameRef: gameRef)
        }
        return nil
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