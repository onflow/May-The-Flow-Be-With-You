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
    access(all) event SexualReproductionFailed(parent1ID: UInt64, parent2ID: UInt64, reason: String, successChance: UFix64, randomRoll: UFix64)
    access(all) event ModuleRegistered(moduleType: String, contractAddress: Address, contractName: String)
    access(all) event ReproductionOpportunityDetected(creature1ID: UInt64, creature2ID: UInt64, compatibilityScore: UFix64, windowExpires: UFix64)
    
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
                    
                    // Use factory to create trait with seed
                    let newTrait <- factory.createTraitWithSeed(seed: moduleSeed)
                    self.addTrait(traitType: moduleType, trait: <- newTrait)
                    
                    // Log the seed used for this module
                    log("Module ".concat(moduleType).concat(" initialized with seed: ").concat(moduleSeed.toString()))
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
        
        // OPTIMIZED: Accumulative evolution processing (days + partial steps)
        access(all) fun evolve(simulatedSecondsPerDay: UFix64) {
            if !self.estaViva {
                return // Dead creatures don't evolve
            }
            
            let STEPS_PER_DAY: UInt64 = 250
            
            // Calculate elapsed time since last evolution
            let currentTimestamp = getCurrentBlock().timestamp
            let elapsedSeconds = currentTimestamp - self.lastEvolutionProcessedTimestamp
            let secondsPerStep = simulatedSecondsPerDay / UFix64(STEPS_PER_DAY)
            let elapsedSteps = UInt64(elapsedSeconds / secondsPerStep)
            
            if elapsedSteps == 0 {
                // Not enough time has passed to process even one step
                self.lastEvolutionProcessedBlockHeight = getCurrentBlock().height
                self.lastEvolutionProcessedTimestamp = currentTimestamp
                return
            }
            
            // Calculate days and partial steps
            let initialDay = UInt64(self.edadDiasCompletos)
            let completeDays = elapsedSteps / STEPS_PER_DAY
            let partialSteps = elapsedSteps % STEPS_PER_DAY
            
            var totalProcessedSteps: UInt64 = 0
            let registeredModules = EvolvingCreatureNFT.getRegisteredModules()
            
            // Process complete days efficiently
            var dayIndex: UInt64 = 0
            while dayIndex < completeDays && self.estaViva {
                let currentDay = initialDay + dayIndex
                let dailySeeds = self.generateDailySeeds(diaSimulado: currentDay)
                
                // Process each module for this complete day
                for moduleType in registeredModules {
                    if !self.traits.containsKey(moduleType) {
                        if !self.ensureTraitExists(traitType: moduleType) {
                            continue
                        }
                    }
                    
                    if let traitRef = &self.traits[moduleType] as &{TraitModule.Trait}? {
                        traitRef.evolveAccumulative(seeds: dailySeeds, steps: STEPS_PER_DAY)
                    }
                }
                
                // Apply cross-module influences once per day
                self.applyCrossModuleInfluencesOptimized(dailySeeds)
                
                // Gain EP for this day (accumulative)
                self.gainEvolutionPointsForDay(dailySeeds[0], STEPS_PER_DAY)
                
                // Age by one full day
                self.edadDiasCompletos = self.edadDiasCompletos + 1.0
                totalProcessedSteps = totalProcessedSteps + STEPS_PER_DAY
                
                // Check for death after each complete day
                if self.edadDiasCompletos >= self.lifespanTotalSimulatedDays {
                    self.estaViva = false
                    let currentBlock = getCurrentBlock()
                    self.deathBlockHeight = currentBlock.height
                    self.deathTimestamp = currentBlock.timestamp
                    
                    emit CreatureDied(
                        creatureID: self.id,
                        deathBlockHeight: currentBlock.height,
                        deathTimestamp: currentBlock.timestamp
                    )
                    break
                }
                
                dayIndex = dayIndex + 1
            }
            
            // Process remaining partial steps if alive
            if partialSteps > 0 && self.estaViva {
                let currentDay = initialDay + completeDays
                let dailySeeds = self.generateDailySeeds(diaSimulado: currentDay)
                
                // Process each module for partial steps
                for moduleType in registeredModules {
                    if !self.traits.containsKey(moduleType) {
                        if !self.ensureTraitExists(traitType: moduleType) {
                            continue
                        }
                    }
                    
                    if let traitRef = &self.traits[moduleType] as &{TraitModule.Trait}? {
                        traitRef.evolveAccumulative(seeds: dailySeeds, steps: partialSteps)
                    }
                }
                
                // Gain EP for partial steps
                self.gainEvolutionPointsForSteps(dailySeeds[0], partialSteps, STEPS_PER_DAY)
                
                // Age by partial day
                self.edadDiasCompletos = self.edadDiasCompletos + (UFix64(partialSteps) / UFix64(STEPS_PER_DAY))
                totalProcessedSteps = totalProcessedSteps + partialSteps
            }
            
            // Update evolution tracking
            self.lastEvolutionProcessedBlockHeight = getCurrentBlock().height
            self.lastEvolutionProcessedTimestamp = currentTimestamp
            
            emit EvolutionProcessed(
                creatureID: self.id,
                processedSteps: totalProcessedSteps,
                newAge: self.edadDiasCompletos,
                evolutionPoints: self.puntosEvolucion
            )
            
            // NOTE: Reproduction opportunities will be evaluated at the Collection level
        }
        
        // NEW: Evaluate reproduction opportunities after evolution
        access(all) fun evaluateReproductionOpportunities(otherCreatures: [&NFT]) {
            // Only check if this creature is alive and has reproduction trait
            if !self.estaViva || !self.traits.containsKey("reproduction") {
                return
            }
            
            // Get direct reference to this creature's reproduction trait
            if let myReproTrait = &self.traits["reproduction"] as &{TraitModule.Trait}? {
                // Check if this creature is ready for reproduction first - get display name directly from trait
                let myReproDisplay = myReproTrait.getDisplayName()
                
                // Parse maturity from reproduction display (simplified check)
                let isMaturitySufficient = myReproDisplay.contains("🐓Adult") || myReproDisplay.contains("🦅Mature")
                if !isMaturitySufficient {
                    return // Not mature enough
                }
                
                // CRITICAL: Access the actual ReproductionStatus resource to update candidates
                // This requires importing the contract and proper casting
                if let reproModule = getAccount(0x2444e6b4d9327f09).contracts.borrow<&{TraitModule}>(name: "ReproductionModuleV2") {
                    
                    // Clear previous candidates first (daily reset)
                    let clearSuccess = myReproTrait.clearReproductionCandidates(reason: "daily_evaluation")
                    log("Cleared previous reproduction candidates for creature #".concat(self.id.toString()).concat(": ").concat(clearSuccess ? "SUCCESS" : "FAILED"))
                    
                    var candidatesFound: UInt64 = 0
                    let currentTimestamp = getCurrentBlock().timestamp
                    
                    // Check each other creature for compatibility
                    for otherCreature in otherCreatures {
                        if otherCreature.id == self.id || !otherCreature.estaViva {
                            continue // Skip self and dead creatures
                        }
                        
                        if !otherCreature.traits.containsKey("reproduction") {
                            continue // Skip creatures without reproduction
                        }
                        
                        // Check if other creature is also mature
                        if let otherReproTrait = otherCreature.traits["reproduction"] as &{TraitModule.Trait}? {
                            let otherReproDisplay = otherReproTrait.getDisplayName()
                            let otherIsMaturitySufficient = otherReproDisplay.contains("🐓Adult") || otherReproDisplay.contains("🦅Mature")
                            
                            if !otherIsMaturitySufficient {
                                continue
                            }
                            
                            // TODO: Use real compatibility calculation from module
                            // For now, simplified compatibility calculation
                            let baseCompatibility: UFix64 = 0.25 // BASE_REPRODUCTION_CHANCE
                            let fertilitySimilarity: UFix64 = 0.3 // Simplified fertility factor
                            let maturityBonus: UFix64 = 0.2 // Both are mature
                            
                            let compatibilityScore = baseCompatibility + fertilitySimilarity + maturityBonus
                            
                            if compatibilityScore >= 0.3 { // 30% minimum
                                candidatesFound = candidatesFound + 1
                                
                                // Add candidate to the actual reproduction trait using new interface method
                                let addSuccess = myReproTrait.addReproductionCandidate(partnerID: otherCreature.id, compatibilityScore: compatibilityScore)
                                
                                // Emit reproduction opportunity event
                                emit ReproductionOpportunityDetected(
                                    creature1ID: self.id,
                                    creature2ID: otherCreature.id,
                                    compatibilityScore: compatibilityScore,
                                    windowExpires: currentTimestamp + 86400.0 // 24 hours
                                )
                                
                                // Log for debugging
                                log("Reproduction opportunity detected: Creature #".concat(self.id.toString())
                                    .concat(" can mate with Creature #").concat(otherCreature.id.toString())
                                    .concat(" (compatibility: ").concat(compatibilityScore.toString()).concat(")"))
                                
                                if addSuccess {
                                    log("Candidate #".concat(otherCreature.id.toString()).concat(" added to reproduction list of creature #").concat(self.id.toString()))
                                }
                            }
                        }
                    }
                    
                    if candidatesFound > 0 {
                        log("Creature #".concat(self.id.toString()).concat(" found ").concat(candidatesFound.toString()).concat(" potential mates"))
                        log("Reproduction candidates successfully updated in trait module")
                    }
                }
            }
        }
        
        // OPTIMIZED: Simplified cross-module influences without string parsing
        access(all) fun applyCrossModuleInfluencesOptimized(_ seeds: [UInt64]) {
            // Skip cross-module influences to avoid computation limits
            // Use seeds directly without parsing visual traits
            if let combatRef = &self.traits["combat"] as &{TraitModule.Trait}? {
                if seeds.length >= 3 {
                    // Simple influence using seeds instead of parsing
                    combatRef.evolve(seeds: [seeds[1], seeds[2], seeds[0]])
                }
            }
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
            // Parse actual visual trait string format: "R:0.72|G:0.86|B:0.20|Size:0.50|Form:1.08|Apps:5.39|Mov:2.32"
            var result: {String: UFix64} = {
                "tamanoBase": 1.5,        // Default fallback
                "formaPrincipal": 2.0,    // Default fallback  
                "numApendices": 4.0       // Default fallback
            }
            
            // Split by | to get individual components
            let components = value.split(separator: "|")
            
            for component in components {
                let parts = component.split(separator: ":")
                if parts.length >= 2 {
                    let key = parts[0]
                    let valueStr = parts[1]
                    
                    if let parsedValue = UFix64.fromString(valueStr) {
                        switch key {
                            case "Size":
                                result["tamanoBase"] = parsedValue
                            case "Form":
                                result["formaPrincipal"] = parsedValue
                            case "Apps":
                                result["numApendices"] = parsedValue
                        }
                    }
                }
            }
            
            return result
        }
        
        // Apply visual influences to combat (simplified CreatureNFTV6 logic)
        access(self) fun influenceCombatFromVisual(
            _ combatRef: &{TraitModule.Trait},
            _ visualData: {String: UFix64},
            _ seed1: UInt64,
            _ seed2: UInt64
        ) {
            // Get evolution potential and calculate influence base (from CreatureNFTV6)
            let potencial = self.getEvolutionPotential()
            let volatility = 0.5 + (UFix64(seed1 % 1000) / 999.0)
            let influenceBase = EvolvingCreatureNFT.FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE * potencial * volatility
            
            // Get current combat values
            let currentCombatValue = combatRef.getValue()
            
            // Apply visual influences using the REAL visual trait values
            let tamanoBase = visualData["tamanoBase"]!
            let formaPrincipal = visualData["formaPrincipal"]!
            let numApendices = visualData["numApendices"]!
            
            // Create updated combat trait value with influences applied
            var updatedValue = currentCombatValue
            
            // Size influences (like CreatureNFTV6)
            // Normalize size: 0.5-3.0 → -1.0 to +1.0 (safely)
            var sizeInfluence: UFix64 = 0.0
            var isBigCreature = true
            if tamanoBase >= 1.75 {
                sizeInfluence = (tamanoBase - 1.75) / 1.25
                isBigCreature = true
            } else {
                sizeInfluence = (1.75 - tamanoBase) / 1.25
                isBigCreature = false
            }
            
            // Form influences 
            // 1.0 = Agile, 2.0 = Tank, 3.0 = Attacker
            let isAgileForm = formaPrincipal < 1.5
            let isTankForm = formaPrincipal >= 1.5 && formaPrincipal < 2.5
            let isAttackerForm = formaPrincipal >= 2.5
            
            // Appendices influence (0.0-8.0, optimal around 4.0 for agility)
            var distanceFromOptimal: UFix64 = 0.0
            if numApendices >= 4.0 {
                distanceFromOptimal = numApendices - 4.0
            } else {
                distanceFromOptimal = 4.0 - numApendices
            }
            let appendicesInfluence = 1.0 - (distanceFromOptimal / 4.0) // 0.0-1.0, peak at 4.0
            
            // Visual influences calculated (logging removed for performance)
            
            // Apply the influences by modifying the combat trait through evolution
            // This triggers the CombatStatsModule's own applyVisualInfluence logic
            // which will use these real values instead of defaults
            combatRef.evolve(seeds: [seed1, seed2, UInt64(tamanoBase * 1000.0), UInt64(formaPrincipal * 1000.0), UInt64(numApendices * 1000.0)])
        }
        
        // Get evolution potential from trait if available
        access(self) fun getEvolutionPotential(): UFix64 {
            if let evolutionValue = self.getTraitValue(traitType: "evolution") {
                // TODO: Parse potencial from evolution trait value
                return 1.0 // Placeholder
            }
            return 1.0
        }
        
        // Gain evolution points for a full day (accumulative)
        access(all) fun gainEvolutionPointsForDay(_ r0: UInt64, _ stepsPerDay: UInt64) {
            self.gainEvolutionPointsForSteps(r0, stepsPerDay, stepsPerDay)
        }
        
        // Gain evolution points for specific number of steps (accumulative)
        access(all) fun gainEvolutionPointsForSteps(_ baseSeed: UInt64, _ steps: UInt64, _ stepsPerDay: UInt64) {
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
            
            // Accumulative EP calculation - simulate each step's randomness
            var totalEP: UFix64 = 0.0
            var stepSeed = baseSeed
            let PYTHON_BASE_FACTOR = 0.01
            
            var i: UInt64 = 0
            while i < steps {
                // Generate step-specific random (maintaining granularity)
                stepSeed = (stepSeed * 1664525 + 1013904223) % 4294967296
                let correctedRandomFactor = 0.5 + (UFix64(stepSeed % 101) / 100.0)
                
                let baseEPPerStep = potencialEvolutivo * PYTHON_BASE_FACTOR * EvolvingCreatureNFT.PYTHON_MULTIPLIER * ageMultiplier * correctedRandomFactor
                totalEP = totalEP + baseEPPerStep
                
                i = i + 1
            }
            
            self.puntosEvolucion = self.puntosEvolucion + totalEP
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
        
        access(self) fun absFix64(_ value: UFix64): UFix64 {
            return value // UFix64 is always positive
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
        
        // Método para realizar mitosis (reproducción asexual)
        access(all) fun performMitosis(epCost: UFix64): @NFT? {
            // Verificar si la criatura está viva
            if !self.estaViva {
                return nil
            }
            
            // Verificar si tiene suficientes EP
            if self.puntosEvolucion < epCost {
                return nil
            }
            
            // Deducir EP
            self.puntosEvolucion = self.puntosEvolucion - epCost
            
            // Generar semilla para el descendiente
            let currentBlock = getCurrentBlock()
            let timestampFactor = UInt64(currentBlock.timestamp) % 1000000
            let childSeed = self.initialSeed ^ timestampFactor ^ currentBlock.height
            
            // Crear traits del hijo usando mitosis
            let childTraits: @{String: {TraitModule.Trait}} <- {}
            let registeredModules = EvolvingCreatureNFT.getRegisteredModules()
            
            for i, moduleType in registeredModules {
                if let factory = EvolvingCreatureNFT.getModuleFactory(moduleType: moduleType) {
                    if let parentTrait = &self.traits[moduleType] as &{TraitModule.Trait}? {
                        // Usar semilla específica para cada módulo
                        let moduleSeed = childSeed ^ UInt64(i * 1000)
                        let childTrait <- factory.createMitosisChild(parent: parentTrait, seed: moduleSeed)
                        childTraits[moduleType] <-! childTrait
                    } else {
                        // Si no existe el trait en el padre, crear uno por defecto
                        let defaultTrait <- factory.createDefaultTrait()
                        childTraits[moduleType] <-! defaultTrait
                    }
                }
            }
            
            // NUEVO SISTEMA: EP gastado = esperanza de vida directa
            // 10 EP mínimo = 1 día, cada EP adicional = +0.5 días
            let minimumEP: UFix64 = 10.0
            let minimumLifespan: UFix64 = 1.0  // 1 día mínimo
            let epBonus = (epCost - minimumEP) * 0.5  // Cada EP extra = +0.5 días
            let childLifespan = minimumLifespan + epBonus
            
            // Asegurar rango razonable (1-15 días máximo)
            let finalChildLifespan = childLifespan > 15.0 ? 15.0 : childLifespan
            
            // Crear nueva criatura
            EvolvingCreatureNFT.totalSupply = EvolvingCreatureNFT.totalSupply + 1
            let newID = EvolvingCreatureNFT.totalSupply
            
            let newCreature <- create NFT(
                id: newID,
                name: "Child of ".concat(self.name),
                description: "Born from mitosis of creature #".concat(self.id.toString()).concat(" with ").concat(epCost.toString()).concat(" EP investment"),
                thumbnail: self.thumbnail,
                birthBlockHeight: currentBlock.height,
                lifespanDays: finalChildLifespan,
                initialTraits: <- childTraits
            )
            
                    // Emitir evento
        emit MitosisOccurred(
            parentID: self.id,
            childID: newID,
            epCost: epCost
        )
        
        return <-newCreature
    }
    
    // Método para realizar reproducción sexual (como mitosis pero con dos padres)
    access(all) fun performSexualReproduction(partner: &NFT): @NFT? {
        // Verificar que ambas criaturas están vivas
        if !self.estaViva || !partner.estaViva {
            return nil
        }
        
        // Verificar que ambas tienen trait de reproducción
        if !self.traits.containsKey("reproduction") || !partner.traits.containsKey("reproduction") {
            return nil
        }
        
        // Acceder a traits usando if let para manejar opcionales
        if let myReproTrait = &self.traits["reproduction"] as &{TraitModule.Trait}? {
            if let partnerReproTrait = partner.traits["reproduction"] as &{TraitModule.Trait}? {
                
                // Verificar candidatos usando interfaz genérica
                let myCandidates = myReproTrait.getReproductionCandidates()
                let partnerCandidates = partnerReproTrait.getReproductionCandidates()
                
                if !myCandidates.contains(partner.id) || !partnerCandidates.contains(self.id) {
                    return nil // No mutual candidates
                }
                
                // Probabilidad de reproducción sexual realista
                let successChance: UFix64 = 0.6 // 60% success rate
                
                // Generar número aleatorio para determinar éxito
                let currentBlock = getCurrentBlock()
                let randomSeed = UInt64(currentBlock.timestamp) ^ currentBlock.height ^ self.id ^ partner.id
                let randomValue = UFix64(randomSeed % 1000) / 999.0
                
                if randomValue > successChance {
                    // Reproducción falló, emitir evento y limpiar candidatos
                    emit SexualReproductionFailed(
                        parent1ID: self.id,
                        parent2ID: partner.id,
                        reason: "random_chance_failed",
                        successChance: successChance,
                        randomRoll: randomValue
                    )
                    myReproTrait.clearReproductionCandidates(reason: "reproduction_failed")
                    partnerReproTrait.clearReproductionCandidates(reason: "reproduction_failed")
                    return nil
                }
                
                // === CREAR DESCENDENCIA ===
                
                // Generar seed único para el hijo (safe from overflow)
                let timestampSafe = UInt64(currentBlock.timestamp) % 1000000 // Prevent overflow
                let childSeed = randomSeed ^ (timestampSafe * 1000)
                
                // Crear traits del hijo usando reproducción sexual de cada módulo
                let childTraits: @{String: {TraitModule.Trait}} <- {}
                let registeredModules = EvolvingCreatureNFT.getRegisteredModules()
                
                for i, moduleType in registeredModules {
                    if let factory = EvolvingCreatureNFT.getModuleFactory(moduleType: moduleType) {
                        if let myTrait = &self.traits[moduleType] as &{TraitModule.Trait}? {
                            if let partnerTrait = partner.traits[moduleType] as &{TraitModule.Trait}? {
                                // Usar semilla específica para cada módulo (safe from overflow)
                                let moduleSeed = childSeed ^ (UInt64(i) * 1000)
                                let childTrait <- factory.createChildTrait(
                                    parent1: myTrait, 
                                    parent2: partnerTrait, 
                                    seed: moduleSeed
                                )
                                childTraits[moduleType] <-! childTrait
                            }
                        }
                    }
                }
                
                // NUEVO SISTEMA: Esperanza de vida depende de los padres
                // Base: promedio de padres, modificado por salud y EP
                let avgLifespan = (self.lifespanTotalSimulatedDays + partner.lifespanTotalSimulatedDays) / 2.0
                
                // Factor de salud de padres (basado en EP actuales vs máximo posible)
                let myHealthFactor = self.puntosEvolucion / 50.0  // Normalizar EP (asumiendo ~50 EP como saludable)
                let partnerHealthFactor = partner.puntosEvolucion / 50.0
                let avgHealthFactor = (myHealthFactor + partnerHealthFactor) / 2.0
                
                // Factor de edad de padres (criaturas jóvenes dan hijos más saludables)
                let myAgeFactor = 1.0 - (self.edadDiasCompletos / self.lifespanTotalSimulatedDays)  // 1.0 = joven, 0.0 = viejo
                let partnerAgeFactor = 1.0 - (partner.edadDiasCompletos / partner.lifespanTotalSimulatedDays)
                let avgAgeFactor = (myAgeFactor + partnerAgeFactor) / 2.0
                
                // Calcular esperanza de vida final
                let healthBonus = avgHealthFactor > 1.0 ? (avgHealthFactor - 1.0) * 2.0 : 0.0  // Máximo +2 días por salud
                let ageBonus = avgAgeFactor * 3.0  // Máximo +3 días por juventud
                let hybridVigor = 1.0  // Bonus fijo por reproducción sexual
                
                let childLifespan = avgLifespan + healthBonus + ageBonus + hybridVigor
                
                // Asegurar rango razonable (2-12 días para sexual)
                let finalChildLifespan = childLifespan > 12.0 ? 12.0 : (childLifespan < 2.0 ? 2.0 : childLifespan)
                
                // Crear nueva criatura
                EvolvingCreatureNFT.totalSupply = EvolvingCreatureNFT.totalSupply + 1
                let newID = EvolvingCreatureNFT.totalSupply
                
                let newCreature <- create NFT(
                    id: newID,
                    name: "Hybrid of ".concat(self.name).concat(" & ").concat(partner.name),
                    description: "Born from sexual reproduction between creatures #".concat(self.id.toString()).concat(" and #").concat(partner.id.toString()).concat(" (lifespan: ").concat(finalChildLifespan.toString()).concat(" days)"),
                    thumbnail: self.thumbnail,
                    birthBlockHeight: currentBlock.height,
                    lifespanDays: finalChildLifespan,
                    initialTraits: <- childTraits
                )
                
                // Solo limpiar candidatos (no hay método recordReproductionSuccess en interfaz)
                myReproTrait.clearReproductionCandidates(reason: "reproduction_successful")
                partnerReproTrait.clearReproductionCandidates(reason: "reproduction_successful")
                
                // Emitir evento
                emit SexualReproductionOccurred(
                    parent1ID: self.id,
                    parent2ID: partner.id,
                    childID: newID
                )
                
                return <-newCreature
                
            } else {
                return nil // Partner doesn't have reproduction trait
            }
        } else {
            return nil // Self doesn't have reproduction trait
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
            self.removeFromActiveCreatures(id: withdrawID)
            
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

        // Helper method to remove creature from active list
        access(self) fun removeFromActiveCreatures(id: UInt64) {
            var i = 0
            while i < self.activeCreatureIDs.length {
                if self.activeCreatureIDs[i] == id {
                    self.activeCreatureIDs.remove(at: i)
                    break
                }
                i = i + 1
            }
        }

        // Cleanup method to remove dead creatures from active list
        access(all) fun cleanupDeadCreatures(): UInt64 {
            var removedCount: UInt64 = 0
            var i = 0
            
            while i < self.activeCreatureIDs.length {
                let creatureID = self.activeCreatureIDs[i]
                if let creature = self.borrowEvolvingCreatureNFT(id: creatureID) {
                    if !creature.estaViva {
                        self.activeCreatureIDs.remove(at: i)
                        removedCount = removedCount + 1
                        // Don't increment i since we removed an element
                    } else {
                        i = i + 1
                    }
                } else {
                    // Creature doesn't exist, remove from active list
                    self.activeCreatureIDs.remove(at: i)
                    removedCount = removedCount + 1
                    // Don't increment i since we removed an element
                }
            }
            
            return removedCount
        }
        
        // Evolution for specific creature (updated for time-based simulation)
        access(all) fun evolveCreature(id: UInt64, simulatedSecondsPerDay: UFix64) {
            if let creatureRef = self.borrowEvolvingCreatureNFTForUpdate(id: id) {
                let wasAlive = creatureRef.estaViva
                creatureRef.evolve(simulatedSecondsPerDay: simulatedSecondsPerDay)
                
                // If creature died during evolution, remove from active list
                if wasAlive && !creatureRef.estaViva {
                    self.removeFromActiveCreatures(id: id)
                }
                
                // After evolution, evaluate reproduction opportunities with other creatures (only if alive)
                if creatureRef.estaViva {
                    let otherCreatures: [&NFT] = []
                    for otherID in self.getIDs() {
                        if otherID != id {
                            if let otherCreature = self.borrowEvolvingCreatureNFT(id: otherID) {
                                if otherCreature.estaViva { // Only include living creatures
                                    otherCreatures.append(otherCreature)
                                }
                            }
                        }
                    }
                    
                    creatureRef.evaluateReproductionOpportunities(otherCreatures: otherCreatures)
                }
            }
        }
        
        // Perform mitosis on specific creature
        access(all) fun performMitosis(creatureID: UInt64, epCost: UFix64): Bool {
            // Verificar límite de criaturas activas
            if UInt64(self.activeCreatureIDs.length) >= EvolvingCreatureNFT.MAX_ACTIVE_CREATURES {
                return false // No space for new creature
            }
            
            // Obtener referencia a la criatura padre
            if let parentRef = self.borrowEvolvingCreatureNFTForUpdate(id: creatureID) {
                // Realizar mitosis
                if let childNFT <- parentRef.performMitosis(epCost: epCost) {
                    // Depositar el nuevo NFT en la colección
                    self.deposit(token: <-childNFT)
                    return true
                }
            }
            return false
        }
        
        // Perform sexual reproduction between two creatures
        access(all) fun performSexualReproduction(parent1ID: UInt64, parent2ID: UInt64): Bool {
            // Verificar límite de criaturas activas
            if UInt64(self.activeCreatureIDs.length) >= EvolvingCreatureNFT.MAX_ACTIVE_CREATURES {
                return false // No space for new creature
            }
            
            // Obtener referencias a ambos padres
            if let parent1Ref = self.borrowEvolvingCreatureNFTForUpdate(id: parent1ID) {
                if let parent2Ref = self.borrowEvolvingCreatureNFT(id: parent2ID) {
                    // Realizar reproducción sexual
                    if let childNFT <- parent1Ref.performSexualReproduction(partner: parent2Ref) {
                        // Depositar el nuevo NFT en la colección
                        self.deposit(token: <-childNFT)
                        return true
                    }
                }
            }
            return false
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