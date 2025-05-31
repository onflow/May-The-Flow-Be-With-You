// CombatStatsModule.cdc
// Combat statistics module with visual gene influences - MIGRATION FROM CreatureNFTV6

import "TraitModule"

access(all) contract CombatStatsModule: TraitModule {
    
    // === COMBAT GENE RANGES (from CreatureNFTV6) ===
    access(all) let GENE_RANGES: {String: {String: UFix64}}
    
    // === COMBAT STATS RESOURCE ===
    access(all) resource CombatStats: TraitModule.Trait {
        access(all) var puntosSaludMax: UFix64   // 50.0-200.0
        access(all) var ataqueBase: UFix64       // 5.0-25.0
        access(all) var defensaBase: UFix64      // 5.0-25.0
        access(all) var agilidadCombate: UFix64  // 0.5-2.0
        
        init(
            puntosSaludMax: UFix64,
            ataqueBase: UFix64,
            defensaBase: UFix64,
            agilidadCombate: UFix64
        ) {
            self.puntosSaludMax = puntosSaludMax
            self.ataqueBase = ataqueBase
            self.defensaBase = defensaBase
            self.agilidadCombate = agilidadCombate
        }
        
        access(all) view fun getValue(): String {
            return "HP:".concat(self.puntosSaludMax.toString())
                .concat("|ATK:").concat(self.ataqueBase.toString())
                .concat("|DEF:").concat(self.defensaBase.toString())
                .concat("|AGI:").concat(self.agilidadCombate.toString())
        }
        
        access(all) fun setValue(newValue: String) {
            // Parse the encoded value format
            let parts = self.splitString(newValue, "|")
            
            for part in parts {
                let keyValue = self.splitString(part, ":")
                if keyValue.length == 2 {
                    let key = keyValue[0]
                    let value = UFix64.fromString(keyValue[1]) ?? 0.0
                    
                    switch key {
                        case "HP": self.puntosSaludMax = self.clampValue(value, "puntosSaludMax")
                        case "ATK": self.ataqueBase = self.clampValue(value, "ataqueBase")
                        case "DEF": self.defensaBase = self.clampValue(value, "defensaBase")
                        case "AGI": self.agilidadCombate = self.clampValue(value, "agilidadCombate")
                    }
                }
            }
        }
        
        access(all) view fun getDisplayName(): String {
            return "Combat: ❤️".concat(UInt64(self.puntosSaludMax).toString())
                .concat(" ⚔️").concat(UInt64(self.ataqueBase).toString())
                .concat(" 🛡️").concat(UInt64(self.defensaBase).toString())
                .concat(" ⚡").concat(self.formatAgilidadDisplay(self.agilidadCombate))
        }
        
        access(all) fun evolve(seeds: [UInt64]): String {
            if seeds.length < 4 { return self.getDisplayName() }
            
            // Combat evolution with visual gene influences (from CreatureNFTV6)
            let potencialEvolutivo: UFix64 = 1.0 // Would get from other module if available
            
            // Daily volatility (0.5 - 1.5)
            let dailyVolatilityFactor = 0.5 + (UFix64(seeds[0] % 1000) / 999.0)
            
            // Base evolution factor
            let factorEvolucionInfluenciaBase = 0.0001 * potencialEvolutivo * dailyVolatilityFactor // FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE
            
            // Get visual influences (these would come from another module in practice)
            let visualInfluences = self.getVisualInfluences()
            
            // Evolve each combat gene with passive + visual influences
            self.evolveCombatGene("puntosSaludMax", seeds[1], potencialEvolutivo, dailyVolatilityFactor, factorEvolucionInfluenciaBase, visualInfluences)
            self.evolveCombatGene("ataqueBase", seeds[2], potencialEvolutivo, dailyVolatilityFactor, factorEvolucionInfluenciaBase, visualInfluences)
            self.evolveCombatGene("defensaBase", seeds[3], potencialEvolutivo, dailyVolatilityFactor, factorEvolucionInfluenciaBase, visualInfluences)
            
            if seeds.length >= 5 {
                self.evolveCombatGene("agilidadCombate", seeds[4], potencialEvolutivo, dailyVolatilityFactor, factorEvolucionInfluenciaBase, visualInfluences)
            }
            
            return self.getDisplayName()
        }
        
        // === EVOLUTION HELPERS ===
        
        access(self) fun evolveCombatGene(
            _ geneName: String, 
            _ seed: UInt64, 
            _ potencial: UFix64, 
            _ volatility: UFix64,
            _ influenceBase: UFix64,
            _ visualInfluences: {String: UFix64}
        ) {
            // Get current value
            var currentValue: UFix64 = 0.0
            switch geneName {
                case "puntosSaludMax": currentValue = self.puntosSaludMax
                case "ataqueBase": currentValue = self.ataqueBase
                case "defensaBase": currentValue = self.defensaBase
                case "agilidadCombate": currentValue = self.agilidadCombate
                default: return
            }
            
            let minValue = CombatStatsModule.GENE_RANGES[geneName]!["min"]!
            
            // 1. Base passive evolution
            let randomNormalized = UFix64(seed % 10000) / 9999.0
            let magnitude = 0.001 * potencial * volatility // TASA_EVOLUCION_PASIVA_GEN_BASE
            var changeAmount: UFix64 = 0.0
            
            if randomNormalized < 0.5 {
                changeAmount = (0.5 - randomNormalized) * 2.0 * magnitude
                if currentValue > changeAmount {
                    currentValue = currentValue - changeAmount
                } else {
                    currentValue = minValue
                }
            } else {
                changeAmount = (randomNormalized - 0.5) * 2.0 * magnitude
                currentValue = currentValue + changeAmount
            }
            
            // 2. Visual influences (from CreatureNFTV6 logic)
            let modifiedValue = self.applyVisualInfluence(geneName, currentValue, influenceBase, visualInfluences, minValue)
            currentValue = modifiedValue
            
            // Clamp and set new value
            let newValue = self.clampValue(currentValue, geneName)
            
            switch geneName {
                case "puntosSaludMax": self.puntosSaludMax = newValue
                case "ataqueBase": self.ataqueBase = newValue
                case "defensaBase": self.defensaBase = newValue
                case "agilidadCombate": self.agilidadCombate = newValue
            }
        }
        
        access(self) fun applyVisualInfluence(
            _ geneName: String,
            _ currentValue: UFix64,
            _ influenceBase: UFix64,
            _ visualInfluences: {String: UFix64},
            _ minValue: UFix64
        ): UFix64 {
            let tamanoBase = visualInfluences["tamanoBase"] ?? 1.5
            let formaPrincipal = visualInfluences["formaPrincipal"] ?? 2.0
            let numApendices = visualInfluences["numApendices"] ?? 4.0
            
            // Make currentValue mutable
            var modifiableValue = currentValue
            
            // Calculate tamaño influence (-1.0 to 1.0)
            let tamanoRange = CombatStatsModule.getVisualRange("tamanoBase")
            let normTamano = (tamanoBase - tamanoRange["min"]!) / (tamanoRange["max"]! - tamanoRange["min"]!)
            let tendTamanoFactor = (normTamano - 0.5) * 2.0 // -1.0 to 1.0
            
            // Calculate apéndices influence (0.0 to 1.0)
            let apendicesRange = CombatStatsModule.getVisualRange("numApendices")
            let normApendices = (numApendices - apendicesRange["min"]!) / (apendicesRange["max"]! - apendicesRange["min"]!)
            
            switch geneName {
                case "puntosSaludMax":
                    // Tamaño influence: bigger = more health
                    let tamanoInfluence = self.absFix64(tendTamanoFactor * 1.0) * influenceBase
                    if tendTamanoFactor >= 0.0 {
                        modifiableValue = modifiableValue + tamanoInfluence
                    } else {
                        if modifiableValue > tamanoInfluence {
                            modifiableValue = modifiableValue - tamanoInfluence
                        } else {
                            modifiableValue = minValue
                        }
                    }
                    
                    // Form influence: tank form (2.0) boosts health
                    if formaPrincipal == 2.0 {
                        modifiableValue = modifiableValue + (0.5 * influenceBase)
                    }
                
                case "ataqueBase":
                    // Form influence: attacker (3.0) boosts, agile (1.0) reduces
                    if formaPrincipal == 3.0 {
                        modifiableValue = modifiableValue + (1.0 * influenceBase)
                    } else if formaPrincipal == 1.0 {
                        let decremento = 0.3 * influenceBase
                        if modifiableValue > decremento {
                            modifiableValue = modifiableValue - decremento
                        } else {
                            modifiableValue = minValue
                        }
                    }
                    
                    // Apéndices influence: more appendages = more attack
                    modifiableValue = modifiableValue + (normApendices * 0.7 * influenceBase)
                    
                    // Tamaño influence: bigger = more attack
                    let tamanoInfluenceAtk = self.absFix64(tendTamanoFactor * 0.3) * influenceBase
                    if tendTamanoFactor >= 0.0 {
                        modifiableValue = modifiableValue + tamanoInfluenceAtk
                    } else {
                        if modifiableValue > tamanoInfluenceAtk {
                            modifiableValue = modifiableValue - tamanoInfluenceAtk
                        } else {
                            modifiableValue = minValue
                        }
                    }
                
                case "defensaBase":
                    // Form influence: tank (2.0) boosts, attacker (3.0) reduces
                    if formaPrincipal == 2.0 {
                        modifiableValue = modifiableValue + (1.0 * influenceBase)
                    } else if formaPrincipal == 3.0 {
                        let decremento = 0.3 * influenceBase
                        if modifiableValue > decremento {
                            modifiableValue = modifiableValue - decremento
                        } else {
                            modifiableValue = minValue
                        }
                    }
                    
                    // Tamaño influence: bigger = more defense
                    let tamanoInfluenceDef = self.absFix64(tendTamanoFactor * 1.0) * influenceBase
                    if tendTamanoFactor >= 0.0 {
                        modifiableValue = modifiableValue + tamanoInfluenceDef
                    } else {
                        if modifiableValue > tamanoInfluenceDef {
                            modifiableValue = modifiableValue - tamanoInfluenceDef
                        } else {
                            modifiableValue = minValue
                        }
                    }
                
                case "agilidadCombate":
                    // Form influence: agile (1.0) boosts, tank (2.0) reduces
                    if formaPrincipal == 1.0 {
                        modifiableValue = modifiableValue + (1.0 * influenceBase)
                    } else if formaPrincipal == 2.0 {
                        let decremento = 0.7 * influenceBase
                        if modifiableValue > decremento {
                            modifiableValue = modifiableValue - decremento
                        } else {
                            modifiableValue = minValue
                        }
                    }
                    
                    // Tamaño influence: bigger = less agile (inverse)
                    let tamanoInfluenceAgi = self.absFix64(tendTamanoFactor * 1.0) * influenceBase
                    if tendTamanoFactor >= 0.0 { // Big creature, reduce agility
                        if modifiableValue > tamanoInfluenceAgi {
                            modifiableValue = modifiableValue - tamanoInfluenceAgi
                        } else {
                            modifiableValue = minValue
                        }
                    } else { // Small creature, boost agility
                        modifiableValue = modifiableValue + tamanoInfluenceAgi
                    }
                    
                    // Apéndices U-shape influence: optimal around middle (4.0)
                    let apendicesOptimal: UFix64 = 4.0
                    let apendicesMaxDist = 4.0 // Distance from 0 or 8 to 4
                    var distanceFromOptimal: UFix64 = 0.0
                    if numApendices > apendicesOptimal {
                        distanceFromOptimal = numApendices - apendicesOptimal
                    } else {
                        distanceFromOptimal = apendicesOptimal - numApendices
                    }
                    
                    let proximityToOptimum = 1.0 - (distanceFromOptimal / apendicesMaxDist)
                    let uShapeInfluence = (proximityToOptimum - 0.5) * 2.0 // -1.0 to 1.0
                    let uShapeEffect = self.absFix64(uShapeInfluence * 0.5) * influenceBase
                    
                    if uShapeInfluence >= 0.0 {
                        modifiableValue = modifiableValue + uShapeEffect
                    } else {
                        if modifiableValue > uShapeEffect {
                            modifiableValue = modifiableValue - uShapeEffect
                        } else {
                            modifiableValue = minValue
                        }
                    }
            }
            
            return modifiableValue
        }
        
        // === UTILITY FUNCTIONS ===
        
        access(self) fun getVisualInfluences(): {String: UFix64} {
            // In practice, these would come from the visual module
            // For now, return defaults
            return {
                "tamanoBase": 1.5,
                "formaPrincipal": 2.0,
                "numApendices": 4.0
            }
        }
        
        access(self) fun clampValue(_ value: UFix64, _ geneName: String): UFix64 {
            let ranges = CombatStatsModule.GENE_RANGES[geneName]!
            let minVal = ranges["min"]!
            let maxVal = ranges["max"]!
            return self.max(minVal, self.min(maxVal, value))
        }
        
        access(self) fun max(_ a: UFix64, _ b: UFix64): UFix64 {
            return a > b ? a : b
        }
        
        access(self) fun min(_ a: UFix64, _ b: UFix64): UFix64 {
            return a < b ? a : b
        }
        
        access(self) fun absFix64(_ value: UFix64): UFix64 {
            return value // UFix64 is always positive
        }
        
        access(self) view fun formatAgilidadDisplay(_ value: UFix64): String {
            if value < 0.8 { return "🐌Slow" }
            if value < 1.2 { return "🚶Normal" }
            if value < 1.6 { return "🏃Fast" }
            return "⚡Lightning"
        }
        
        access(self) fun splitString(_ str: String, _ delimiter: String): [String] {
            // Simplified implementation
            return [str]
        }
    }
    
    // === STATIC HELPERS ===
    
    access(all) view fun getVisualRange(_ geneName: String): {String: UFix64} {
        // Visual gene ranges (would be imported in practice)
        let ranges: {String: {String: UFix64}} = {
            "tamanoBase": {"min": 0.5, "max": 3.0},
            "numApendices": {"min": 0.0, "max": 8.0}
        }
        return ranges[geneName] ?? {"min": 0.0, "max": 1.0}
    }
    
    // === FACTORY FUNCTIONS ===
    
    access(all) fun createDefaultTrait(): @{TraitModule.Trait} {
        return <- create CombatStats(
            puntosSaludMax: 100.0,
            ataqueBase: 12.0,
            defensaBase: 12.0,
            agilidadCombate: 1.0
        )
    }
    
    // NEW: Create trait with seed-based randomization
    access(all) fun createTraitWithSeed(seed: UInt64): @{TraitModule.Trait} {
        // Use seed to generate pseudo-random values within gene ranges
        let r1 = (seed * 67) % 1000
        let r2 = (seed * 71) % 1000  
        let r3 = (seed * 73) % 1000
        let r4 = (seed * 79) % 1000
        
        // Generate values within ranges (50-200, 5-25, 5-25, 0.5-2.0)
        let puntosSaludMax = 50.0 + (UFix64(r1) / 999.0) * 150.0  // 50.0-200.0
        let ataqueBase = 5.0 + (UFix64(r2) / 999.0) * 20.0  // 5.0-25.0
        let defensaBase = 5.0 + (UFix64(r3) / 999.0) * 20.0  // 5.0-25.0
        let agilidadCombate = 0.5 + (UFix64(r4) / 999.0) * 1.5  // 0.5-2.0
        
        return <- create CombatStats(
            puntosSaludMax: puntosSaludMax,
            ataqueBase: ataqueBase,
            defensaBase: defensaBase,
            agilidadCombate: agilidadCombate
        )
    }
    
    access(all) fun createTraitWithValue(value: String): @{TraitModule.Trait} {
        let trait <- self.createDefaultTrait() as! @CombatStats
        trait.setValue(newValue: value)
        return <- trait
    }
    
    access(all) fun createChildTrait(parent1: &{TraitModule.Trait}, parent2: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        // Average of parents with mutation
        
        // Apply mutation based on seed
        let mutationFactor = 0.9 + (UFix64(seed % 200) / 1000.0) // 0.9-1.1
        
        // Create trait with mutated default values from the start
        return <- create CombatStats(
            puntosSaludMax: 100.0 * mutationFactor,
            ataqueBase: 12.0 * mutationFactor,
            defensaBase: 12.0 * mutationFactor,
            agilidadCombate: 1.0 * mutationFactor
        )
    }
    
    // === MODULE IDENTITY ===
    
    access(all) view fun getModuleType(): String {
        return "combat"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    init() {
        // Initialize gene ranges (from CreatureNFTV6)
        let ranges: {String: {String: UFix64}} = {}
        
        ranges["puntosSaludMax"] = {"min": 50.0, "max": 200.0}
        ranges["ataqueBase"] = {"min": 5.0, "max": 25.0}
        ranges["defensaBase"] = {"min": 5.0, "max": 25.0}
        ranges["agilidadCombate"] = {"min": 0.5, "max": 2.0}
        
        self.GENE_RANGES = ranges
    }
} 