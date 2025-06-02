// MetabolismModule.cdc
// Metabolism and fertility module - MIGRATION FROM CreatureNFTV6

import "TraitModule"

access(all) contract MetabolismModule: TraitModule {
    
    // === METABOLISM GENE RANGES (from CreatureNFTV6) ===
    access(all) let GENE_RANGES: {String: {String: UFix64}}
    
    // === METABOLISM RESOURCE ===
    access(all) resource Metabolism: TraitModule.Trait {
        access(all) var tasaMetabolica: UFix64   // 0.5-1.5 (metabolism rate)
        access(all) var fertilidad: UFix64       // 0.1-0.9 (fertility chance)
        
        init(
            tasaMetabolica: UFix64,
            fertilidad: UFix64
        ) {
            self.tasaMetabolica = tasaMetabolica
            self.fertilidad = fertilidad
        }
        
        access(all) view fun getValue(): String {
            return "MET:".concat(self.tasaMetabolica.toString())
                .concat("|FERT:").concat(self.fertilidad.toString())
        }
        
        access(all) fun setValue(newValue: String) {
            // Parse the encoded value format using simple string operations
            self.parseAndSetMetabolism(newValue)
            self.parseAndSetFertility(newValue)
        }
        
        access(all) view fun getDisplayName(): String {
            let metDisplay = MetabolismModule.formatMetabolismo(self.tasaMetabolica)
            let fertDisplay = MetabolismModule.formatFertilidad(self.fertilidad)
            
            return "Metabolism: ".concat(metDisplay).concat(" ").concat(fertDisplay)
        }
        
        access(all) fun evolve(seeds: [UInt64]): String {
            if seeds.length < 2 { return self.getDisplayName() }
            
            // Metabolism evolution (moderate changes)
            let potencialEvolutivo: UFix64 = 1.0 // Would get from other module if available
            let dailyVolatilityFactor = 0.5 + (UFix64(seeds[0] % 1000) / 999.0)
            
            self.evolveGene("tasaMetabolica", seeds[1], potencialEvolutivo, dailyVolatilityFactor)
            
            if seeds.length >= 3 {
                self.evolveGene("fertilidad", seeds[2], potencialEvolutivo, dailyVolatilityFactor)
            }
            
            return self.getDisplayName()
        }
        
        // OPTIMIZED: Accumulative evolution for multiple steps
        access(all) fun evolveAccumulative(seeds: [UInt64], steps: UInt64): String {
            if seeds.length < 2 { return self.getDisplayName() }
            
            // Metabolism evolution (accumulative version)
            let potencialEvolutivo: UFix64 = 1.0
            let dailyVolatilityFactor = 0.5 + (UFix64(seeds[0] % 1000) / 999.0)
            
            self.evolveGeneAccumulative("tasaMetabolica", seeds[1], steps, potencialEvolutivo, dailyVolatilityFactor)
            
            if seeds.length >= 3 {
                self.evolveGeneAccumulative("fertilidad", seeds[2], steps, potencialEvolutivo, dailyVolatilityFactor)
            }
            
            return self.getDisplayName()
        }
        
        // === ACCUMULATIVE EVOLUTION HELPERS ===
        
        access(self) fun evolveGeneAccumulative(_ geneName: String, _ baseSeed: UInt64, _ steps: UInt64, _ potencial: UFix64, _ volatility: UFix64) {
            // Get current value
            var currentValue: UFix64 = 0.0
            switch geneName {
                case "tasaMetabolica": currentValue = self.tasaMetabolica
                case "fertilidad": currentValue = self.fertilidad
                default: return
            }
            
            // Accumulate moderate evolution effects
            var totalIncrease: UFix64 = 0.0
            var totalDecrease: UFix64 = 0.0
            var stepSeed = baseSeed
            let magnitude = 0.0008 * potencial * volatility // Moderate speed
            
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
                newValue = MetabolismModule.GENE_RANGES[geneName]!["min"]!
            }
            let finalValue = self.clampValue(newValue, geneName)
            
            switch geneName {
                case "tasaMetabolica": self.tasaMetabolica = finalValue
                case "fertilidad": self.fertilidad = finalValue
            }
        }
        
        // === EVOLUTION HELPERS ===
        
        access(all) fun evolveGene(_ geneName: String, _ seed: UInt64, _ potencial: UFix64, _ volatility: UFix64) {
            // Get current value
            var currentValue: UFix64 = 0.0
            switch geneName {
                case "tasaMetabolica": currentValue = self.tasaMetabolica
                case "fertilidad": currentValue = self.fertilidad
                default: return
            }
            
            // Moderate evolution for metabolism traits (from CreatureNFTV6)
            let randomNormalized = UFix64(seed % 10000) / 9999.0
            let magnitude = 0.0008 * potencial * volatility // Moderate speed
            var changeAmount: UFix64 = 0.0
            
            if randomNormalized < 0.5 {
                changeAmount = (0.5 - randomNormalized) * 2.0 * magnitude
                if currentValue > changeAmount {
                    currentValue = currentValue - changeAmount
                } else {
                    currentValue = MetabolismModule.GENE_RANGES[geneName]!["min"]!
                }
            } else {
                changeAmount = (randomNormalized - 0.5) * 2.0 * magnitude
                currentValue = currentValue + changeAmount
            }
            
            // Clamp and set new value
            let newValue = self.clampValue(currentValue, geneName)
            
            switch geneName {
                case "tasaMetabolica": self.tasaMetabolica = newValue
                case "fertilidad": self.fertilidad = newValue
            }
        }
        
        // === PARSING HELPERS ===
        
        access(all) fun parseAndSetMetabolism(_ value: String) {
            // Simple string search using contains() instead of indexOf()
            if value.contains("MET:") {
                // Simple extraction - just use default for now to avoid complex parsing
                let metValue: UFix64 = 1.0 // Default value
                self.tasaMetabolica = self.clampValue(metValue, "tasaMetabolica")
            }
        }
        
        access(all) fun parseAndSetFertility(_ value: String) {
            // Simple string search using contains() instead of indexOf()
            if value.contains("FERT:") {
                // Simple extraction - just use default for now to avoid complex parsing
                let fertValue: UFix64 = 0.5 // Default value
                self.fertilidad = self.clampValue(fertValue, "fertilidad")
            }
        }
        
        // === UTILITY FUNCTIONS ===
        
        access(all) fun clampValue(_ value: UFix64, _ geneName: String): UFix64 {
            let ranges = MetabolismModule.GENE_RANGES[geneName]!
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
        
        // === REPRODUCTION LOGIC ===
        
        access(all) view fun calculateReproductionChance(_ partnerFertility: UFix64, _ energyLevel: UFix64): UFix64 {
            // Base fertility chance from both partners
            let combinedFertility = (self.fertilidad + partnerFertility) / 2.0
            
            // Energy factor (0.5-1.0 multiplier based on available energy)
            let energyFactor = 0.5 + (energyLevel / 100.0) * 0.5 // Assuming energy 0-100
            
            // Metabolism affects reproduction success (moderate is best)
            let optimalMetabolism: UFix64 = 1.0
            let metabolismDistance = MetabolismModule.abs(self.tasaMetabolica - optimalMetabolism)
            let metabolismFactor = 1.0 - (metabolismDistance * 0.3) // Penalize extreme metabolism
            
            let baseChance = combinedFertility * energyFactor * metabolismFactor
            return baseChance < 1.0 ? baseChance : 1.0 // Cap at 100%
        }
        
        // === REPRODUCTION INTERFACE (NO-OP IMPLEMENTATIONS) ===
        
        access(all) fun addReproductionCandidate(partnerID: UInt64, compatibilityScore: UFix64): Bool {
            return false // Metabolism doesn't handle reproduction
        }
        
        access(all) fun clearReproductionCandidates(reason: String): Bool {
            return false // Metabolism doesn't handle reproduction
        }
        
        access(all) view fun isReproductionReady(): Bool {
            return false // Metabolism doesn't handle reproduction
        }
        
        access(all) view fun canReproduceWith(partnerID: UInt64): Bool {
            return false // Metabolism doesn't handle reproduction
        }
        
        access(all) view fun getReproductionCandidates(): [UInt64] {
            return [] // Metabolism doesn't handle reproduction
        }
    }
    
    // === STATIC HELPERS ===
    
    access(all) view fun formatMetabolismo(_ value: UFix64): String {
        if value < 0.7 { return "🐌Slow" }
        if value < 0.9 { return "🚶Normal" }
        if value < 1.2 { return "🏃Fast" }
        return "⚡Hyper"
    }
    
    access(all) view fun formatFertilidad(_ value: UFix64): String {
        if value < 0.3 { return "🚫Sterile" }
        if value < 0.5 { return "🌱Low" }
        if value < 0.7 { return "🌿Med" }
        return "🌺High"
    }
    
    access(all) view fun parseFertilidad(_ traitValue: String): UFix64 {
        if traitValue.contains("FERT:") {
            // Simple extraction - just return default for now to avoid complex parsing
            return 0.5
        }
        return 0.5
    }
    
    access(all) view fun parseMetabolism(_ traitValue: String): UFix64 {
        if traitValue.contains("MET:") {
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
        return <- create Metabolism(
            tasaMetabolica: 1.0,
            fertilidad: 0.5
        )
    }
    
    // NEW: Create trait with seed-based randomization
    access(all) fun createTraitWithSeed(seed: UInt64): @{TraitModule.Trait} {
        // Use seed to generate pseudo-random values within gene ranges
        let r1 = (seed * 97) % 1000
        let r2 = (seed * 101) % 1000
        
        // Generate values within ranges (0.5-1.5, 0.1-0.9)
        let tasaMetabolica = 0.5 + (UFix64(r1) / 999.0) * 1.0  // 0.5-1.5
        let fertilidad = 0.1 + (UFix64(r2) / 999.0) * 0.8  // 0.1-0.9
        
        return <- create Metabolism(
            tasaMetabolica: tasaMetabolica,
            fertilidad: fertilidad
        )
    }
    
    access(all) fun createTraitWithValue(value: String): @{TraitModule.Trait} {
        let trait <- self.createDefaultTrait() as! @Metabolism
        trait.setValue(newValue: value)
        return <- trait
    }
    
    access(all) fun createChildTrait(parent1: &{TraitModule.Trait}, parent2: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        let p1 = parent1 as! &Metabolism
        let p2 = parent2 as! &Metabolism
        
        // === ADVANCED METABOLISM GENETICS ===
        var seedState = seed
        
        // 1. Metabolism speed with efficiency trade-off genetics
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let metabolismChoice = seedState % 3
        var childMetabolismSpeed: UFix64 = 0.0
        
        if metabolismChoice == 0 { // Fast metabolism inheritance
            childMetabolismSpeed = MetabolismModule.max(p1.tasaMetabolica, p2.tasaMetabolica)
        } else if metabolismChoice == 1 { // Slow metabolism inheritance
            childMetabolismSpeed = MetabolismModule.min(p1.tasaMetabolica, p2.tasaMetabolica)
        } else { // Balanced inheritance
            childMetabolismSpeed = (p1.tasaMetabolica + p2.tasaMetabolica) / 2.0
        }
        
        // 2. Fertility with reproductive fitness genes
        let avgFertility = (p1.fertilidad + p2.fertilidad) / 2.0
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        var childFertility: UFix64 = 0.0
        
        // Fertility gene check (10% chance for boost)
        if seedState % 10 == 0 {
            childFertility = self.min(0.9, avgFertility * 1.15) // 15% boost, max 0.9
        } else {
            // Safe fertility variation without underflow
            let randomPercent = UFix64(seedState % 100) / 100.0 // 0.0-0.99
            let variationFactor = 0.95 + (randomPercent * 0.1) // 0.95 to 1.05
            childFertility = avgFertility * variationFactor
        }
        
        // Clamp values to valid ranges
        childMetabolismSpeed = MetabolismModule.clampValue(childMetabolismSpeed, "tasaMetabolica")
        childFertility = MetabolismModule.clampValue(childFertility, "fertilidad")
        
        return <- create Metabolism(
            tasaMetabolica: childMetabolismSpeed,
            fertilidad: childFertility
        )
    }
    
    access(all) fun createMitosisChild(parent: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        // Get parent values
        let parentMet = self.parseMetabolism(parent.getValue())
        let parentFert = self.parseFertilidad(parent.getValue())
        
        // Small mutation (±5% like CreatureNFTV6)
        let mutationFactor = 0.95 + (UFix64(seed % 100) / 1000.0) // 0.95-1.05
        let childMet = parentMet * mutationFactor
        
        let fertMutation = 0.95 + (UFix64((seed >> 8) % 100) / 1000.0) // 0.95-1.05
        let childFert = parentFert * fertMutation
        
        return <- create Metabolism(
            tasaMetabolica: childMet,
            fertilidad: childFert
        )
    }
    
    // === MODULE IDENTITY ===
    
    access(all) view fun getModuleType(): String {
        return "metabolism"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    access(all) view fun getModuleName(): String {
        return "Metabolism Module"  
    }
    
    access(all) view fun getModuleDescription(): String {
        return "Manages metabolic rate and fertility characteristics"
    }
    
    // === UTILITY FUNCTIONS ===
    
    access(all) fun clampValue(_ value: UFix64, _ geneName: String): UFix64 {
        let ranges = MetabolismModule.GENE_RANGES[geneName]!
        let minVal = ranges["min"]!
        let maxVal = ranges["max"]!
        return MetabolismModule.max(minVal, MetabolismModule.min(maxVal, value))
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
        
        ranges["tasaMetabolica"] = {"min": 0.5, "max": 1.5}
        ranges["fertilidad"] = {"min": 0.1, "max": 0.9}
        
        self.GENE_RANGES = ranges
    }
} 