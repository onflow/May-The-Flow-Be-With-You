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
            
            // Get visual influences from seeds if available, otherwise fallback to defaults
            let visualInfluences = self.getVisualInfluencesFromSeeds(seeds)
            
            // Evolve each combat gene with passive + visual influences
            self.evolveCombatGene("puntosSaludMax", seeds[1], potencialEvolutivo, dailyVolatilityFactor, factorEvolucionInfluenciaBase, visualInfluences)
            self.evolveCombatGene("ataqueBase", seeds[2], potencialEvolutivo, dailyVolatilityFactor, factorEvolucionInfluenciaBase, visualInfluences)
            self.evolveCombatGene("defensaBase", seeds[3], potencialEvolutivo, dailyVolatilityFactor, factorEvolucionInfluenciaBase, visualInfluences)
            
            if seeds.length >= 5 {
                self.evolveCombatGene("agilidadCombate", seeds[4], potencialEvolutivo, dailyVolatilityFactor, factorEvolucionInfluenciaBase, visualInfluences)
            }
            
            return self.getDisplayName()
        }
        
        // OPTIMIZED: Accumulative evolution for multiple steps
        access(all) fun evolveAccumulative(seeds: [UInt64], steps: UInt64): String {
            if seeds.length < 4 { return self.getDisplayName() }
            
            // Combat evolution with visual gene influences (accumulative version)
            let potencialEvolutivo: UFix64 = 1.0
            
            // Daily volatility
            let dailyVolatilityFactor = 0.5 + (UFix64(seeds[0] % 1000) / 999.0)
            
            // Base evolution factor
            let factorEvolucionInfluenciaBase = 0.0001 * potencialEvolutivo * dailyVolatilityFactor
            
            // Get visual influences from seeds (simplified, no expensive parsing)
            let visualInfluences = self.getSimplifiedVisualInfluences(seeds)
            
            // Evolve each combat gene accumulatively
            self.evolveCombatGeneAccumulative("puntosSaludMax", seeds[1], steps, potencialEvolutivo, dailyVolatilityFactor, factorEvolucionInfluenciaBase, visualInfluences)
            self.evolveCombatGeneAccumulative("ataqueBase", seeds[2], steps, potencialEvolutivo, dailyVolatilityFactor, factorEvolucionInfluenciaBase, visualInfluences)
            self.evolveCombatGeneAccumulative("defensaBase", seeds[3], steps, potencialEvolutivo, dailyVolatilityFactor, factorEvolucionInfluenciaBase, visualInfluences)
            
            if seeds.length >= 5 {
                self.evolveCombatGeneAccumulative("agilidadCombate", seeds[4], steps, potencialEvolutivo, dailyVolatilityFactor, factorEvolucionInfluenciaBase, visualInfluences)
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
            
            // Calculate tamaño influence (-1.0 to 1.0) safely
            let tamanoRange = CombatStatsModule.getVisualRange("tamanoBase")
            let minTamano = tamanoRange["min"]!
            let maxTamano = tamanoRange["max"]!
            let rangeTamano = maxTamano - minTamano
            
            // Safe normalization: clamp tamanoBase to range first
            let clampedTamano = self.max(minTamano, self.min(maxTamano, tamanoBase))
            let normTamano = (clampedTamano - minTamano) / rangeTamano
            
            // Safe tendency calculation
            var tendTamanoFactor: UFix64 = 0.0
            var isPositiveTamanoTrend = true
            if normTamano >= 0.5 {
                tendTamanoFactor = (normTamano - 0.5) * 2.0
                isPositiveTamanoTrend = true
            } else {
                tendTamanoFactor = (0.5 - normTamano) * 2.0
                isPositiveTamanoTrend = false
            }
            
            // Calculate apéndices influence (0.0 to 1.0) safely
            let apendicesRange = CombatStatsModule.getVisualRange("numApendices")
            let minApendices = apendicesRange["min"]!
            let maxApendices = apendicesRange["max"]!
            let rangeApendices = maxApendices - minApendices
            
            // Safe normalization: clamp numApendices to range first
            let clampedApendices = self.max(minApendices, self.min(maxApendices, numApendices))
            let normApendices = (clampedApendices - minApendices) / rangeApendices
            
            switch geneName {
                case "puntosSaludMax":
                    // Tamaño influence: bigger = more health
                    let tamanoInfluence = tendTamanoFactor * 1.0 * influenceBase
                    if isPositiveTamanoTrend {
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
                    let tamanoInfluenceAtk = tendTamanoFactor * 0.3 * influenceBase
                    if isPositiveTamanoTrend {
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
                    let tamanoInfluenceDef = tendTamanoFactor * 1.0 * influenceBase
                    if isPositiveTamanoTrend {
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
                    let tamanoInfluenceAgi = tendTamanoFactor * 1.0 * influenceBase
                    if isPositiveTamanoTrend { // Big creature, reduce agility
                        if modifiableValue > tamanoInfluenceAgi {
                            modifiableValue = modifiableValue - tamanoInfluenceAgi
                        } else {
                            modifiableValue = minValue
                        }
                    } else { // Small creature, boost agility
                        modifiableValue = modifiableValue + tamanoInfluenceAgi
                    }
                    
                    // numApendices U-shape influence: optimal around middle (4.0)
                    let apendicesOptimal: UFix64 = 4.0
                    let apendicesMaxDist = 4.0 // Distance from 0 or 8 to 4
                    var distanceFromOptimal: UFix64 = 0.0
                    if numApendices > apendicesOptimal {
                        distanceFromOptimal = numApendices - apendicesOptimal
                    } else {
                        distanceFromOptimal = apendicesOptimal - numApendices
                    }
                    
                    // Clamp the ratio to prevent underflow
                    let distanceRatio = self.min(1.0, distanceFromOptimal / apendicesMaxDist)
                    let proximityToOptimum = 1.0 - distanceRatio // Safe from underflow now
                    
                    // Calculate U-shape influence safely (-1.0 to 1.0)
                    var uShapeInfluence: UFix64 = 0.0
                    var isPositiveInfluence = true
                    if proximityToOptimum >= 0.5 {
                        uShapeInfluence = (proximityToOptimum - 0.5) * 2.0
                        isPositiveInfluence = true
                    } else {
                        uShapeInfluence = (0.5 - proximityToOptimum) * 2.0
                        isPositiveInfluence = false
                    }
                    let uShapeEffect = uShapeInfluence * 0.5 * influenceBase
                    
                    if isPositiveInfluence {
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
        
        // === ACCUMULATIVE EVOLUTION HELPERS ===
        
        access(self) fun getSimplifiedVisualInfluences(_ seeds: [UInt64]): {String: UFix64} {
            // Generate simplified visual influences from seeds (no expensive parsing)
            if seeds.length >= 3 {
                let tamanoSeed = seeds[0] % 1000
                let formaSeed = seeds[1] % 1000  
                let apendicesSeed = seeds[2] % 1000
                
                // Generate influences within expected ranges
                let tamanoBase = 0.5 + (UFix64(tamanoSeed) / 999.0) * 2.5  // 0.5-3.0
                let formaPrincipal = 1.0 + (UFix64(formaSeed) / 999.0) * 2.0  // 1.0-3.0
                let numApendices = UFix64(apendicesSeed) / 124.875  // 0.0-8.0
                
                return {
                    "tamanoBase": tamanoBase,
                    "formaPrincipal": formaPrincipal,
                    "numApendices": numApendices
                }
            }
            
            // Fallback defaults
            return {
                "tamanoBase": 1.5,
                "formaPrincipal": 2.0,
                "numApendices": 4.0
            }
        }
        
        access(self) fun evolveCombatGeneAccumulative(
            _ geneName: String,
            _ baseSeed: UInt64,
            _ steps: UInt64,
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
            
            // Accumulate evolution effects over all steps
            var totalIncrease: UFix64 = 0.0
            var totalDecrease: UFix64 = 0.0
            var stepSeed = baseSeed
            let magnitude = 0.001 * potencial * volatility
            
            var i: UInt64 = 0
            while i < steps {
                // Generate step-specific random (maintaining granularity)
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
                newValue = CombatStatsModule.GENE_RANGES[geneName]!["min"]!
            }
            
            // Apply simplified visual influence (once for all steps)
            newValue = self.applySimplifiedVisualInfluence(geneName, newValue, influenceBase * UFix64(steps), visualInfluences, minValue)
            
            // Clamp and set final value
            let finalValue = self.clampValue(newValue, geneName)
            
            switch geneName {
                case "puntosSaludMax": self.puntosSaludMax = finalValue
                case "ataqueBase": self.ataqueBase = finalValue
                case "defensaBase": self.defensaBase = finalValue
                case "agilidadCombate": self.agilidadCombate = finalValue
            }
        }
        
        access(self) fun applySimplifiedVisualInfluence(
            _ geneName: String,
            _ currentValue: UFix64,
            _ totalInfluenceBase: UFix64,
            _ visualInfluences: {String: UFix64},
            _ minValue: UFix64
        ): UFix64 {
            let tamanoBase = visualInfluences["tamanoBase"]!
            let formaPrincipal = visualInfluences["formaPrincipal"]!
            let numApendices = visualInfluences["numApendices"]!
            
            var modifiableValue = currentValue
            
            // Simplified visual influences without expensive range calculations
            switch geneName {
                case "puntosSaludMax":
                    // Size influence: bigger = more health
                    if tamanoBase > 1.75 {
                        modifiableValue = modifiableValue + (totalInfluenceBase * (tamanoBase - 1.75))
                    }
                    // Tank form bonus
                    if formaPrincipal >= 1.8 && formaPrincipal <= 2.2 {
                        modifiableValue = modifiableValue + (totalInfluenceBase * 0.5)
                    }
                
                case "ataqueBase":
                    // Attacker form bonus
                    if formaPrincipal >= 2.8 {
                        modifiableValue = modifiableValue + (totalInfluenceBase * 1.0)
                    }
                    // Appendices bonus
                    if numApendices > 4.0 {
                        modifiableValue = modifiableValue + (totalInfluenceBase * (numApendices - 4.0) * 0.1)
                    }
                
                case "defensaBase":
                    // Tank form bonus
                    if formaPrincipal >= 1.8 && formaPrincipal <= 2.2 {
                        modifiableValue = modifiableValue + (totalInfluenceBase * 1.0)
                    }
                    // Size influence
                    if tamanoBase > 1.75 {
                        modifiableValue = modifiableValue + (totalInfluenceBase * (tamanoBase - 1.75))
                    }
                
                case "agilidadCombate":
                    // Agile form bonus
                    if formaPrincipal <= 1.2 {
                        modifiableValue = modifiableValue + (totalInfluenceBase * 1.0)
                    }
                    // Size penalty for agility
                    if tamanoBase > 2.0 {
                        let penalty = totalInfluenceBase * (tamanoBase - 2.0) * 0.5
                        if modifiableValue > penalty {
                            modifiableValue = modifiableValue - penalty
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
        
        // NEW: Get visual influences from actual evolution seeds that contain visual data
        access(self) fun getVisualInfluencesFromSeeds(_ seeds: [UInt64]): {String: UFix64} {
            // If we have at least 5 seeds, the last 3 contain visual data
            // seeds[2] = tamanoBase * 1000, seeds[3] = formaPrincipal * 1000, seeds[4] = numApendices * 1000
            if seeds.length >= 5 {
                let tamanoBase = UFix64(seeds[2]) / 1000.0
                let formaPrincipal = UFix64(seeds[3]) / 1000.0
                let numApendices = UFix64(seeds[4]) / 1000.0
                
                return {
                    "tamanoBase": tamanoBase,
                    "formaPrincipal": formaPrincipal,
                    "numApendices": numApendices
                }
            }
            
            // Fallback to defaults if not enough seeds
            return self.getVisualInfluences()
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
        
        // === REPRODUCTION INTERFACE (NO-OP IMPLEMENTATIONS) ===
        
        access(all) fun addReproductionCandidate(partnerID: UInt64, compatibilityScore: UFix64): Bool {
            return false // Combat stats don't handle reproduction
        }
        
        access(all) fun clearReproductionCandidates(reason: String): Bool {
            return false // Combat stats don't handle reproduction
        }
        
        access(all) view fun isReproductionReady(): Bool {
            return false // Combat stats don't handle reproduction
        }
        
        access(all) view fun canReproduceWith(partnerID: UInt64): Bool {
            return false // Combat stats don't handle reproduction
        }
        
        access(all) view fun getReproductionCandidates(): [UInt64] {
            return [] // Combat stats don't handle reproduction
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
        let p1 = parent1 as! &CombatStats
        let p2 = parent2 as! &CombatStats
        
        // === ADVANCED COMBAT GENETICS ===
        var seedState = seed
        
        // 1. Health inheritance with hybrid vigor
        let avgHealth = (p1.puntosSaludMax + p2.puntosSaludMax) / 2.0
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let healthVariation = (UFix64(seedState % 100) / 100.0 - 0.5) * 0.15 // ±7.5%
        var childHealth = avgHealth + (avgHealth * healthVariation)
        
        // 2. Attack inheritance with specialization potential
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let attackInheritance = seedState % 10
        var childAttack: UFix64 = 0.0
        
        if attackInheritance < 3 { // 30% chance - take higher parent (specialization)
            childAttack = CombatStatsModule.max(p1.ataqueBase, p2.ataqueBase)
        } else if attackInheritance < 7 { // 40% chance - average
            childAttack = (p1.ataqueBase + p2.ataqueBase) / 2.0
        } else { // 30% chance - take lower parent but with bonus
            childAttack = CombatStatsModule.min(p1.ataqueBase, p2.ataqueBase) * 1.1
        }
        
        // 3. Defense inheritance with parental balance
        let avgDefense = (p1.defensaBase + p2.defensaBase) / 2.0
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let defenseVariation = (UFix64(seedState % 100) / 100.0 - 0.5) * 0.12 // ±6%
        var childDefense = avgDefense + (avgDefense * defenseVariation)
        
        // 4. Agility inheritance with speed genes
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let agilityInheritance = seedState % 6
        var childAgility: UFix64 = 0.0
        
        switch agilityInheritance {
            case 0: childAgility = p1.agilidadCombate // Parent 1
            case 1: childAgility = p1.agilidadCombate // Parent 1
            case 2: childAgility = p2.agilidadCombate // Parent 2  
            case 3: childAgility = p2.agilidadCombate // Parent 2  
            case 4: childAgility = (p1.agilidadCombate + p2.agilidadCombate) / 2.0 // Average
            default: // Rare agility boost
                childAgility = CombatStatsModule.max(p1.agilidadCombate, p2.agilidadCombate) * 1.05
        }
        
        // 5. Combat synergy bonus (when parents have complementary stats)
        let parentStatBalance = self.calculateStatBalance(p1, p2)
        if parentStatBalance > 0.8 { // Well-balanced parents
            let synergyBonus: UFix64 = 1.03 // 3% bonus to all stats
            childHealth = childHealth * synergyBonus
            childAttack = childAttack * synergyBonus
            childDefense = childDefense * synergyBonus
            childAgility = childAgility * synergyBonus
        }
        
        // 6. Apply combat mutations (2% chance per stat)
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        if seedState % 50 == 0 { // 2% chance
            let mutationStrength: UFix64 = 0.08 // 8% mutation
            let statToMutate = seedState % 4
            
            switch statToMutate {
                case 0: // Health mutation
                    let healthMutation = mutationStrength * (UFix64(seedState % 100) / 100.0 - 0.5)
                    childHealth = childHealth * (1.0 + healthMutation)
                case 1: // Attack mutation
                    let attackMutation = mutationStrength * (UFix64(seedState % 100) / 100.0 - 0.5)
                    childAttack = childAttack * (1.0 + attackMutation)
                case 2: // Defense mutation
                    let defenseMutation = mutationStrength * (UFix64(seedState % 100) / 100.0 - 0.5)
                    childDefense = childDefense * (1.0 + defenseMutation)
                case 3: // Agility mutation
                    let agilityMutation = mutationStrength * (UFix64(seedState % 100) / 100.0 - 0.5)
                    childAgility = childAgility * (1.0 + agilityMutation)
            }
        }
        
        // 7. Clamp all values to valid ranges
        childHealth = CombatStatsModule.clampValue(childHealth, "puntosSaludMax")
        childAttack = CombatStatsModule.clampValue(childAttack, "ataqueBase")
        childDefense = CombatStatsModule.clampValue(childDefense, "defensaBase")
        childAgility = CombatStatsModule.clampValue(childAgility, "agilidadCombate")
        
        return <- create CombatStats(
            puntosSaludMax: childHealth,
            ataqueBase: childAttack,
            defensaBase: childDefense,
            agilidadCombate: childAgility
        )
    }
    
    // Helper function to calculate stat balance between parents
    access(all) fun calculateStatBalance(_ p1: &CombatStats, _ p2: &CombatStats): UFix64 {
        // Calculate how well-balanced the parents are (diversity)
        let p1Total = p1.puntosSaludMax + p1.ataqueBase + p1.defensaBase + (p1.agilidadCombate * 50.0)
        let p2Total = p2.puntosSaludMax + p2.ataqueBase + p2.defensaBase + (p2.agilidadCombate * 50.0)
        
        let totalDiff = CombatStatsModule.absFix64(p1Total - p2Total)
        let avgTotal = (p1Total + p2Total) / 2.0
        
        // Balance score: 1.0 = perfectly balanced, 0.0 = completely unbalanced
        if avgTotal > 0.0 {
            return 1.0 - CombatStatsModule.min(1.0, totalDiff / avgTotal)
        }
        return 0.5
    }
    
    access(all) fun createMitosisChild(parent: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        // Parse parent values
        let parentValue = parent.getValue()
        let parts = self.splitString(parentValue, "|")
        
        var parentHP: UFix64 = 100.0
        var parentATK: UFix64 = 12.0
        var parentDEF: UFix64 = 12.0
        var parentAGI: UFix64 = 1.0
        
        // Parse parent stats
        for part in parts {
            let keyValue = self.splitString(part, ":")
            if keyValue.length == 2 {
                let key = keyValue[0]
                let value = UFix64.fromString(keyValue[1]) ?? 0.0
                
                switch key {
                    case "HP": parentHP = value
                    case "ATK": parentATK = value
                    case "DEF": parentDEF = value
                    case "AGI": parentAGI = value
                }
            }
        }
        
        // Small mutation (±5% like CreatureNFTV6)
        let mutationFactor = 0.95 + (UFix64(seed % 100) / 1000.0) // 0.95-1.05
        
        return <- create CombatStats(
            puntosSaludMax: parentHP * mutationFactor,
            ataqueBase: parentATK * mutationFactor,
            defensaBase: parentDEF * mutationFactor,
            agilidadCombate: parentAGI * mutationFactor
        )
    }
    
    // Helper function for string splitting (simplified)
    access(self) fun splitString(_ str: String, _ delimiter: String): [String] {
        // TODO: Implement proper string splitting for parsing
        // For now, return the whole string as a single element
        return [str]
    }
    
    // === MODULE IDENTITY ===
    
    access(all) view fun getModuleType(): String {
        return "combat"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    access(all) view fun getModuleName(): String {
        return "Combat Stats Module"
    }
    
    access(all) view fun getModuleDescription(): String {
        return "Manages combat statistics including health points, attack, defense, and agility"
    }
    
    // === UTILITY FUNCTIONS ===
    
    access(all) fun clampValue(_ value: UFix64, _ geneName: String): UFix64 {
        let ranges = CombatStatsModule.GENE_RANGES[geneName]!
        let minVal = ranges["min"]!
        let maxVal = ranges["max"]!
        return CombatStatsModule.max(minVal, CombatStatsModule.min(maxVal, value))
    }
    
    access(all) fun max(_ a: UFix64, _ b: UFix64): UFix64 {
        return a > b ? a : b
    }
    
    access(all) fun min(_ a: UFix64, _ b: UFix64): UFix64 {
        return a < b ? a : b
    }
    
    access(all) fun absFix64(_ value: UFix64): UFix64 {
        return value // UFix64 is always positive
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