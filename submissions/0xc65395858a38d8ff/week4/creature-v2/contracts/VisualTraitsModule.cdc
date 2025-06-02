// VisualTraitsModule.cdc
// Visual genetics module for creature appearance - MIGRATION FROM CreatureNFTV6

import "TraitModule"

access(all) contract VisualTraitsModule: TraitModule {
    
    // === VISUAL GENE RANGES (from CreatureNFTV6) ===
    access(all) let GENE_RANGES: {String: {String: UFix64}}
    
    // === VISUAL TRAITS RESOURCE ===
    access(all) resource VisualTraits: TraitModule.Trait {
        access(all) var colorR: UFix64      // 0.0-1.0
        access(all) var colorG: UFix64      // 0.0-1.0  
        access(all) var colorB: UFix64      // 0.0-1.0
        access(all) var tamanoBase: UFix64  // 0.5-3.0
        access(all) var formaPrincipal: UFix64  // 1.0-3.0 (1=ágil, 2=tanque, 3=atacante)
        access(all) var numApendices: UFix64    // 0.0-8.0
        access(all) var patronMovimiento: UFix64 // 1.0-4.0
        
        init(
            colorR: UFix64,
            colorG: UFix64,
            colorB: UFix64,
            tamanoBase: UFix64,
            formaPrincipal: UFix64,
            numApendices: UFix64,
            patronMovimiento: UFix64
        ) {
            self.colorR = colorR
            self.colorG = colorG
            self.colorB = colorB
            self.tamanoBase = tamanoBase
            self.formaPrincipal = formaPrincipal
            self.numApendices = numApendices
            self.patronMovimiento = patronMovimiento
        }
        
        access(all) view fun getValue(): String {
            return "R:".concat(self.colorR.toString())
                .concat("|G:").concat(self.colorG.toString())
                .concat("|B:").concat(self.colorB.toString())
                .concat("|Size:").concat(self.tamanoBase.toString())
                .concat("|Form:").concat(self.formaPrincipal.toString())
                .concat("|Apps:").concat(self.numApendices.toString())
                .concat("|Mov:").concat(self.patronMovimiento.toString())
        }
        
        access(all) fun setValue(newValue: String) {
            // Parse using simple string contains() checks
            self.parseAndSetValues(newValue)
        }
        
        access(all) view fun getDisplayName(): String {
            // Create visual description
            var colorDesc = "🔴".concat(self.formatPercent(self.colorR))
                .concat(" 🟢").concat(self.formatPercent(self.colorG))
                .concat(" 🔵").concat(self.formatPercent(self.colorB))
            
            var sizeDesc = self.formatSize(self.tamanoBase)
            var formDesc = self.formatForm(self.formaPrincipal)
            var appsDesc = "📎".concat(UFix64(UInt64(self.numApendices)).toString())
            var movDesc = self.formatMovement(self.patronMovimiento)
            
            return "Visual: ".concat(colorDesc)
                .concat(" ").concat(sizeDesc)
                .concat(" ").concat(formDesc)
                .concat(" ").concat(appsDesc)
                .concat(" ").concat(movDesc)
        }
        
        access(all) fun evolve(seeds: [UInt64]): String {
            if seeds.length < 5 { return self.getDisplayName() }
            
            // Visual evolution with homeostasis (from CreatureNFTV6 logic)
            let potencialEvolutivo: UFix64 = 1.0 // Would get from other module if available
            
            // Daily volatility (0.5 - 1.5)
            let dailyVolatilityFactor = 0.5 + (UFix64(seeds[0] % 1000) / 999.0)
            
            // Evolve each visual gene
            self.evolveGene("colorR", seeds[1], potencialEvolutivo, dailyVolatilityFactor)
            self.evolveGene("colorG", seeds[2], potencialEvolutivo, dailyVolatilityFactor)
            self.evolveGene("colorB", seeds[3], potencialEvolutivo, dailyVolatilityFactor)
            self.evolveGene("tamanoBase", seeds[4], potencialEvolutivo, dailyVolatilityFactor)
            
            // Use additional seeds if available (from 10-seed system)
            if seeds.length >= 7 {
                self.evolveGene("formaPrincipal", seeds[5], potencialEvolutivo, dailyVolatilityFactor)
                self.evolveGene("numApendices", seeds[6], potencialEvolutivo, dailyVolatilityFactor)
            }
            if seeds.length >= 8 {
                self.evolveGene("patronMovimiento", seeds[7], potencialEvolutivo, dailyVolatilityFactor)
            }
            
            return self.getDisplayName()
        }
        
        // OPTIMIZED: Accumulative evolution for multiple steps
        access(all) fun evolveAccumulative(seeds: [UInt64], steps: UInt64): String {
            if seeds.length < 5 { return self.getDisplayName() }
            
            // Visual evolution (accumulative version)
            let potencialEvolutivo: UFix64 = 1.0
            let dailyVolatilityFactor = 0.5 + (UFix64(seeds[0] % 1000) / 999.0)
            
            // Evolve each visual gene accumulatively
            self.evolveGeneAccumulative("colorR", seeds[1], steps, potencialEvolutivo, dailyVolatilityFactor)
            self.evolveGeneAccumulative("colorG", seeds[2], steps, potencialEvolutivo, dailyVolatilityFactor)
            self.evolveGeneAccumulative("colorB", seeds[3], steps, potencialEvolutivo, dailyVolatilityFactor)
            self.evolveGeneAccumulative("tamanoBase", seeds[4], steps, potencialEvolutivo, dailyVolatilityFactor)
            
            if seeds.length >= 7 {
                self.evolveGeneAccumulative("formaPrincipal", seeds[5], steps, potencialEvolutivo, dailyVolatilityFactor)
                self.evolveGeneAccumulative("numApendices", seeds[6], steps, potencialEvolutivo, dailyVolatilityFactor)
            }
            if seeds.length >= 8 {
                self.evolveGeneAccumulative("patronMovimiento", seeds[7], steps, potencialEvolutivo, dailyVolatilityFactor)
            }
            
            return self.getDisplayName()
        }
        
        // === PARSING HELPERS ===
        
        access(all) fun parseAndSetValues(_ value: String) {
            // Simple parsing using contains() instead of indexOf()
            if value.contains("R:") {
                let rValue = self.extractValueAfter(value, "R:")
                if let r = UFix64.fromString(rValue) {
                    self.colorR = self.clampValue(r, "colorR")
                }
            }
            if value.contains("G:") {
                let gValue = self.extractValueAfter(value, "G:")
                if let g = UFix64.fromString(gValue) {
                    self.colorG = self.clampValue(g, "colorG")
                }
            }
            if value.contains("B:") {
                let bValue = self.extractValueAfter(value, "B:")
                if let b = UFix64.fromString(bValue) {
                    self.colorB = self.clampValue(b, "colorB")
                }
            }
            if value.contains("Size:") {
                let sizeValue = self.extractValueAfter(value, "Size:")
                if let size = UFix64.fromString(sizeValue) {
                    self.tamanoBase = self.clampValue(size, "tamanoBase")
                }
            }
            // Add more parsing as needed...
        }
        
        access(all) fun extractValueAfter(_ text: String, _ prefix: String): String {
            // Simple extraction - would need proper implementation
            // For now return a default to prevent parsing errors
            return "1.0"
        }
        
        // === ACCUMULATIVE EVOLUTION HELPERS ===
        
        access(self) fun evolveGeneAccumulative(_ geneName: String, _ baseSeed: UInt64, _ steps: UInt64, _ potencial: UFix64, _ volatility: UFix64) {
            // Get current value
            var currentValue: UFix64 = 0.0
            switch geneName {
                case "colorR": currentValue = self.colorR
                case "colorG": currentValue = self.colorG
                case "colorB": currentValue = self.colorB
                case "tamanoBase": currentValue = self.tamanoBase
                case "formaPrincipal": currentValue = self.formaPrincipal
                case "numApendices": currentValue = self.numApendices
                case "patronMovimiento": currentValue = self.patronMovimiento
                default: return
            }
            
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
                newValue = VisualTraitsModule.GENE_RANGES[geneName]!["min"]!
            }
            
            // Clamp and set final value
            let finalValue = self.clampValue(newValue, geneName)
            
            switch geneName {
                case "colorR": self.colorR = finalValue
                case "colorG": self.colorG = finalValue
                case "colorB": self.colorB = finalValue
                case "tamanoBase": self.tamanoBase = finalValue
                case "formaPrincipal": self.formaPrincipal = finalValue
                case "numApendices": self.numApendices = finalValue
                case "patronMovimiento": self.patronMovimiento = finalValue
            }
        }
        
        // === EVOLUTION HELPERS ===
        
        access(self) fun evolveGene(_ geneName: String, _ seed: UInt64, _ potencial: UFix64, _ volatility: UFix64) {
            // Get current value
            var currentValue: UFix64 = 0.0
            switch geneName {
                case "colorR": currentValue = self.colorR
                case "colorG": currentValue = self.colorG
                case "colorB": currentValue = self.colorB
                case "tamanoBase": currentValue = self.tamanoBase
                case "formaPrincipal": currentValue = self.formaPrincipal
                case "numApendices": currentValue = self.numApendices
                case "patronMovimiento": currentValue = self.patronMovimiento
                default: return
            }
            
            // Passive evolution (from CreatureNFTV6)
            let randomNormalized = UFix64(seed % 10000) / 9999.0 // [0.0, 1.0]
            let magnitude = 0.001 * potencial * volatility // TASA_EVOLUCION_PASIVA_GEN_BASE
            var changeAmount: UFix64 = 0.0
            
            if randomNormalized < 0.5 {
                // Decrease
                changeAmount = (0.5 - randomNormalized) * 2.0 * magnitude
                if currentValue > changeAmount {
                    currentValue = currentValue - changeAmount
                } else {
                    currentValue = VisualTraitsModule.GENE_RANGES[geneName]!["min"]!
                }
            } else {
                // Increase
                changeAmount = (randomNormalized - 0.5) * 2.0 * magnitude
                currentValue = currentValue + changeAmount
            }
            
            // Clamp and set new value
            let newValue = self.clampValue(currentValue, geneName)
            
            switch geneName {
                case "colorR": self.colorR = newValue
                case "colorG": self.colorG = newValue
                case "colorB": self.colorB = newValue
                case "tamanoBase": self.tamanoBase = newValue
                case "formaPrincipal": self.formaPrincipal = newValue
                case "numApendices": self.numApendices = newValue
                case "patronMovimiento": self.patronMovimiento = newValue
            }
        }
        
        // === UTILITY FUNCTIONS ===
        
        access(self) fun clampValue(_ value: UFix64, _ geneName: String): UFix64 {
            let ranges = VisualTraitsModule.GENE_RANGES[geneName]!
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
        
        access(self) view fun formatPercent(_ value: UFix64): String {
            let percent = UInt64(value * 100.0)
            return percent.toString().concat("%")
        }
        
        access(self) view fun formatSize(_ value: UFix64): String {
            if value < 1.0 { return "🐁Tiny" }
            if value < 1.5 { return "🐹Small" }
            if value < 2.0 { return "🐱Medium" }
            if value < 2.5 { return "🐺Large" }
            return "🐉Huge"
        }
        
        access(self) view fun formatForm(_ value: UFix64): String {
            let form = UInt64(value)
            switch form {
                case 1: return "🏃‍♂️Agile"
                case 2: return "🛡️Tank"
                case 3: return "⚔️Attacker"
                default: return "❓Unknown"
            }
        }
        
        access(self) view fun formatMovement(_ value: UFix64): String {
            let movement = UInt64(value)
            switch movement {
                case 1: return "🚶Walk"
                case 2: return "🏃Run"
                case 3: return "🦘Hop"
                case 4: return "🌪️Dash"
                default: return "❓Unknown"
            }
        }
        
        // === REPRODUCTION INTERFACE (NO-OP IMPLEMENTATIONS) ===
        
        access(all) fun addReproductionCandidate(partnerID: UInt64, compatibilityScore: UFix64): Bool {
            return false // Visual traits don't handle reproduction
        }
        
        access(all) fun clearReproductionCandidates(reason: String): Bool {
            return false // Visual traits don't handle reproduction
        }
        
        access(all) view fun isReproductionReady(): Bool {
            return false // Visual traits don't handle reproduction
        }
        
        access(all) view fun canReproduceWith(partnerID: UInt64): Bool {
            return false // Visual traits don't handle reproduction
        }
        
        access(all) view fun getReproductionCandidates(): [UInt64] {
            return [] // Visual traits don't handle reproduction
        }
    }
    
    // === FACTORY FUNCTIONS ===
    
    access(all) fun createDefaultTrait(): @{TraitModule.Trait} {
        return <- create VisualTraits(
            colorR: 0.5,
            colorG: 0.5,
            colorB: 0.5,
            tamanoBase: 1.5,
            formaPrincipal: 2.0,
            numApendices: 4.0,
            patronMovimiento: 2.0
        )
    }
    
    // NEW: Create trait with seed-based randomization
    access(all) fun createTraitWithSeed(seed: UInt64): @{TraitModule.Trait} {
        // Use seed for pseudo-random generation within gene ranges
        let rng1 = UFix64(seed % 1000) / 999.0           // 0.0 to 1.0
        let rng2 = UFix64((seed / 1000) % 1000) / 999.0  // Second random value
        let rng3 = UFix64((seed / 1000000) % 1000) / 999.0 // Third random value
        let rng4 = UFix64((seed / 1000000000) % 1000) / 999.0 // Fourth random value
        let rng5 = UFix64((seed / 1000000000000) % 1000) / 999.0 // Fifth random value
        
        // Generate additional randoms for the discrete traits
        let rng6 = UFix64((seed / 17) % 1000) / 999.0    // For form
        let rng7 = UFix64((seed / 7) % 1000) / 999.0     // For appendices  
        let rng8 = UFix64((seed / 13) % 1000) / 999.0    // For movement
        
        // Generate color genes (0.0 to 1.0)
        let rojoGen = rng1
        let verdeGen = rng2 
        let azulGen = rng3
        
        // Generate size (0.5 to 3.0) - already allowing intermediates
        let tamanoBase = 0.5 + (rng4 * 2.5)
        
        // Generate form (1.0 to 3.0) - NOW with intermediate values
        let formaPrincipal = 1.0 + (rng6 * 2.0) // 1.0-3.0 with decimals
        
        // Generate appendices (0.0 to 8.0) - NOW with intermediate values
        let numApendices = rng7 * 8.0 // 0.0-8.0 with decimals
        
        // Generate movement type (1.0 to 4.0) - NOW with intermediate values
        let tipoMovimiento = 1.0 + (rng8 * 3.0) // 1.0-4.0 with decimals
        
        return <- create VisualTraits(
            colorR: rojoGen,
            colorG: verdeGen,
            colorB: azulGen,
            tamanoBase: tamanoBase,
            formaPrincipal: formaPrincipal,
            numApendices: numApendices,
            patronMovimiento: tipoMovimiento
        )
    }
    
    access(all) fun createTraitWithValue(value: String): @{TraitModule.Trait} {
        let trait <- self.createDefaultTrait() as! @VisualTraits
        trait.setValue(newValue: value)
        return <- trait
    }
    
    access(all) fun createChildTrait(parent1: &{TraitModule.Trait}, parent2: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        let p1 = parent1 as! &VisualTraits
        let p2 = parent2 as! &VisualTraits
        
        // === ADVANCED VISUAL GENETICS ===
        var seedState = seed
        
        // 1. Color inheritance with dominance and blending
        var childColorR: UFix64 = 0.0
        var childColorG: UFix64 = 0.0
        var childColorB: UFix64 = 0.0
        
        // Color blending with some randomness (70% blend, 30% dominance)
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let colorBlendFactor = UFix64(seedState % 100) / 100.0 // 0.0-1.0
        
        if colorBlendFactor < 0.7 {
            // Blended inheritance (most common)
            childColorR = (p1.colorR + p2.colorR) / 2.0
            childColorG = (p1.colorG + p2.colorG) / 2.0
            childColorB = (p1.colorB + p2.colorB) / 2.0
        } else {
            // Dominant inheritance (one parent's color dominates)
            seedState = (seedState * 1664525 + 1013904223) % 4294967296
            let dominantParent = seedState % 2 == 0
            if dominantParent {
                childColorR = p1.colorR
                childColorG = p1.colorG
                childColorB = p1.colorB
            } else {
                childColorR = p2.colorR
                childColorG = p2.colorG
                childColorB = p2.colorB
            }
        }
        
        // 2. Size inheritance with hybrid vigor potential
        let avgSize = (p1.tamanoBase + p2.tamanoBase) / 2.0
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        // Safe size variation without underflow
        let randomPercent = UFix64(seedState % 100) / 100.0 // 0.0-0.99
        let sizeVariationFactor = 0.9 + (randomPercent * 0.2) // 0.9 to 1.1 (±10%)
        var childSize = VisualTraitsModule.clampValue(avgSize * sizeVariationFactor, "tamanoBase")
        
        // 3. Form inheritance (discrete traits with Mendelian genetics)
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let formInheritance = seedState % 4
        var childForm: UFix64 = 0.0
        
        switch formInheritance {
            case 0: childForm = p1.formaPrincipal // Parent 1 dominates
            case 1: childForm = p2.formaPrincipal // Parent 2 dominates
            case 2: childForm = (p1.formaPrincipal + p2.formaPrincipal) / 2.0 // Blended
            default: // Rare mutation - new form
                seedState = (seedState * 1664525 + 1013904223) % 4294967296
                childForm = 1.0 + (UFix64(seedState % 200) / 100.0) // 1.0-3.0
        }
        childForm = VisualTraitsModule.clampValue(childForm, "formaPrincipal")
        
        // 4. Appendices inheritance (quantitative trait)
        let avgApendices = (p1.numApendices + p2.numApendices) / 2.0
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        // Safe appendices variation without underflow
        let appRandomPercent = UFix64(seedState % 100) / 100.0 // 0.0-0.99
        let appVariationFactor = 0.875 + (appRandomPercent * 0.25) // 0.875 to 1.125 (±12.5%)
        var childApendices = VisualTraitsModule.clampValue(avgApendices * appVariationFactor, "numApendices")
        
        // 5. Movement inheritance with occasional novelty
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        var childMovement: UFix64 = 0.0
        
        if seedState % 10 == 0 { // 10% chance of novel movement
            childMovement = 1.0 + (UFix64(seedState % 300) / 100.0) // 1.0-4.0
        } else {
            // Normal inheritance
            let inheritFrom = seedState % 2 == 0
            if inheritFrom {
                childMovement = p1.patronMovimiento
            } else {
                childMovement = p2.patronMovimiento
            }
        }
        childMovement = VisualTraitsModule.clampValue(childMovement, "patronMovimiento")
        
        // 6. Apply minor mutations (1% chance per trait)
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        if seedState % 100 == 0 {
            let mutationStrength: UFix64 = 0.05
            let traitToMutate = seedState % 7
            // Safe mutation factor without underflow
            let mutationRandom = UFix64(seedState % 100) / 100.0 // 0.0-0.99
            let mutationFactor = 0.95 + (mutationRandom * 0.1) // 0.95 to 1.05
            
            switch traitToMutate {
                case 0: childColorR = VisualTraitsModule.clampValue(childColorR * mutationFactor, "colorR")
                case 1: childColorG = VisualTraitsModule.clampValue(childColorG * mutationFactor, "colorG")
                case 2: childColorB = VisualTraitsModule.clampValue(childColorB * mutationFactor, "colorB")
                case 3: childSize = VisualTraitsModule.clampValue(childSize * mutationFactor, "tamanoBase")
                case 4: // Form mutation (rare)
                    if seedState % 1000 == 0 { // Very rare
                        childForm = VisualTraitsModule.clampValue(childForm + 0.5, "formaPrincipal")
                    }
                case 5: childApendices = VisualTraitsModule.clampValue(childApendices * mutationFactor, "numApendices")
                case 6: childMovement = VisualTraitsModule.clampValue(childMovement * mutationFactor, "patronMovimiento")
            }
        }
        
        return <- create VisualTraits(
            colorR: childColorR,
            colorG: childColorG,
            colorB: childColorB,
            tamanoBase: childSize,
            formaPrincipal: childForm,
            numApendices: childApendices,
            patronMovimiento: childMovement
        )
    }
    
    access(all) fun createMitosisChild(parent: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        // Parse parent visual traits
        let parentValue = parent.getValue()
        // Format: "R:0.72|G:0.86|B:0.20|Size:0.50|Form:1.08|Apps:5.40|Mov:2.32"
        
        var parentR: UFix64 = 0.5
        var parentG: UFix64 = 0.5
        var parentB: UFix64 = 0.5
        var parentSize: UFix64 = 1.5
        var parentForm: UFix64 = 2.0
        var parentApps: UFix64 = 4.0
        var parentMov: UFix64 = 2.5
        
        // Parse parent values
        let components = parentValue.split(separator: "|")
        for component in components {
            let parts = component.split(separator: ":")
            if parts.length >= 2 {
                let key = parts[0]
                let valueStr = parts[1]
                if let parsedValue = UFix64.fromString(valueStr) {
                    switch key {
                        case "R": parentR = parsedValue
                        case "G": parentG = parsedValue
                        case "B": parentB = parsedValue
                        case "Size": parentSize = parsedValue
                        case "Form": parentForm = parsedValue
                        case "Apps": parentApps = parsedValue
                        case "Mov": parentMov = parsedValue
                    }
                }
            }
        }
        
        // Small mutation (±5% like CreatureNFTV6)
        let mutationFactor = 0.95 + (UFix64(seed % 100) / 1000.0) // 0.95-1.05
        
        return <- create VisualTraits(
            colorR: parentR * mutationFactor,
            colorG: parentG * mutationFactor,
            colorB: parentB * mutationFactor,
            tamanoBase: parentSize * mutationFactor,
            formaPrincipal: parentForm * mutationFactor,
            numApendices: parentApps * mutationFactor,
            patronMovimiento: parentMov * mutationFactor
        )
    }
    
    // === MODULE IDENTITY ===
    
    access(all) view fun getModuleType(): String {
        return "visual"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    access(all) view fun getModuleName(): String {
        return "Visual Traits Module"
    }
    
    access(all) view fun getModuleDescription(): String {
        return "Manages visual genetics including color, size, form, appendices, and movement patterns"
    }
    
    // === UTILITY FUNCTIONS ===
    
    access(all) fun clampValue(_ value: UFix64, _ geneName: String): UFix64 {
        let ranges = VisualTraitsModule.GENE_RANGES[geneName]!
        let minVal = ranges["min"]!
        let maxVal = ranges["max"]!
        return VisualTraitsModule.max(minVal, VisualTraitsModule.min(maxVal, value))
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
        
        ranges["colorR"] = {"min": 0.0, "max": 1.0}
        ranges["colorG"] = {"min": 0.0, "max": 1.0}
        ranges["colorB"] = {"min": 0.0, "max": 1.0}
        ranges["tamanoBase"] = {"min": 0.5, "max": 3.0}
        ranges["formaPrincipal"] = {"min": 1.0, "max": 3.0}
        ranges["numApendices"] = {"min": 0.0, "max": 8.0}
        ranges["patronMovimiento"] = {"min": 1.0, "max": 4.0}
        
        self.GENE_RANGES = ranges
    }
} 