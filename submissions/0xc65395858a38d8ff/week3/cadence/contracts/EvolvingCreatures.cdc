// EvolvingCreatures.cdc
// Contract for evolving creatures as NFTs on the Flow blockchain.

import NonFungibleToken from 0x631e88ae7f1d7c20
import RandomBeaconHistory from 0x8c5303eaa26202d6
import MetadataViews from 0x631e88ae7f1d7c20

access(all) contract EvolvingCreatures: NonFungibleToken {

    //-----------------------------------------------------------------------
    // Events
    //-----------------------------------------------------------------------
    access(all) event ContractInitialized()
    access(all) event NFTMinted(id: UInt64, owner: Address, birthBlockHeight: UInt64)
    access(all) event EvolutionSeedCommitted(creatureID: UInt64, committedBlockHeight: UInt64, committedTimestamp: UFix64)
    access(all) event EvolutionProcessed(creatureID: UInt64, newEP: UFix64, newAgeInDays: UFix64, isAlive: Bool, lastProcessedBlock: UInt64, lastProcessedTimestamp: UFix64)
    access(all) event CreatureDied(creatureID: UInt64, deathBlockHeight: UInt64, deathTimestamp: UFix64)
    access(all) event HomeostasisTargetSet(creatureID: UInt64, gene: String, target: UFix64)
    access(all) event CreatureAwaitingFirstSeed(creatureID: UInt64)
    // Required by NonFungibleToken interface
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)

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

    access(all) var totalSupply: UInt64
    access(all) var nextCreatureID: UInt64;

    // Custom Metadata View for EvolvingCreatures - Moved inside the contract
    access(all) struct EvolvingCreatureMetadataView {
        access(all) let id: UInt64
        access(all) let birthBlockHeight: UInt64
        access(all) let birthTimestamp: UFix64
        access(all) let genesVisibles: {String: UFix64}
        access(all) let genesOcultos: {String: UFix64}
        access(all) let puntosEvolucion: UFix64
        access(all) let lifespanTotalSimulatedDays: UFix64
        access(all) let edadDiasCompletos: UFix64
        access(all) let estaViva: Bool
        access(all) let lastEvolutionProcessedTimestamp: UFix64

        init(
            id: UInt64,
            birthBlockHeight: UInt64,
            birthTimestamp: UFix64,
            genesVisibles: {String: UFix64},
            genesOcultos: {String: UFix64},
            puntosEvolucion: UFix64,
            lifespanTotalSimulatedDays: UFix64,
            edadDiasCompletos: UFix64,
            estaViva: Bool,
            lastEvolutionProcessedTimestamp: UFix64
        ) {
            self.id = id
            self.birthBlockHeight = birthBlockHeight
            self.birthTimestamp = birthTimestamp
            self.genesVisibles = genesVisibles
            self.genesOcultos = genesOcultos
            self.puntosEvolucion = puntosEvolucion
            self.lifespanTotalSimulatedDays = lifespanTotalSimulatedDays
            self.edadDiasCompletos = edadDiasCompletos
            self.estaViva = estaViva
            self.lastEvolutionProcessedTimestamp = lastEvolutionProcessedTimestamp
        }
    }

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
        
        // Required by NonFungibleToken.INFT
        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Serial>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<EvolvingCreatureMetadataView>()
            ]
        }
        
        // Required by NonFungibleToken.INFT
        access(all) view fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: "Evolving Creature #".concat(self.id.toString()),
                        description: "A unique, evolving digital creature.",
                        thumbnail: MetadataViews.HTTPFile(url: "https://example.com/creature_thumb_".concat(self.id.toString()).concat(".png"))
                    )
                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(self.id)
                case Type<MetadataViews.NFTCollectionData>():
                    return EvolvingCreatures.resolveContractView(resourceType: Type<@EvolvingCreatures.Collection>(), viewType: Type<MetadataViews.NFTCollectionData>())
                case Type<EvolvingCreatureMetadataView>():
                    return EvolvingCreatureMetadataView(
                        id: self.id,
                        birthBlockHeight: self.birthBlockHeight,
                        birthTimestamp: self.birthTimestamp,
                        genesVisibles: self.genesVisibles,
                        genesOcultos: self.genesOcultos,
                        puntosEvolucion: self.puntosEvolucion,
                        lifespanTotalSimulatedDays: self.lifespanTotalSimulatedDays,
                        edadDiasCompletos: self.edadDiasCompletos,
                        estaViva: self.estaViva,
                        lastEvolutionProcessedTimestamp: self.lastEvolutionProcessedTimestamp
                    )
            }
            return nil
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

    // Interface for EvolvingCreatures specific public collection methods
    // Moved INSIDE the contract block
    access(all) resource interface EvolvingCreaturesCollectionPublic {
        access(all) fun getActiveIDs(): [UInt64]
        access(all) fun borrowEvolvingCreature(id: UInt64): &EvolvingCreatures.NFT?
        // It also implicitly includes methods from NonFungibleToken.CollectionPublic
        // like getIDs(), borrowNFT(), deposit(), getSupportedNFTTypes(), isSupportedNFTType()
        // when a Collection resource implements this.
    }

    //-----------------------------------------------------------------------
    // Collection Resource
    //-----------------------------------------------------------------------
    access(all) resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, EvolvingCreaturesCollectionPublic {
        access(all) var ownedNFTs: @{UInt64: NonFungibleToken.NFT}
        access(self) var activeCreatureIDs: [UInt64]

        init() {
            self.ownedNFTs <- {}
            self.activeCreatureIDs = []
        }

        access(all) fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("Cannot withdraw NFT: token not found")
            var i = 0
            while i < self.activeCreatureIDs.length {
                if self.activeCreatureIDs[i] == withdrawID {
                    self.activeCreatureIDs.remove(at: i)
                    break 
                }
                i = i + 1
            }
            emit Withdraw(id: withdrawID, from: self.owner?.address)
            return <-token
        }

        access(all) fun deposit(token: @NonFungibleToken.NFT) {
            let creatureToken <- token as! @EvolvingCreatures.NFT
            if creatureToken.estaViva {
                if self.activeCreatureIDs.length >= EvolvingCreatures.MAX_ACTIVE_CREATURES {
                    panic("Maximum number of active creatures reached.")
                }
                var found = false
                for activeID in self.activeCreatureIDs {
                    if activeID == creatureToken.id { found = true; break }
                }
                if !found { self.activeCreatureIDs.append(creatureToken.id) }
            }
            let id = creatureToken.id
            
            // Add the deposit event before we use force-cast as! the second time
            emit Deposit(id: id, to: self.owner?.address)
            
            let oldToken <- self.ownedNFTs[id] <- creatureToken
            destroy oldToken
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) view fun borrowNFT(_ id: UInt64): &NonFungibleToken.NFT {
            return (&self.ownedNFTs[id] as &NonFungibleToken.NFT?)!
        }
        
        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@EvolvingCreatures.NFT>()] = true
            return supportedTypes
        }

        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@EvolvingCreatures.NFT>()
        }

        // Add createEmptyCollection without parameters in Collection
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-EvolvingCreatures.createEmptyCollection(nftType: Type<@EvolvingCreatures.NFT>())
        }

        // --- EvolvingCreatures specific Collection methods (implementing EvolvingCreaturesCollectionPublic) ---
        access(all) fun getActiveIDs(): [UInt64] {
            return self.activeCreatureIDs
        }
        access(all) fun borrowEvolvingCreature(id: UInt64): &EvolvingCreatures.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as! &EvolvingCreatures.NFT
                return ref
            }
            return nil
        }
        access(contract) fun _markAsDeadInCollection(creatureID: UInt64) {
            var i = 0
            while i < self.activeCreatureIDs.length {
                if self.activeCreatureIDs[i] == creatureID {
                    self.activeCreatureIDs.remove(at: i)
                    log("Creature ".concat(creatureID.toString()).concat(" marked as dead, removed from active list."))
                    return
                }
                i = i + 1
            }
        }
        access(contract) fun _markAsAliveInCollection(creatureID: UInt64) {
            var found = false
            for id in self.activeCreatureIDs { if id == creatureID { found = true; break } }
            if !found {
                if self.activeCreatureIDs.length < EvolvingCreatures.MAX_ACTIVE_CREATURES {
                    self.activeCreatureIDs.append(creatureID)
                    log("Creature ".concat(creatureID.toString()).concat(" marked as alive, added to active list."))
                } else {
                    log("WARNING: Creature ".concat(creatureID.toString()).concat(" could not be added to active list (max capacity)."))
                }
            }
        }
    }

    //-----------------------------------------------------------------------
    // Contract Functions
    //-----------------------------------------------------------------------
    access(all) fun createEmptyCollection(nftType: Type): @NonFungibleToken.Collection {
        return <- create Collection()
    }

    access(all) fun mintCreature(
        recipient: &{NonFungibleToken.Receiver},
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
        
        EvolvingCreatures.totalSupply = EvolvingCreatures.totalSupply + 1
        
        return <-newCreature
    }

    //-----------------------------------------------------------------------
    // Initialization
    //-----------------------------------------------------------------------
    init() {
        self.CollectionStoragePath = /storage/EvolvingCreaturesCollectionV2
        self.CollectionPublicPath = /public/EvolvingCreaturesCollectionPublicV2
        self.CollectionPrivatePath = /private/EvolvingCreaturesCollectionPrivateV2 // For linking provider capability
        self.nextCreatureID = 1
        self.totalSupply = 0

        // Initialize contract constants
        self.MAX_ACTIVE_CREATURES = 5
        self.SECONDS_PER_SIMULATED_DAY = 86400.0

        // Initialize contract state or emit event
        emit ContractInitialized()
    }

    // Required by NonFungibleToken.NFT contract interface
    access(all) fun getContractViews(resourceType: Type?): [Type] {
        return [
            Type<MetadataViews.NFTCollectionData>(),
            Type<MetadataViews.NFTCollectionDisplay>()
        ]
    }

    // Required by NonFungibleToken.NFT contract interface
    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<MetadataViews.NFTCollectionData>():
                return MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&EvolvingCreatures.Collection>(),
                    publicLinkedType: Type<&EvolvingCreatures.Collection>(),
                    createEmptyCollectionFunction: (fun (): @{NonFungibleToken.Collection} {
                        return <-EvolvingCreatures.createEmptyCollection(nftType: Type<@EvolvingCreatures.NFT>())
                    })
                )
            case Type<MetadataViews.NFTCollectionDisplay>():
                // Customize with actual data or placeholders
                let media = MetadataViews.Media(
                    file: MetadataViews.HTTPFile(url: "https://example.com/collection_banner.png"), // Placeholder
                    mediaType: "image/png" // Placeholder
                )
                return MetadataViews.NFTCollectionDisplay(
                    name: "Evolving Creatures Collection",
                    description: "A collection of unique, evolving digital creatures on the Flow blockchain.",
                    externalURL: MetadataViews.ExternalURL("https://example.com/evolving_creatures"), // Placeholder
                    squareImage: media, // Placeholder
                    bannerImage: media, // Placeholder
                    socials: {
                        "twitter": MetadataViews.ExternalURL("https://twitter.com/YourProject") // Placeholder
                    }
                )
        }
        return nil
    }
} 