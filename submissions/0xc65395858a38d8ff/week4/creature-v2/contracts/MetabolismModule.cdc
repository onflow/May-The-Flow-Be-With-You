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
            return MetabolismModule.min(1.0, baseChance) // Cap at 100%
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
    
    access(all) view fun min(_ a: UFix64, _ b: UFix64): UFix64 {
        return a < b ? a : b
    }
    
    // === FACTORY FUNCTIONS ===
    
    access(all) fun createDefaultTrait(): @{TraitModule.Trait} {
        return <- create Metabolism(
            tasaMetabolica: 1.0,
            fertilidad: 0.5
        )
    }
    
    access(all) fun createTraitWithValue(value: String): @{TraitModule.Trait} {
        let trait <- self.createDefaultTrait() as! @Metabolism
        trait.setValue(newValue: value)
        return <- trait
    }
    
    access(all) fun createChildTrait(parent1: &{TraitModule.Trait}, parent2: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        // Get parent values
        let p1Met = self.parseMetabolism(parent1.getValue())
        let p2Met = self.parseMetabolism(parent2.getValue())
        let p1Fert = self.parseFertilidad(parent1.getValue())
        let p2Fert = self.parseFertilidad(parent2.getValue())
        
        // Average parents with mutation
        let avgMet = (p1Met + p2Met) / 2.0
        let avgFert = (p1Fert + p2Fert) / 2.0
        
        let mutationFactor = 0.9 + (UFix64(seed % 200) / 1000.0) // ±10%
        let finalMet = avgMet * mutationFactor
        
        let fertMutation = 0.9 + (UFix64((seed >> 8) % 200) / 1000.0) // ±10%
        let finalFert = avgFert * fertMutation
        
        // Create trait with final values from the start
        return <- create Metabolism(
            tasaMetabolica: finalMet,
            fertilidad: finalFert
        )
    }
    
    // === MODULE IDENTITY ===
    
    access(all) view fun getModuleType(): String {
        return "metabolism"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    init() {
        // Initialize gene ranges (from CreatureNFTV6)
        let ranges: {String: {String: UFix64}} = {}
        
        ranges["tasaMetabolica"] = {"min": 0.5, "max": 1.5}
        ranges["fertilidad"] = {"min": 0.1, "max": 0.9}
        
        self.GENE_RANGES = ranges
    }
} 