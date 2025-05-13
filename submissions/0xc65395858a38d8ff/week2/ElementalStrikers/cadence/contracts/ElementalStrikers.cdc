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


    access(all) fun createGame(player1StakeVault: @{FungibleToken.Vault}, initialStakeAmount: UFix64): UInt64 {
        pre {
            player1StakeVault.balance == initialStakeAmount : "Initial stake amount does not match vault balance."
            // Placeholder for FungibleToken.Receiver capability check if not directly taking vault
        }
        
        let player1Address = player1StakeVault.owner?.address ?? panic("Cannot determine owner of the stake vault")
        let gameId = self.nextGameId
        
        let newGame <- create Game(
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
        emit GameCreated(gameId: gameId, player1: player1Address, stakeAmount: initialStakeAmount, mode: GameMode.PvPStaked.rawValue)
        return gameId
    }

    access(all) fun joinGame(gameId: UInt64, player2StakeVault: @{FungibleToken.Vault}) {
        pre {
            self.games[gameId] != nil : "Game with this ID does not exist."
            // player2StakeVault.owner != nil : "Player 2 vault has no owner." // owner is Address?, so this is good
        }
        
        // Borrow a reference to the game
        let gameRef = &self.games[gameId] as &Game? ?? panic("Game not found, though existence was checked.")
        
        if gameRef.player2 != nil {
            emit GameError(gameId: gameId, player: player2StakeVault.owner?.address, message: "Game is already full.")
            panic("Game is already full")
        }
        if player2StakeVault.balance != gameRef.stakeAmount {
            emit GameError(gameId: gameId, player: player2StakeVault.owner?.address, message: "Stake amount does not match game requirement.")
            panic("Stake amount does not match game requirement")
        }
        let player2Address = player2StakeVault.owner?.address ?? panic("Player 2 vault owner not found")

        gameRef.addPlayer2(player2: player2Address, player2StakeVault: <-player2StakeVault)
        emit GameJoined(gameId: gameId, player2: player2Address)
    }

    // Public function to trigger randomness reveal and game resolution
    access(all) fun revealGameOutcome(gameId: UInt64, callingPlayerAddress: Address) {
        log("test")
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