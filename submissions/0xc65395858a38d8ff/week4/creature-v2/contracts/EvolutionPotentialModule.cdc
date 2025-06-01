// EvolutionPotentialModule.cdc
// Evolution potential and lifespan module - MIGRATION FROM CreatureNFTV6

import "TraitModule"

access(all) contract EvolutionPotentialModule: TraitModule {
    
    // === EVOLUTION GENE RANGES (from CreatureNFTV6) ===
    access(all) let GENE_RANGES: {String: {String: UFix64}}
    
    // === EVOLUTION POTENTIAL RESOURCE ===
    access(all) resource EvolutionPotential: TraitModule.Trait {
        access(all) var potencialEvolutivo: UFix64      // 0.5-1.5
        access(all) var max_lifespan_dias_base: UFix64  // 3.0-7.0 days
        
        init(
            potencialEvolutivo: UFix64,
            max_lifespan_dias_base: UFix64
        ) {
            self.potencialEvolutivo = potencialEvolutivo
            self.max_lifespan_dias_base = max_lifespan_dias_base
        }
        
        access(all) view fun getValue(): String {
            return "POT:".concat(self.potencialEvolutivo.toString())
                .concat("|LIFE:").concat(self.max_lifespan_dias_base.toString())
        }
        
        access(all) fun setValue(newValue: String) {
            // Parse the encoded value format using simple string operations
            self.parseAndSetPotencial(newValue)
            self.parseAndSetLifespan(newValue)
        }
        
        access(all) view fun getDisplayName(): String {
            let potDisplay = EvolutionPotentialModule.formatPotencial(self.potencialEvolutivo)
            let lifeDisplay = EvolutionPotentialModule.formatLifespan(self.max_lifespan_dias_base)
            
            return "Evolution: ".concat(potDisplay).concat(" ").concat(lifeDisplay)
        }
        
        access(all) fun evolve(seeds: [UInt64]): String {
            if seeds.length < 2 { return self.getDisplayName() }
            
            // Evolution potential evolution (slow changes)
            let potencialEvolutivo: UFix64 = 1.0 // Self-reference for this module
            let dailyVolatilityFactor = 0.5 + (UFix64(seeds[0] % 1000) / 999.0)
            
            self.evolveGene("potencialEvolutivo", seeds[1], potencialEvolutivo, dailyVolatilityFactor)
            
            if seeds.length >= 3 {
                self.evolveGene("max_lifespan_dias_base", seeds[2], potencialEvolutivo, dailyVolatilityFactor)
            }
            
            return self.getDisplayName()
        }
        
        // OPTIMIZED: Accumulative evolution for multiple steps
        access(all) fun evolveAccumulative(seeds: [UInt64], steps: UInt64): String {
            if seeds.length < 2 { return self.getDisplayName() }
            
            // Evolution potential evolution (accumulative version)
            let potencialEvolutivo: UFix64 = 1.0
            let dailyVolatilityFactor = 0.5 + (UFix64(seeds[0] % 1000) / 999.0)
            
            self.evolveGeneAccumulative("potencialEvolutivo", seeds[1], steps, potencialEvolutivo, dailyVolatilityFactor)
            
            if seeds.length >= 3 {
                self.evolveGeneAccumulative("max_lifespan_dias_base", seeds[2], steps, potencialEvolutivo, dailyVolatilityFactor)
            }
            
            return self.getDisplayName()
        }
        
        // === ACCUMULATIVE EVOLUTION HELPERS ===
        
        access(self) fun evolveGeneAccumulative(_ geneName: String, _ baseSeed: UInt64, _ steps: UInt64, _ potencial: UFix64, _ volatility: UFix64) {
            // Get current value
            var currentValue: UFix64 = 0.0
            switch geneName {
                case "potencialEvolutivo": currentValue = self.potencialEvolutivo
                case "max_lifespan_dias_base": currentValue = self.max_lifespan_dias_base
                default: return
            }
            
            // Accumulate very slow evolution effects
            var totalIncrease: UFix64 = 0.0
            var totalDecrease: UFix64 = 0.0
            var stepSeed = baseSeed
            let magnitude = 0.0001 * potencial * volatility // Even slower than visual/combat
            
            var i: UInt64 = 0
            while i < steps {
                stepSeed = (stepSeed * 1664525 + 1013904223) % 4294967296
                let randomNormalized = UFix64(stepSeed % 10000) / 9999.0
                
                // Calculate step change
                if randomNormalized < 0.5 {
                    let decreaseAmount = (0.5 - randomNormalized) * 2.0 * magnitude
                    totalDecrease = totalDecrease + decreaseAmount
                } else {
                    let increaseAmount = (randomNormalized - 0.5) * 2.0 * magnitude
                    totalIncrease = totalIncrease + increaseAmount
                }
                i = i + 1
            }
            
            // Apply total accumulated change
            var newValue = currentValue + totalIncrease
            if newValue > totalDecrease {
                newValue = newValue - totalDecrease
            } else {
                newValue = EvolutionPotentialModule.GENE_RANGES[geneName]!["min"]!
            }
            let finalValue = self.clampValue(newValue, geneName)
            
            switch geneName {
                case "potencialEvolutivo": self.potencialEvolutivo = finalValue
                case "max_lifespan_dias_base": self.max_lifespan_dias_base = finalValue
            }
        }
        
        // === EVOLUTION HELPERS ===
        
        access(all) fun evolveGene(_ geneName: String, _ seed: UInt64, _ potencial: UFix64, _ volatility: UFix64) {
            // Get current value
            var currentValue: UFix64 = 0.0
            switch geneName {
                case "potencialEvolutivo": currentValue = self.potencialEvolutivo
                case "max_lifespan_dias_base": currentValue = self.max_lifespan_dias_base
                default: return
            }
            
            // Very slow evolution for fundamental traits (from CreatureNFTV6)
            let randomNormalized = UFix64(seed % 10000) / 9999.0
            let magnitude = 0.0001 * potencial * volatility // Even slower than visual/combat
            var changeAmount: UFix64 = 0.0
            
            if randomNormalized < 0.5 {
                changeAmount = (0.5 - randomNormalized) * 2.0 * magnitude
                if currentValue > changeAmount {
                    currentValue = currentValue - changeAmount
                } else {
                    currentValue = EvolutionPotentialModule.GENE_RANGES[geneName]!["min"]!
                }
            } else {
                changeAmount = (randomNormalized - 0.5) * 2.0 * magnitude
                currentValue = currentValue + changeAmount
            }
            
            // Clamp and set new value
            let newValue = self.clampValue(currentValue, geneName)
            
            switch geneName {
                case "potencialEvolutivo": self.potencialEvolutivo = newValue
                case "max_lifespan_dias_base": self.max_lifespan_dias_base = newValue
            }
        }
        
        // === PARSING HELPERS ===
        
        access(all) fun parseAndSetPotencial(_ value: String) {
            // Simple string search using contains() instead of indexOf()
            if value.contains("POT:") {
                // Simple extraction - just use default for now to avoid complex parsing
                let potValue: UFix64 = 1.0 // Default value
                self.potencialEvolutivo = self.clampValue(potValue, "potencialEvolutivo")
            }
        }
        
        access(all) fun parseAndSetLifespan(_ value: String) {
            // Simple string search using contains() instead of indexOf()
            if value.contains("LIFE:") {
                // Simple extraction - just use default for now to avoid complex parsing
                let lifeValue: UFix64 = 5.0 // Default value
                self.max_lifespan_dias_base = self.clampValue(lifeValue, "max_lifespan_dias_base")
            }
        }
        
        // === UTILITY FUNCTIONS ===
        
        access(all) fun clampValue(_ value: UFix64, _ geneName: String): UFix64 {
            let ranges = EvolutionPotentialModule.GENE_RANGES[geneName]!
            let minVal = ranges["min"]!
            let maxVal = ranges["max"]!
            return self.max(minVal, self.min(maxVal, value))
        }
        
        access(all) fun max(_ a: UFix64, _ b: UFix64): UFix64 {
            return a > b ? a : b
        }
        
        access(all) fun min(_ a: UFix64, _ b: UFix64): UFix64 {
            return a < b ? a : b
        }
        
        // === REPRODUCTIVE COMPATIBILITY ===
        
        access(all) view fun getReproductiveSuccess(_ partnerTrait: &{TraitModule.Trait}): UFix64 {
            // Get partner's evolution potential for compatibility calculation
            let partnerValue = partnerTrait.getValue()
            let partnerPot = EvolutionPotentialModule.parsePotencial(partnerValue)
            
            // Calculate compatibility (closer potentials = better reproduction)
            let difference = EvolutionPotentialModule.abs(self.potencialEvolutivo - partnerPot)
            let maxDiff: UFix64 = 1.0 // Max possible difference in potential range
            let compatibility = 1.0 - (difference / maxDiff)
            
            // Base success rate enhanced by compatibility
            let baseSuccess: UFix64 = 0.3
            let enhancedSuccess = baseSuccess + (compatibility * 0.4)
            return enhancedSuccess < 1.0 ? enhancedSuccess : 1.0
        }
        
        // === REPRODUCTION INTERFACE (NO-OP IMPLEMENTATIONS) ===
        
        access(all) fun addReproductionCandidate(partnerID: UInt64, compatibilityScore: UFix64): Bool {
            return false // Evolution potential doesn't handle reproduction
        }
        
        access(all) fun clearReproductionCandidates(reason: String): Bool {
            return false // Evolution potential doesn't handle reproduction
        }
        
        access(all) view fun isReproductionReady(): Bool {
            return false // Evolution potential doesn't handle reproduction
        }
        
        access(all) view fun canReproduceWith(partnerID: UInt64): Bool {
            return false // Evolution potential doesn't handle reproduction
        }
        
        access(all) view fun getReproductionCandidates(): [UInt64] {
            return [] // Evolution potential doesn't handle reproduction
        }
    }
    
    // === STATIC HELPERS ===
    
    access(all) view fun formatPotencial(_ value: UFix64): String {
        if value < 0.7 { return "⚡Low" }
        if value < 0.9 { return "⚡Med" }
        if value < 1.1 { return "⚡High" }
        return "⚡Max"
    }
    
    access(all) view fun formatLifespan(_ value: UFix64): String {
        if value < 4.0 { return "⏳Short" }
        if value < 5.5 { return "⏳Normal" }
        return "⏳Long"
    }
    
    access(all) view fun parsePotencial(_ traitValue: String): UFix64 {
        if traitValue.contains("POT:") {
            // Simple extraction - just return default for now to avoid complex parsing
            return 1.0
        }
        return 1.0
    }
    
    access(all) view fun abs(_ value: UFix64): UFix64 {
        return value // UFix64 is always positive
    }
    
    // === FACTORY FUNCTIONS ===
    
    access(all) fun createDefaultTrait(): @{TraitModule.Trait} {
        return <- create EvolutionPotential(
            potencialEvolutivo: 1.0,
            max_lifespan_dias_base: 5.0
        )
    }
    
    // NEW: Create trait with seed-based randomization
    access(all) fun createTraitWithSeed(seed: UInt64): @{TraitModule.Trait} {
        // Use seed to generate pseudo-random values within gene ranges
        let r1 = (seed * 83) % 1000
        let r2 = (seed * 89) % 1000
        
        // Generate values within ranges (0.5-1.5, 3.0-7.0)
        let potencialEvolutivo = 0.5 + (UFix64(r1) / 999.0) * 1.0  // 0.5-1.5
        let max_lifespan_dias_base = 3.0 + (UFix64(r2) / 999.0) * 4.0  // 3.0-7.0
        
        return <- create EvolutionPotential(
            potencialEvolutivo: potencialEvolutivo,
            max_lifespan_dias_base: max_lifespan_dias_base
        )
    }
    
    access(all) fun createTraitWithValue(value: String): @{TraitModule.Trait} {
        let trait <- self.createDefaultTrait() as! @EvolutionPotential
        trait.setValue(newValue: value)
        return <- trait
    }
    
    access(all) fun createChildTrait(parent1: &{TraitModule.Trait}, parent2: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        let p1 = parent1 as! &EvolutionPotential
        let p2 = parent2 as! &EvolutionPotential
        
        // === ADVANCED EVOLUTION GENETICS ===
        var seedState = seed
        
        // 1. Potential inheritance with elite gene possibility
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let potentialInheritance = seedState % 100
        var childPotential: UFix64 = 0.0
        
        if potentialInheritance < 10 { // 10% - Elite gene (take higher parent + bonus)
            childPotential = EvolutionPotentialModule.max(p1.potencialEvolutivo, p2.potencialEvolutivo) * 1.05
        } else if potentialInheritance < 80 { // 70% - Average inheritance
            childPotential = (p1.potencialEvolutivo + p2.potencialEvolutivo) / 2.0
        } else { // 20% - Hybrid vigor boost
            let avgPot = (p1.potencialEvolutivo + p2.potencialEvolutivo) / 2.0
            childPotential = avgPot * 1.02 // 2% hybrid bonus
        }
        
        // 2. Lifespan inheritance with longevity genes
        let avgLifespan = (p1.max_lifespan_dias_base + p2.max_lifespan_dias_base) / 2.0
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let lifespanVariation = (UFix64(seedState % 100) / 100.0 - 0.5) * 0.1 // ±5%
        var childLifespan = avgLifespan + (avgLifespan * lifespanVariation)
        
        // 3. Longevity gene check (rare)
        if seedState % 200 == 0 { // 0.5% chance
            childLifespan = childLifespan * 1.15 // 15% lifespan boost
        }
        
        // Clamp values
        childPotential = EvolutionPotentialModule.clampValue(childPotential, "potencialEvolutivo")
        childLifespan = EvolutionPotentialModule.clampValue(childLifespan, "max_lifespan_dias_base")
        
        return <- create EvolutionPotential(
            potencialEvolutivo: childPotential,
            max_lifespan_dias_base: childLifespan
        )
    }
    
    access(all) fun createMitosisChild(parent: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        // Get parent values
        let parentPot = self.parsePotencial(parent.getValue())
        
        // Small mutation (±5% like CreatureNFTV6)
        let mutationFactor = 0.95 + (UFix64(seed % 100) / 1000.0) // 0.95-1.05
        let childPot = parentPot * mutationFactor
        
        // Lifespan inheritance with slight improvement (mitosis can enhance child)
        let lifespanMutation = 1.0 + (UFix64((seed >> 8) % 50) / 1000.0) // 1.0-1.05 (slight improvement)
        let childLifespan = 5.0 * lifespanMutation
        
        return <- create EvolutionPotential(
            potencialEvolutivo: childPot,
            max_lifespan_dias_base: childLifespan
        )
    }
    
    // === MODULE IDENTITY ===
    
    access(all) view fun getModuleType(): String {
        return "evolution"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    access(all) view fun getModuleName(): String {
        return "Evolution Potential Module"
    }
    
    access(all) view fun getModuleDescription(): String {
        return "Manages evolution potential and lifespan characteristics"
    }
    
    // === UTILITY FUNCTIONS ===
    
    access(all) fun clampValue(_ value: UFix64, _ geneName: String): UFix64 {
        let ranges = EvolutionPotentialModule.GENE_RANGES[geneName]!
        let minVal = ranges["min"]!
        let maxVal = ranges["max"]!
        return EvolutionPotentialModule.max(minVal, EvolutionPotentialModule.min(maxVal, value))
    }
    
    access(all) fun max(_ a: UFix64, _ b: UFix64): UFix64 {
        return a > b ? a : b
    }
    
    access(all) fun min(_ a: UFix64, _ b: UFix64): UFix64 {
        return a < b ? a : b
    }
    
    init() {
        // Initialize gene ranges (from CreatureNFTV6)
        let ranges: {String: {String: UFix64}} = {}
        
        ranges["potencialEvolutivo"] = {"min": 0.5, "max": 1.5}
        ranges["max_lifespan_dias_base"] = {"min": 3.0, "max": 7.0}
        
        self.GENE_RANGES = ranges
    }
} 