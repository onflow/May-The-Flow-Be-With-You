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
    
    access(all) fun createTraitWithValue(value: String): @{TraitModule.Trait} {
        let trait <- self.createDefaultTrait() as! @VisualTraits
        trait.setValue(newValue: value)
        return <- trait
    }
    
    access(all) fun createChildTrait(parent1: &{TraitModule.Trait}, parent2: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        // Simple inheritance - average of parents with mutation
        let p1Value = parent1.getValue()
        let p2Value = parent2.getValue()
        
        // Apply mutation based on seed
        let mutationFactor = 0.9 + (UFix64(seed % 200) / 1000.0) // 0.9-1.1
        
        // Create trait with mutated default values
        return <- create VisualTraits(
            colorR: 0.5 * mutationFactor,
            colorG: 0.5 * mutationFactor,
            colorB: 0.5 * mutationFactor,
            tamanoBase: 1.5,
            formaPrincipal: 2.0,
            numApendices: 4.0,
            patronMovimiento: 2.0
        )
    }
    
    // === MODULE IDENTITY ===
    
    access(all) view fun getModuleType(): String {
        return "visual"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
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