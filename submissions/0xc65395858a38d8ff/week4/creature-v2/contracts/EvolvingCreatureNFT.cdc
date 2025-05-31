// EvolvingCreatureNFT.cdc
// Core contract for modular evolving creatures - COMPLETE MIGRATION FROM CreatureNFTV6

import "NonFungibleToken"
import "MetadataViews"
import "ViewResolver"
import "TraitModule"

access(all) contract EvolvingCreatureNFT: NonFungibleToken {
    
    // === CORE STATE ===
    access(all) var totalSupply: UInt64
    access(all) let MAX_ACTIVE_CREATURES: UInt64
    
    // === MODULE REGISTRY (from beta) ===
    access(self) var registeredModules: {String: Address} // moduleType -> contract address
    access(self) var moduleContracts: {String: String}    // moduleType -> contract name
    
    // === EVOLUTION CONSTANTS (from CreatureNFTV6) ===
    access(all) let TASA_APRENDIZAJE_HOMEOSTASIS_BASE: UFix64
    access(all) let TASA_EVOLUCION_PASIVA_GEN_BASE: UFix64
    access(all) let FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE: UFix64
    access(all) let PYTHON_MULTIPLIER: UFix64
    access(all) let MITOSIS_LIFESPAN_BASE_FACTOR: UFix64
    access(all) let MITOSIS_LIFESPAN_EP_BONUS_FACTOR: UFix64
    access(all) let MITOSIS_POTENCIAL_BASE_INHERITANCE_FACTOR: UFix64
    access(all) let MITOSIS_POTENCIAL_EP_BONUS_FACTOR: UFix64
    
    // === EVENTS ===
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event NFTMinted(id: UInt64, name: String, birthTimestamp: UFix64, birthBlockHeight: UInt64, lifespanTotalSimulatedDays: UFix64)
    access(all) event DescriptionUpdated(id: UInt64, newDescription: String)
    access(all) event EvolutionProcessed(creatureID: UInt64, processedSteps: UInt64, newAge: UFix64, evolutionPoints: UFix64)
    access(all) event CreatureDied(creatureID: UInt64, deathBlockHeight: UInt64, deathTimestamp: UFix64)
    access(all) event HomeostasisTargetSet(creatureID: UInt64, gene: String, target: UFix64)
    access(all) event InitialSeedChanged(creatureID: UInt64, oldSeed: UInt64, newSeed: UInt64, changeCount: UInt64, epCost: UFix64)
    access(all) event MitosisOccurred(parentID: UInt64, childID: UInt64, epCost: UFix64)
    access(all) event SexualReproductionOccurred(parent1ID: UInt64, parent2ID: UInt64, childID: UInt64)
    access(all) event ModuleRegistered(moduleType: String, contractAddress: Address, contractName: String)
    
    // === STORAGE PATHS ===
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath
    
    // === CORE NFT RESOURCE ===
    access(all) resource NFT: NonFungibleToken.NFT, ViewResolver.Resolver {
        access(all) let id: UInt64
        access(all) let birthTimestamp: UFix64
        access(all) let birthBlockHeight: UInt64
        access(all) let name: String
        access(all) var description: String
        access(all) var thumbnail: String // Dynamic image that changes with evolution
        
        // === DESTINY ENGINE (from CreatureNFTV6) ===
        access(all) var initialSeed: UInt64              // The creature's destiny
        access(all) var edadDiasCompletos: UFix64        // Universal age
        access(all) var puntosEvolucion: UFix64          // Universal energy
        access(all) var estaViva: Bool                   // Universal vital status
        access(all) let lifespanTotalSimulatedDays: UFix64 // Total lifespan
        access(all) var deathBlockHeight: UInt64?
        access(all) var deathTimestamp: UFix64?
        
        // === EVOLUTION TRACKING ===
        access(all) var lastEvolutionProcessedBlockHeight: UInt64
        access(all) var lastEvolutionProcessedTimestamp: UFix64
        access(all) var committedToRandomBlockHeight: UInt64?
        access(all) var currentActiveBeaconSeed: String?
        access(all) var lastBeaconSeedFetchedBlockHeight: UInt64?
        access(all) var simulatedDaysProcessedWithCurrentSeed: UInt64
        
        // === MODULAR TRAITS (from beta) ===
        access(all) var traits: @{String: {TraitModule.Trait}}
        
        // === HOMEOSTASIS TARGETS ===
        access(all) var homeostasisTargets: {String: UFix64}
        
        init(
            id: UInt64,
            name: String,
            description: String,
            thumbnail: String,
            birthBlockHeight: UInt64,
            lifespanDays: UFix64,
            initialTraits: @{String: {TraitModule.Trait}}
        ) {
            self.id = id
            self.birthTimestamp = getCurrentBlock().timestamp
            self.birthBlockHeight = birthBlockHeight
            self.name = name
            self.description = description
            self.thumbnail = thumbnail
            
            // Initialize destiny engine
            let timestampFactor = UInt64(self.birthTimestamp) % 1000000 // Prevent overflow
            self.initialSeed = self.id ^ timestampFactor ^ self.birthBlockHeight
            self.edadDiasCompletos = 0.0
            self.puntosEvolucion = 15.0 // Starting EP
            self.estaViva = true
            self.lifespanTotalSimulatedDays = lifespanDays
            self.deathBlockHeight = nil
            self.deathTimestamp = nil
            
            // Initialize evolution tracking
            self.lastEvolutionProcessedBlockHeight = birthBlockHeight
            self.lastEvolutionProcessedTimestamp = self.birthTimestamp
            self.committedToRandomBlockHeight = nil
            self.currentActiveBeaconSeed = nil
            self.lastBeaconSeedFetchedBlockHeight = nil
            self.simulatedDaysProcessedWithCurrentSeed = 0
            
            // Initialize modular traits
            self.traits <- initialTraits
            
            // Initialize homeostasis
            self.homeostasisTargets = {}
            self.homeostasisTargets["_seedChangeCount"] = 0.0
            
            emit NFTMinted(
                id: self.id,
                name: self.name,
                birthTimestamp: self.birthTimestamp,
                birthBlockHeight: self.birthBlockHeight,
                lifespanTotalSimulatedDays: self.lifespanTotalSimulatedDays
            )
        }
        
        // === DESTINY ENGINE METHODS ===
        
        // Generate 10 daily seeds (expanded from CreatureNFTV6's 5)
        access(all) fun generateDailySeeds(diaSimulado: UInt64): [UInt64] {
            let daySalt = diaSimulado * 127 // Prime factor
            let base = self.initialSeed ^ daySalt
            
            // Safe PRNG with overflow protection
            let a: UInt64 = 1664525
            let c: UInt64 = 1013904223
            let m: UInt64 = 4294967296 // 2^32 (safe limit)
            
            var seedState = base % m // Prevent initial overflow
            var seeds: [UInt64] = []
            
            // Generate 10 seeds (5 original + 5 new for more module variability)
            var i: Int = 0
            while i < 10 {
                // Safe multiplication with overflow protection
                let product = (seedState % 65536) * (a % 65536) // Split to prevent overflow
                seedState = (product + c) % m
                seeds.append(seedState)
                i = i + 1
            }
            
            return seeds
        }
        
        // Change initial seed (max 3 times, costs 10 EP) - from CreatureNFTV6
        access(all) fun changeInitialSeed(newSeedBase: UInt64): Bool {
            let seedChangeCount = self.homeostasisTargets["_seedChangeCount"] ?? 0.0
            
            if seedChangeCount >= 3.0 {
                return false // Max 3 changes
            }
            
            let epCost: UFix64 = 10.0
            if self.puntosEvolucion < epCost {
                return false // Not enough EP
            }
            
            let oldSeed = self.initialSeed
            let currentBlock = getCurrentBlock()
            let newSeed = newSeedBase ^ UInt64(currentBlock.timestamp * 100000.0) ^ currentBlock.height
            
            self.initialSeed = newSeed
            let newChangeCount = seedChangeCount + 1.0
            self.homeostasisTargets["_seedChangeCount"] = newChangeCount
            self.puntosEvolucion = self.puntosEvolucion - epCost
            
            emit InitialSeedChanged(
                creatureID: self.id,
                oldSeed: oldSeed,
                newSeed: newSeed,
                changeCount: UInt64(newChangeCount),
                epCost: epCost
            )
            
            return true
        }
        
        // === MODULAR TRAIT MANAGEMENT (from beta + lazy init) ===
        
        access(all) view fun getTraitValue(traitType: String): String? {
            if let traitRef = &self.traits[traitType] as &{TraitModule.Trait}? {
                return traitRef.getValue()
            }
            return nil
        }
        
        access(all) view fun getTraitDisplay(traitType: String): String? {
            if let traitRef = &self.traits[traitType] as &{TraitModule.Trait}? {
                return traitRef.getDisplayName()
            }
            return nil
        }
        
        access(all) fun setTraitValue(traitType: String, newValue: String) {
            if let traitRef = &self.traits[traitType] as &{TraitModule.Trait}? {
                traitRef.setValue(newValue: newValue)
            }
        }
        
        access(all) fun addTrait(traitType: String, trait: @{TraitModule.Trait}) {
            let oldTrait <- self.traits[traitType] <- trait
            destroy oldTrait
        }
        
        access(all) fun removeTrait(traitType: String): @{TraitModule.Trait}? {
            return <- self.traits.remove(key: traitType)
        }
        
        // NEW: Initialize traits with destiny-based seeds (10 seeds from day 0)
        access(all) fun initializeTraitsWithDestiny() {
            // Generate birth seeds (day 0) using the creature's destiny
            let birthSeeds = self.generateDailySeeds(diaSimulado: 0)
            
            // Get registered modules
            let registeredModules = EvolvingCreatureNFT.getRegisteredModules()
            
            // Initialize each module with specific seeds from the 10 available
            for i, moduleType in registeredModules {
                if let factory = EvolvingCreatureNFT.getModuleFactory(moduleType: moduleType) {
                    // Use different seeds for each module (cycling through the 10)
                    let seedIndex = i % birthSeeds.length
                    let moduleSeed = birthSeeds[seedIndex]
                    
                    // Try to create with seed if available, otherwise default
                    var newTrait: @{TraitModule.Trait}? <- nil
                    
                    // Check if factory has createTraitWithSeed method
                    switch moduleType {
                        case "visual":
                            newTrait <-! VisualTraitsModule.createTraitWithSeed(seed: moduleSeed)
                        case "combat":
                            newTrait <-! CombatStatsModule.createTraitWithSeed(seed: moduleSeed)
                        case "evolution":
                            newTrait <-! EvolutionPotentialModule.createTraitWithSeed(seed: moduleSeed)
                        case "metabolism":
                            newTrait <-! MetabolismModule.createTraitWithSeed(seed: moduleSeed)
                        default:
                            newTrait <-! factory.createDefaultTrait()
                    }
                    
                    if newTrait != nil {
                        self.addTrait(traitType: moduleType, trait: <-newTrait!)
                    } else {
                        destroy newTrait
                    }
                }
            }
        }
        
        // Lazy initialization (from beta)
        access(all) fun ensureTraitExists(traitType: String): Bool {
            if self.traits.containsKey(traitType) {
                return true
            }
            
            if let factory = EvolvingCreatureNFT.getModuleFactory(moduleType: traitType) {
                let defaultTrait <- factory.createDefaultTrait()
                self.addTrait(traitType: traitType, trait: <- defaultTrait)
                return true
            }
            
            return false
        }
        
        // === HOMEOSTASIS MANAGEMENT ===
        
        access(all) fun setHomeostasisTarget(gene: String, value: UFix64) {
            self.homeostasisTargets[gene] = value
            emit HomeostasisTargetSet(
                creatureID: self.id,
                gene: gene,
                target: value
            )
        }
        
        // === EVOLUTION COORDINATION ===
        
        // Dynamic evolution processing (like beta, but for all registered modules)
        access(all) fun evolve(steps: UInt64) {
            let seeds = self.generateDailySeeds(diaSimulado: UInt64(self.edadDiasCompletos))
            
            // Process ALL registered modules dynamically
            let registeredModules = EvolvingCreatureNFT.getRegisteredModules()
            
            for moduleType in registeredModules {
                // Lazy initialization if needed
                if !self.traits.containsKey(moduleType) {
                    if !self.ensureTraitExists(traitType: moduleType) {
                        continue // Skip if couldn't initialize
                    }
                }
                
                // Evolve the module
                if let traitRef = &self.traits[moduleType] as &{TraitModule.Trait}? {
                    traitRef.evolve(seeds: seeds)
                }
            }
            
            // === CROSS-MODULE COMMUNICATION ===
            // Apply visual influences to combat stats (like CreatureNFTV6)
            self.applyCrossModuleInfluences(seeds)
            
            // Gain EP (from CreatureNFTV6)
            self.gainEvolutionPointsForStep(seeds[0], steps)
            
            // Process aging and death
            self.processAging(steps)
            
            emit EvolutionProcessed(
                creatureID: self.id,
                processedSteps: steps,
                newAge: self.edadDiasCompletos,
                evolutionPoints: self.puntosEvolucion
            )
        }
        
        // Apply cross-module influences (visual -> combat, like CreatureNFTV6)
        // ONLY SYNTAX FIX: guard let → if let
        access(all) fun applyCrossModuleInfluences(_ seeds: [UInt64]) {
            // Get visual traits if available (FIXED: proper Cadence syntax)
            if let visualValue = self.getTraitValue(traitType: "visual") {
                if let combatRef = &self.traits["combat"] as &{TraitModule.Trait}? {
                    // Parse visual traits (simplified for now - would need proper parsing)
                    let visualData = self.parseVisualTraits(visualValue)
                    
                    // Apply influences to combat stats (simplified version of CreatureNFTV6 logic)
                    if seeds.length >= 3 {
                        self.influenceCombatFromVisual(combatRef, visualData, seeds[1], seeds[2])
                    }
                }
            }
        }
        
        // Parse visual trait data for cross-module communication
        access(self) fun parseVisualTraits(_ value: String): {String: UFix64} {
            // TODO: Parse actual visual trait string format
            // For now, return defaults (would need proper string parsing)
            return {
                "tamanoBase": 1.5,
                "formaPrincipal": 2.0,
                "numApendices": 4.0
            }
        }
        
        // Apply visual influences to combat (simplified CreatureNFTV6 logic)
        access(self) fun influenceCombatFromVisual(
            _ combatRef: &{TraitModule.Trait},
            _ visualData: {String: UFix64},
            _ seed1: UInt64,
            _ seed2: UInt64
        ) {
            // This would apply the complex visual->combat influences from CreatureNFTV6
            // For now, just a placeholder that could be expanded
            let potencial = self.getEvolutionPotential()
            let volatility = 0.5 + (UFix64(seed1 % 1000) / 999.0)
            let influenceBase = 0.0001 * potencial * volatility
            
            // Apply small adjustments based on visual traits
            // (This is a simplified version - full implementation would need detailed parsing)
        }
        
        // Get evolution potential from trait if available
        access(self) fun getEvolutionPotential(): UFix64 {
            if let evolutionValue = self.getTraitValue(traitType: "evolution") {
                // TODO: Parse potencial from evolution trait value
                return 1.0 // Placeholder
            }
            return 1.0
        }
        
        // Gain evolution points (from CreatureNFTV6)
        access(all) fun gainEvolutionPointsForStep(_ r0: UInt64, _ stepsPerDay: UInt64) {
            // Get potencialEvolutivo from traits (if exists)
            var potencialEvolutivo: UFix64 = 1.0
            if let evolutionValue = self.getTraitValue(traitType: "potencialEvolutivo") {
                potencialEvolutivo = UFix64.fromString(evolutionValue) ?? 1.0
            }
            
            // Age multiplier calculation
            let MAX_LIFESPAN_DAYS: UFix64 = 7.0
            let MAX_AGE_MULTIPLIER: UFix64 = 2.0
            let MIN_AGE_MULTIPLIER: UFix64 = 1.0
            
            let totalDecreaseOverLifespan = MAX_AGE_MULTIPLIER - MIN_AGE_MULTIPLIER
            var decreasePerDay: UFix64 = 0.0
            if MAX_LIFESPAN_DAYS > 0.0 {
                decreasePerDay = totalDecreaseOverLifespan / MAX_LIFESPAN_DAYS
            }
            
            let calculatedAgeMultiplier = MAX_AGE_MULTIPLIER - (self.edadDiasCompletos * decreasePerDay)
            let ageMultiplier = self.max(MIN_AGE_MULTIPLIER, calculatedAgeMultiplier)
            
            // EP calculation
            let PYTHON_BASE_FACTOR = 0.01
            let correctedRandomFactor = 0.5 + (UFix64(r0 % 101) / 100.0)
            
            let baseEPPerStep = potencialEvolutivo * PYTHON_BASE_FACTOR * EvolvingCreatureNFT.PYTHON_MULTIPLIER * ageMultiplier * correctedRandomFactor
            
            self.puntosEvolucion = self.puntosEvolucion + baseEPPerStep
        }
        
        // Process aging and death
        access(all) fun processAging(_ steps: UInt64) {
            self.edadDiasCompletos = self.edadDiasCompletos + UFix64(steps) / 100.0 // Adjust as needed
            
            // Check if creature should die
            if self.edadDiasCompletos >= self.lifespanTotalSimulatedDays && self.estaViva {
                self.estaViva = false
                let currentBlock = getCurrentBlock()
                self.deathBlockHeight = currentBlock.height
                self.deathTimestamp = currentBlock.timestamp
                
                emit CreatureDied(
                    creatureID: self.id,
                    deathBlockHeight: currentBlock.height,
                    deathTimestamp: currentBlock.timestamp
                )
            }
        }
        
        // === UTILITY FUNCTIONS ===
        
        access(self) fun max(_ a: UFix64, _ b: UFix64): UFix64 {
            if a > b { return a }
            return b
        }
        
        access(self) fun min(_ a: UFix64, _ b: UFix64): UFix64 {
            if a < b { return a }
            return b
        }
        
        // === METADATA VIEWS ===
        
        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Serial>()
            ]
        }
        
        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    var displayDescription = self.description
                    for traitType in self.traits.keys {
                        if let display = self.getTraitDisplay(traitType: traitType) {
                            displayDescription = displayDescription.concat("\n").concat(display)
                        }
                    }
                    
                    return MetadataViews.Display(
                        name: self.name.concat(" #").concat(self.id.toString()),
                        description: displayDescription,
                        thumbnail: MetadataViews.HTTPFile(url: self.thumbnail)
                    )
                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(self.id)
            }
            return nil
        }
        
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-EvolvingCreatureNFT.createEmptyCollection(nftType: Type<@EvolvingCreatureNFT.NFT>())
        }
        
        // === REPRODUCTION (from CreatureNFTV6) ===
        
        access(all) fun getReproductionData(): {String: AnyStruct} {
            let traitData: {String: String} = {}
            for traitType in self.traits.keys {
                if let value = self.getTraitValue(traitType: traitType) {
                    traitData[traitType] = value
                }
            }
            
            return {
                "id": self.id,
                "traits": traitData,
                "initialSeed": self.initialSeed,
                "puntosEvolucion": self.puntosEvolucion
            }
        }
    }
    
    // === COLLECTION RESOURCE ===
    access(all) resource Collection: NonFungibleToken.Collection {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}
        access(self) var activeCreatureIDs: [UInt64]
        
        init() {
            self.ownedNFTs <- {}
            self.activeCreatureIDs = []
        }
        
        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            
            // Remove from active creatures if exists
            var i = 0
            while i < self.activeCreatureIDs.length {
                if self.activeCreatureIDs[i] == withdrawID {
                    self.activeCreatureIDs.remove(at: i)
                    break
                }
                i = i + 1
            }
            
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }
        
        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @EvolvingCreatureNFT.NFT
            let id: UInt64 = token.id
            
            // Check if alive and manage limit
            if token.estaViva {
                if UInt64(self.activeCreatureIDs.length) >= EvolvingCreatureNFT.MAX_ACTIVE_CREATURES {
                    panic("Maximum active creatures limit reached")
                }
                
                // Check if already in list
                var found = false
                for activeID in self.activeCreatureIDs {
                    if activeID == id {
                        found = true
                        break
                    }
                }
                if !found {
                    self.activeCreatureIDs.append(id)
                }
            }
            
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }
        
        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }
        
        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
        }
        
        access(all) view fun borrowEvolvingCreatureNFT(id: UInt64): &EvolvingCreatureNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
                return ref as! &EvolvingCreatureNFT.NFT
            }
            return nil
        }
        
        access(all) fun borrowEvolvingCreatureNFTForUpdate(id: UInt64): auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as auth(Mutate, Insert, Remove) &{NonFungibleToken.NFT}?
                return ref as! auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.NFT
            }
            return nil
        }
        
        access(all) view fun getActiveCreatureIDs(): [UInt64] {
            return self.activeCreatureIDs
        }
        
        access(all) view fun getActiveCreatureCount(): UInt64 {
            return UInt64(self.activeCreatureIDs.length)
        }
        
        // Evolution for specific creature
        access(all) fun evolveCreature(id: UInt64, steps: UInt64) {
            if let creatureRef = self.borrowEvolvingCreatureNFTForUpdate(id: id) {
                creatureRef.evolve(steps: steps)
            }
        }
        
        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@EvolvingCreatureNFT.NFT>()] = true
            return supportedTypes
        }
        
        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@EvolvingCreatureNFT.NFT>()
        }
        
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-EvolvingCreatureNFT.createEmptyCollection(nftType: Type<@EvolvingCreatureNFT.NFT>())
        }
    }
    
    // === MINTER RESOURCE ===
    access(all) resource NFTMinter {
        access(all) fun mintNFT(
            name: String,
            description: String,
            thumbnail: String,
            lifespanDays: UFix64,
            initialTraits: @{String: {TraitModule.Trait}}
        ): @NFT {
            EvolvingCreatureNFT.totalSupply = EvolvingCreatureNFT.totalSupply + 1
            let newID = EvolvingCreatureNFT.totalSupply
            let currentBlock = getCurrentBlock()
            
            let nft <- create NFT(
                id: newID,
                name: name,
                description: description,
                thumbnail: thumbnail,
                birthBlockHeight: currentBlock.height,
                lifespanDays: lifespanDays,
                initialTraits: <- initialTraits
            )
            
            return <- nft
        }
    }
    
    // === PUBLIC FUNCTIONS ===
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }
    
    // === MODULE REGISTRY FUNCTIONS (from beta) ===
    access(all) fun registerModule(moduleType: String, contractAddress: Address, contractName: String) {
        self.registeredModules[moduleType] = contractAddress
        self.moduleContracts[moduleType] = contractName
        emit ModuleRegistered(moduleType: moduleType, contractAddress: contractAddress, contractName: contractName)
    }
    
    access(all) view fun getRegisteredModules(): [String] {
        return self.registeredModules.keys
    }
    
    access(all) view fun getModuleFactory(moduleType: String): &{TraitModule}? {
        if let contractAddress = self.registeredModules[moduleType] {
            if let contractName = self.moduleContracts[moduleType] {
                return getAccount(contractAddress).contracts.borrow<&{TraitModule}>(name: contractName)
            }
        }
        return nil
    }
    
    // === CONTRACT VIEW METHODS ===
    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return [
            Type<MetadataViews.NFTCollectionData>(),
            Type<MetadataViews.NFTCollectionDisplay>()
        ]
    }
    
    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<MetadataViews.NFTCollectionData>():
                return MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&EvolvingCreatureNFT.Collection>(),
                    publicLinkedType: Type<&EvolvingCreatureNFT.Collection>(),
                    createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                        return <-EvolvingCreatureNFT.createEmptyCollection(nftType: Type<@EvolvingCreatureNFT.NFT>())
                    })
                )
            case Type<MetadataViews.NFTCollectionDisplay>():
                let media = MetadataViews.Media(
                    file: MetadataViews.HTTPFile(url: "https://example.com/creature_collection_banner.png"),
                    mediaType: "image/png"
                )
                return MetadataViews.NFTCollectionDisplay(
                    name: "Evolving Creatures V2",
                    description: "A collection of unique, evolving digital creatures with modular genetics",
                    externalURL: MetadataViews.ExternalURL("https://example.com/creatures"),
                    squareImage: media,
                    bannerImage: media,
                    socials: {
                        "twitter": MetadataViews.ExternalURL("https://twitter.com/EvolvingCreatures")
                    }
                )
        }
        return nil
    }
    
    init() {
        // Initialize supply and limits
        self.totalSupply = 0
        self.MAX_ACTIVE_CREATURES = 5
        
        // Initialize module registry
        self.registeredModules = {}
        self.moduleContracts = {}
        
        // Initialize evolution constants (from CreatureNFTV6)
        self.TASA_APRENDIZAJE_HOMEOSTASIS_BASE = 0.05
        self.TASA_EVOLUCION_PASIVA_GEN_BASE = 0.001
        self.FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE = 0.0001
        self.PYTHON_MULTIPLIER = 20.0
        self.MITOSIS_LIFESPAN_BASE_FACTOR = 0.4
        self.MITOSIS_LIFESPAN_EP_BONUS_FACTOR = 0.005
        self.MITOSIS_POTENCIAL_BASE_INHERITANCE_FACTOR = 0.75
        self.MITOSIS_POTENCIAL_EP_BONUS_FACTOR = 0.001
        
        // Set storage paths
        self.CollectionStoragePath = /storage/EvolvingCreatureNFTCollection
        self.CollectionPublicPath = /public/EvolvingCreatureNFTCollection
        self.MinterStoragePath = /storage/EvolvingCreatureNFTMinter
        
        // Create and save minter with PUBLIC ACCESS
        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)
        
        // Publish PUBLIC minter capability (as requested)
        let minterCapability = self.account.capabilities.storage.issue<&EvolvingCreatureNFT.NFTMinter>(self.MinterStoragePath)
        self.account.capabilities.publish(minterCapability, at: /public/EvolvingCreatureNFTMinter)
        
        emit ContractInitialized()
    }
} 