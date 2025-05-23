// This transaction deploys the EvolvingCreatures contract to the account
transaction {
    prepare(acct: auth(Storage, Contracts) &Account) {
        // This is the actual contract code for EvolvingCreatures that will be deployed
        let code = """
        // EvolvingCreatures.cdc
        // Contract for evolving creatures as NFTs on the Flow blockchain.

        import NonFungibleToken from 0x631e88ae7f1d7c20
        import RandomBeaconHistory from 0x8c5303eaa26202d6

        access(all) contract EvolvingCreatures: NonFungibleToken {

            //-----------------------------------------------------------------------
            // Events
            //-----------------------------------------------------------------------
            access(all) event ContractInitialized()
            access(all) event CollectionCreated(owner: Address)
            access(all) event NFTMinted(id: UInt64, owner: Address, birthBlockHeight: UInt64)
            access(all) event EvolutionSeedCommitted(creatureID: UInt64, committedBlockHeight: UInt64, committedTimestamp: UFix64)
            access(all) event EvolutionProcessed(creatureID: UInt64, newEP: UFix64, newAgeInDays: UFix64, isAlive: Bool, lastProcessedBlock: UInt64, lastProcessedTimestamp: UFix64)
            access(all) event CreatureDied(creatureID: UInt64, deathBlockHeight: UInt64, deathTimestamp: UFix64)
            access(all) event HomeostasisTargetSet(creatureID: UInt64, gene: String, target: UFix64)
            access(all) event CreatureAwaitingFirstSeed(creatureID: UInt64)

            //-----------------------------------------------------------------------
            // Contract State & Constants
            //-----------------------------------------------------------------------
            access(all) let CollectionStoragePath: StoragePath
            access(all) let CollectionPublicPath: PublicPath
            access(all) let CollectionPrivatePath: PrivatePath

            access(all) let MAX_ACTIVE_CREATURES: Int;
            access(all) let SECONDS_PER_SIMULATED_DAY: UFix64; // Represents one real day in seconds (24 * 60 * 60)
            // access(all) let BLOCKS_PER_SIMULATED_DAY: UInt64 = 100 
            // Placeholder, can be tuned (e.g., 1 block ~ 1 second, so 86400 for a real day)

            access(all) var nextCreatureID: UInt64;

            //-----------------------------------------------------------------------
            // PRNG Struct (Simple LCG)
            //-----------------------------------------------------------------------
            access(all) struct PRNG {
                access(self) var state: UInt64
                access(self) let a: UInt64 // Multiplier
                access(self) let c: UInt64 // Increment
                access(self) let m: UInt64 // Modulus

                init(seed: UInt64, salt: UInt64) {
                    self.a = 1664525
                    self.c = 1013904223
                    self.m = 4294967296 // 2^32
                    self.state = (seed ^ salt) % self.m // Ensure initial state is within modulus
                }

                access(all) fun next(): UInt64 {
                    self.state = (self.state * self.a + self.c) % self.m
                    return self.state
                }

                // Function to get a value within a specific range [min, max]
                access(all) fun nextInRange(min: Int, max: Int): Int {
                    assert(min <= max, message: "PRNG min cannot be greater than max")
                    let range = max - min + 1
                    return min + Int(self.next() % UInt64(range))
                }

                // Function to get a UFix64 within a specific range [0.0, 1.0)
                access(all) fun nextUFix64(): UFix64 {
                    // Max value of self.m - 1 for numerator to ensure result < 1.0
                    return UFix64(self.next()) / UFix64(self.m)
                }

                // Add the nextWithSalt function used in process_evolution_update.cdc
                access(all) fun nextWithSalt(seed: UInt64): UInt64 {
                    // Create temporary PRNG with additional salt
                    let tempSeed = (self.state ^ seed) % self.m
                    let tempPRNG = PRNG(seed: tempSeed, salt: seed)
                    // Get next value and update self state
                    self.state = (self.state * self.a + self.c) % self.m // Also advance our main state
                    return tempPRNG.next() // Return value from temporary PRNG
                }
            }

            //-----------------------------------------------------------------------
            // NFT Resource (Creature)
            //-----------------------------------------------------------------------
            access(all) resource NFT: NonFungibleToken.INFT {
                access(all) let id: UInt64
                access(all) let birthBlockHeight: UInt64
                access(all) let birthTimestamp: UFix64

                access(all) var genesVisibles: {String: UFix64}
                access(all) var genesOcultos: {String: UFix64}
                access(all) var puntosEvolucion: UFix64
                access(all) let lifespanTotalSimulatedDays: UFix64
                access(all) var edadDiasCompletos: UFix64
                access(all) var estaViva: Bool
                access(all) var deathBlockHeight: UInt64?
                access(all) var deathTimestamp: UFix64?

                // Evolution tracking
                access(all) var lastEvolutionProcessedBlockHeight: UInt64
                access(all) var lastEvolutionProcessedTimestamp: UFix64
                access(all) var committedToRandomBlockHeight: UInt64?
                access(all) var currentActiveBeaconSeed: UInt256?
                access(all) var lastBeaconSeedFetchedBlockHeight: UInt64?
                access(all) var simulatedDaysProcessedWithCurrentSeed: UInt64

                access(all) var homeostasisTargets: {String: UFix64}

                init(
                    id: UInt64,
                    birthBlockHeight: UInt64,
                    initialGenesVisibles: {String: UFix64},
                    initialGenesOcultos: {String: UFix64},
                    initialEP: UFix64,
                    lifespanDays: UFix64
                ) {
                    self.id = id
                    self.birthBlockHeight = birthBlockHeight
                    self.birthTimestamp = getCurrentBlock().timestamp
                    self.genesVisibles = initialGenesVisibles
                    self.genesOcultos = initialGenesOcultos
                    self.puntosEvolucion = initialEP
                    self.lifespanTotalSimulatedDays = lifespanDays
                    self.edadDiasCompletos = 0.0
                    self.estaViva = true
                    self.deathBlockHeight = nil
                    self.deathTimestamp = nil
                    self.lastEvolutionProcessedBlockHeight = birthBlockHeight
                    self.lastEvolutionProcessedTimestamp = getCurrentBlock().timestamp
                    self.committedToRandomBlockHeight = nil
                    self.currentActiveBeaconSeed = nil
                    self.lastBeaconSeedFetchedBlockHeight = nil
                    self.simulatedDaysProcessedWithCurrentSeed = 0
                    self.homeostasisTargets = {}

                    emit CreatureAwaitingFirstSeed(creatureID: self.id)
                }

                // Placeholder for internal evolution logic methods
                access(contract) fun _updateGenes(prng: &PRNG, currentSimulatedDayR0: UInt64, currentSimulatedDayR1: UInt64) {
                    // TODO: Implement gene evolution logic from Python simulation
                    // This will use prng and derived daily seeds (R0, R1, etc.)
                    // Example: self.genesVisibles["colorR"] = ...
                    log("Creature ".concat(self.id.toString()).concat("._updateGenes called - IMPLEMENT ME"))
                }

                access(contract) fun _gainEP(prng: &PRNG, currentSimulatedDayR0: UInt64) {
                    // TODO: Implement EP gain logic
                    // Example: self.puntosEvolucion = self.puntosEvolucion + (UFix64(currentSimulatedDayR0 % 10) / 10.0)
                    log("Creature ".concat(self.id.toString()).concat("._gainEP called - IMPLEMENT ME"))
                    
                    // Simple implementation for testing
                    self.puntosEvolucion = self.puntosEvolucion + 1.0
                }

                access(contract) fun _ageOneDaySimulated() {
                    self.edadDiasCompletos = self.edadDiasCompletos + 1.0
                    log("Creature ".concat(self.id.toString()).concat(" aged. Current age (days): ").concat(self.edadDiasCompletos.toString()))
                }

                access(contract) fun _die() {
                    if self.estaViva {
                        self.estaViva = false
                        self.deathBlockHeight = getCurrentBlock().height
                        self.deathTimestamp = getCurrentBlock().timestamp
                        log("Creature ".concat(self.id.toString()).concat(" died at block ").concat(self.deathBlockHeight!.toString()))
                        // Event emission for death will be handled by the caller (e.g., processEvolutionUpdate or Collection)
                    }
                }

                // Calculate elapsed simulated days based on real time 
                access(contract) fun calcElapsedSimulatedDays(currentTimestamp: UFix64): UFix64 {
                    let elapsedSeconds = currentTimestamp - self.lastEvolutionProcessedTimestamp
                    return elapsedSeconds / EvolvingCreatures.SECONDS_PER_SIMULATED_DAY
                }

                // Updates the last processed timestamp
                access(contract) fun updateLastProcessedTimestamp(newTimestamp: UFix64) {
                    self.lastEvolutionProcessedTimestamp = newTimestamp
                }
            }

            //-----------------------------------------------------------------------
            // Collection Resource
            //-----------------------------------------------------------------------
            access(all) resource interface EvolvingCreaturesCollectionPublic {
                access(all) fun deposit(token: @NonFungibleToken.NFT)
                access(all) fun getIDs(): [UInt64]
                access(all) fun getActiveIDs(): [UInt64]
                access(all) fun borrowNFT(id: UInt64): &NonFungibleToken.NFT?
                access(all) fun borrowEvolvingCreature(id: UInt64): &EvolvingCreatures.NFT? {
                    // Default implementation for CollectionPublic to borrow typed NFT
                    let ref = self.borrowNFT(id: id) ?? panic("NFT not found")
                    return ref as! &EvolvingCreatures.NFT // This cast might fail if not careful with what's stored.
                                                        // Better to implement in the concrete Collection.
                }
                access(all) fun borrowViewResolver(id: UInt64): &NonFungibleToken.NFTViewResolver?
            }

            access(all) resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, NonFungibleToken.CollectionPrivate, EvolvingCreaturesCollectionPublic {
                access(all) var ownedNFTs: @{UInt64: NonFungibleToken.NFT}
                access(self) var activeCreatureIDs: [UInt64] // IDs of creatures with estaViva == true

                init() {
                    self.ownedNFTs <- {}
                    self.activeCreatureIDs = []
                    emit CollectionCreated(owner: self.owner!.address)
                }

                access(all) fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
                    let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("Missing NFT")

                    // Remove from activeCreatureIDs if it was there
                    var i = 0
                    while i < self.activeCreatureIDs.length {
                        if self.activeCreatureIDs[i] == withdrawID {
                            self.activeCreatureIDs.remove(at: i)
                            break // Found and removed
                        }
                        i = i + 1
                    }
                    return <-token
                }

                access(all) fun deposit(token: @NonFungibleToken.NFT) {
                    let creatureToken <- token as! @EvolvingCreatures.NFT // Assert that it's our specific NFT type
                    
                    if creatureToken.estaViva {
                        if self.activeCreatureIDs.length >= EvolvingCreatures.MAX_ACTIVE_CREATURES {
                            // Destroy the incoming token if it's alive and there's no space.
                            // Or, panic and revert the transaction. Panicking is safer to prevent loss.
                            panic("Maximum number of active creatures reached. Cannot deposit another active creature.")
                        }
                        // Add to active list if not already there (e.g. transferring an active creature in)
                        var found = false
                        for activeID in self.activeCreatureIDs {
                            if activeID == creatureToken.id {
                                found = true
                                break
                            }
                        }
                        if !found {
                            self.activeCreatureIDs.append(creatureToken.id)
                        }
                    }

                    let oldToken <- self.ownedNFTs[creatureToken.id] <- creatureToken
                    destroy oldToken
                }

                access(all) fun getIDs(): [UInt64] {
                    return self.ownedNFTs.keys
                }

                access(all) fun getActiveIDs(): [UInt64] {
                    return self.activeCreatureIDs
                }

                access(all) fun borrowNFT(id: UInt64): &NonFungibleToken.NFT? {
                    return &self.ownedNFTs[id] as &NonFungibleToken.NFT?
                }

                access(all) fun borrowEvolvingCreature(id: UInt64): &EvolvingCreatures.NFT? {
                    if let ref = self.ownedNFTs[id] {
                        return ref as! &EvolvingCreatures.NFT // This is safe if only EvolvingCreatures.NFT are stored
                    }
                    return nil
                }

                access(all) fun borrowViewResolver(id: UInt64): &NonFungibleToken.NFTViewResolver? {
                    let nft = self.borrowNFT(id: id)
                    if nft == nil {
                        return nil
                    }
                    return nft as! &NonFungibleToken.NFTViewResolver
                }

                access(NonFungibleToken.CollectionPrivate) fun borrowSelf(): &Collection {
                    return &self
                }

                // Internal helpers for managing activeCreatureIDs list when a creature's status changes
                access(contract) fun _markAsDeadInCollection(creatureID: UInt64) {
                    var i = 0
                    while i < self.activeCreatureIDs.length {
                        if self.activeCreatureIDs[i] == creatureID {
                            self.activeCreatureIDs.remove(at: i)
                            log("Creature ".concat(creatureID.toString()).concat(" marked as dead in collection, removed from active list."))
                            return
                        }
                        i = i + 1
                    }
                }

                access(contract) fun _markAsAliveInCollection(creatureID: UInt64) {
                    // This would be used if a creature is revived, or to ensure consistency
                    // when depositing an already active creature.
                    var found = false
                    for id in self.activeCreatureIDs {
                        if id == creatureID {
                            found = true
                            break
                        }
                    }
                    if !found {
                        if self.activeCreatureIDs.length < EvolvingCreatures.MAX_ACTIVE_CREATURES {
                            self.activeCreatureIDs.append(creatureID)
                            log("Creature ".concat(creatureID.toString()).concat(" marked as alive in collection, added to active list."))
                        } else {
                            log("WARNING: Creature ".concat(creatureID.toString()).concat(" could not be added to active list (max capacity reached)."))
                        }
                    }
                }
                
                // El método destructor personalizado ya no está permitido en Cadence
                // destroy() {
                //     destroy self.ownedNFTs
                // }
            }

            //-----------------------------------------------------------------------
            // Contract Functions
            //-----------------------------------------------------------------------
            access(all) fun createEmptyCollection(): @NonFungibleToken.Collection {
                return <- create Collection()
            }

            access(all) fun mintCreature(
                recipient: &NonFungibleToken.Receiver,
                // serialNumber: UInt64, // Not used for now, id is unique
                initialGenesVisibles: {String: UFix64},
                initialGenesOcultos: {String: UFix64},
                initialEP: UFix64,
                lifespanDays: UFix64
            ): @NFT {
                let newID = EvolvingCreatures.nextCreatureID
                EvolvingCreatures.nextCreatureID = EvolvingCreatures.nextCreatureID + 1

                let newCreature <- create NFT(
                    id: newID,
                    birthBlockHeight: getCurrentBlock().height,
                    initialGenesVisibles: initialGenesVisibles,
                    initialGenesOcultos: initialGenesOcultos,
                    initialEP: initialEP,
                    lifespanDays: lifespanDays
                )

                emit NFTMinted(id: newCreature.id, owner: recipient.owner!.address, birthBlockHeight: newCreature.birthBlockHeight)
                
                // The deposit function in the recipient's collection will handle MAX_ACTIVE_CREATURES logic.
                // If recipient doesn't have space for an active creature, the deposit will panic.
                // This means minting can fail if the recipient's active slots are full.
                // This is an important design consideration.
                // An alternative is to mint it as "inactive" if slots are full,
                // or require pre-check by the minter.
                // For now, keeping it simple: deposit will panic if active slots are full.

                return <-newCreature
                // Note: The actual deposit to the recipient's collection happens in the transaction
                // that calls this mintCreature function. This function just returns the created NFT.
                // The caller of mintCreature will then call recipient.deposit(token: <-newNFT).
                // This is standard NFT minting pattern.
            }


            //-----------------------------------------------------------------------
            // Initialization
            //-----------------------------------------------------------------------
            init() {
                self.CollectionStoragePath = /storage/EvolvingCreaturesCollectionV1
                self.CollectionPublicPath = /public/EvolvingCreaturesCollectionPublicV1
                self.CollectionPrivatePath = /private/EvolvingCreaturesCollectionPrivateV1 // For linking provider capability
                self.nextCreatureID = 1

                // Initialize contract constants
                self.MAX_ACTIVE_CREATURES = 5
                self.SECONDS_PER_SIMULATED_DAY = 86400.0

                // Initialize contract state or emit event
                emit ContractInitialized()
            }
        } 
        """

        // Add the contract to the account
        acct.contracts.add(name: "EvolvingCreatures", code: code.utf8)
    }
} 