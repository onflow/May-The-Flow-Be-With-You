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
            return EvolutionPotentialModule.min(1.0, baseSuccess + (compatibility * 0.4))
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
    
    access(all) view fun min(_ a: UFix64, _ b: UFix64): UFix64 {
        return a < b ? a : b
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
        // Get parent values
        let p1Pot = self.parsePotencial(parent1.getValue())
        let p2Pot = self.parsePotencial(parent2.getValue())
        
        // Average parents with small mutation
        let avgPot = (p1Pot + p2Pot) / 2.0
        let mutationFactor = 0.95 + (UFix64(seed % 100) / 1000.0) // ±5%
        let finalPot = avgPot * mutationFactor
        
        // Similar for lifespan
        let avgLifespan = 5.0 // Default average
        let lifespanMutation = 0.97 + (UFix64((seed >> 8) % 60) / 1000.0) // ±3%
        let finalLifespan = avgLifespan * lifespanMutation
        
        // Create trait with final values from the start
        return <- create EvolutionPotential(
            potencialEvolutivo: finalPot,
            max_lifespan_dias_base: finalLifespan
        )
    }
    
    // === MODULE IDENTITY ===
    
    access(all) view fun getModuleType(): String {
        return "evolution"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    init() {
        // Initialize gene ranges (from CreatureNFTV6)
        let ranges: {String: {String: UFix64}} = {}
        
        ranges["potencialEvolutivo"] = {"min": 0.5, "max": 1.5}
        ranges["max_lifespan_dias_base"] = {"min": 3.0, "max": 7.0}
        
        self.GENE_RANGES = ranges
    }
} 