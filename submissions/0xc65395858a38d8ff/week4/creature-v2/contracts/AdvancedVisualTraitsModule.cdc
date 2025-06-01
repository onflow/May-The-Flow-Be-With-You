// AdvancedVisualTraitsModule.cdc
// Advanced visual genetics module for enhanced creature appearance and effects

import "TraitModule"

access(all) contract AdvancedVisualTraitsModule: TraitModule {
    
    // === VISUAL CONSTANTS ===
    access(all) let GENE_RANGES: {String: {String: UFix64}}
    access(all) let PATTERN_TYPES: {UInt8: String}
    access(all) let AURA_TYPES: {UInt8: String}
    access(all) let EYE_TYPES: {UInt8: String}
    access(all) let MOUTH_TYPES: {UInt8: String}
    access(all) let TEXTURE_TYPES: {UInt8: String}
    access(all) let EVOLUTION_MARK_TYPES: {UInt8: String}
    access(all) let ELEMENTAL_EFFECTS: {UInt8: String}
    
    // === EVOLUTION MARKS CONSTANTS ===
    access(all) let MARK_FIRST_EVOLUTION: UInt8
    access(all) let MARK_SURVIVOR: UInt8
    access(all) let MARK_BREEDER: UInt8
    access(all) let MARK_ELDER: UInt8
    access(all) let MARK_FIGHTER: UInt8
    access(all) let MARK_EXPLORER: UInt8
    
    // === ADVANCED VISUAL TRAITS RESOURCE ===
    access(all) resource AdvancedVisualTraits: TraitModule.Trait {
        
        // === SURFACE PATTERNS ===
        access(all) var tipoPatron: UInt8              // 0=smooth, 1=spots, 2=stripes, 3=dots, 4=swirls
        access(all) var densidadPatron: UFix64         // 0.0-1.0 pattern density
        access(all) var colorSecundarioR: UFix64       // 0.0-1.0 secondary color R
        access(all) var colorSecundarioG: UFix64       // 0.0-1.0 secondary color G  
        access(all) var colorSecundarioB: UFix64       // 0.0-1.0 secondary color B
        access(all) var brilloSuperficie: UFix64       // 0.0-1.0 metallic/matte
        
        // === VISUAL EFFECTS ===
        access(all) var tipoAura: UInt8                // 0=none, 1=fire, 2=water, 3=earth, 4=air
        access(all) var intensidadAura: UFix64         // 0.0-1.0 aura visibility
        access(all) var emiteLuz: Bool                 // Bioluminescence
        access(all) var colorLuzR: UFix64              // 0.0-1.0 light color R
        access(all) var colorLuzG: UFix64              // 0.0-1.0 light color G
        access(all) var colorLuzB: UFix64              // 0.0-1.0 light color B
        
        // === DETAILED PHYSICAL TRAITS ===
        access(all) var tipoOjos: UInt8                // 0=round, 1=feline, 2=compound, 3=multiple
        access(all) var tamanoOjos: UFix64             // 0.5-2.0 eye size multiplier
        access(all) var tipoBoca: UInt8                // 0=small, 1=large, 2=beak, 3=tentacles
        access(all) var texturaPiel: UInt8             // 0=smooth, 1=scaled, 2=furry, 3=crystalline
        
        // === VISUAL CYCLES ===
        access(all) var ritmoCircadiano: UFix64        // 0.0-1.0 day/night cycle
        access(all) var nivelSalud: UFix64             // 0.0-1.0 affects general brightness
        access(all) var nivelEnergia: UFix64           // 0.0-1.0 animation speed
        
        // === SPECIAL EFFECTS ===
        access(all) var marcasEvolucion: [UInt8]       // Array of evolution marks earned
        access(all) var efectoElemental: UInt8         // 0=normal, 1=crystal, 2=flame, 3=ice
        
        init(
            tipoPatron: UInt8,
            densidadPatron: UFix64,
            colorSecundarioR: UFix64,
            colorSecundarioG: UFix64,
            colorSecundarioB: UFix64,
            brilloSuperficie: UFix64,
            tipoAura: UInt8,
            intensidadAura: UFix64,
            emiteLuz: Bool,
            colorLuzR: UFix64,
            colorLuzG: UFix64,
            colorLuzB: UFix64,
            tipoOjos: UInt8,
            tamanoOjos: UFix64,
            tipoBoca: UInt8,
            texturaPiel: UInt8,
            ritmoCircadiano: UFix64,
            nivelSalud: UFix64,
            nivelEnergia: UFix64,
            efectoElemental: UInt8
        ) {
            self.tipoPatron = tipoPatron
            self.densidadPatron = densidadPatron
            self.colorSecundarioR = colorSecundarioR
            self.colorSecundarioG = colorSecundarioG
            self.colorSecundarioB = colorSecundarioB
            self.brilloSuperficie = brilloSuperficie
            self.tipoAura = tipoAura
            self.intensidadAura = intensidadAura
            self.emiteLuz = emiteLuz
            self.colorLuzR = colorLuzR
            self.colorLuzG = colorLuzG
            self.colorLuzB = colorLuzB
            self.tipoOjos = tipoOjos
            self.tamanoOjos = tamanoOjos
            self.tipoBoca = tipoBoca
            self.texturaPiel = texturaPiel
            self.ritmoCircadiano = ritmoCircadiano
            self.nivelSalud = nivelSalud
            self.nivelEnergia = nivelEnergia
            self.marcasEvolucion = []
            self.efectoElemental = efectoElemental
        }
        
        // === TRAIT INTERFACE IMPLEMENTATION ===
        
        access(all) view fun getValue(): String {
            return "PAT:".concat(self.tipoPatron.toString())
                .concat("|DENS:").concat(self.densidadPatron.toString())
                .concat("|SEC:").concat(self.colorSecundarioR.toString())
                .concat(",").concat(self.colorSecundarioG.toString())
                .concat(",").concat(self.colorSecundarioB.toString())
                .concat("|BRILL:").concat(self.brilloSuperficie.toString())
                .concat("|AURA:").concat(self.tipoAura.toString())
                .concat("|AINT:").concat(self.intensidadAura.toString())
                .concat("|LUZ:").concat(self.emiteLuz ? "1" : "0")
                .concat("|LUZC:").concat(self.colorLuzR.toString())
                .concat(",").concat(self.colorLuzG.toString())
                .concat(",").concat(self.colorLuzB.toString())
                .concat("|OJOS:").concat(self.tipoOjos.toString())
                .concat("|TOJOS:").concat(self.tamanoOjos.toString())
                .concat("|BOCA:").concat(self.tipoBoca.toString())
                .concat("|TEX:").concat(self.texturaPiel.toString())
                .concat("|RITMO:").concat(self.ritmoCircadiano.toString())
                .concat("|SALUD:").concat(self.nivelSalud.toString())
                .concat("|ENERGIA:").concat(self.nivelEnergia.toString())
                .concat("|ELEM:").concat(self.efectoElemental.toString())
                .concat("|MARCAS:").concat(self.getMarcasString())
        }
        
        access(all) fun setValue(newValue: String) {
            // Simple setValue implementation for backwards compatibility
            // In a full implementation, you would parse the string and set values
            log("AdvancedVisualTraits setValue called with: ".concat(newValue))
        }
        
        access(all) view fun getDisplayName(): String {
            let patternName = AdvancedVisualTraitsModule.PATTERN_TYPES[self.tipoPatron] ?? "Unknown"
            let auraName = AdvancedVisualTraitsModule.AURA_TYPES[self.tipoAura] ?? "None"
            let eyeName = AdvancedVisualTraitsModule.EYE_TYPES[self.tipoOjos] ?? "Round"
            let healthDisplay = self.formatHealth(self.nivelSalud)
            let energyDisplay = self.formatEnergy(self.nivelEnergia)
            
            var display = "🎨".concat(patternName)
            
            if self.tipoAura > 0 {
                display = display.concat(" ").concat(auraName)
            }
            
            if self.emiteLuz {
                display = display.concat(" ✨Glow")
            }
            
            display = display.concat(" ").concat(eyeName).concat("👁️")
                .concat(" ").concat(healthDisplay)
                .concat(" ").concat(energyDisplay)
            
            if self.marcasEvolucion.length > 0 {
                display = display.concat(" 🏆").concat(self.marcasEvolucion.length.toString())
            }
            
            return display
        }
        
        // === HELPER FUNCTIONS ===
        
        access(self) view fun getMarcasString(): String {
            var result = ""
            var i = 0
            while i < self.marcasEvolucion.length {
                if i > 0 { result = result.concat(",") }
                result = result.concat(self.marcasEvolucion[i].toString())
                i = i + 1
            }
            return result
        }
        
        access(self) view fun formatHealth(_ health: UFix64): String {
            if health < 0.3 { return "💀Weak" }
            if health < 0.6 { return "😷Sick" }
            if health < 0.8 { return "😐OK" }
            return "💪Strong"
        }
        
        access(self) view fun formatEnergy(_ energy: UFix64): String {
            if energy < 0.3 { return "😴Tired" }
            if energy < 0.6 { return "🚶Calm" }
            if energy < 0.8 { return "⚡Active" }
            return "🔥Hyper"
        }
        
        access(all) fun tieneMarca(_ marcaID: UInt8): Bool {
            for marca in self.marcasEvolucion {
                if marca == marcaID {
                    return true
                }
            }
            return false
        }
        
        // === EVOLUTION MARKS SYSTEM ===
        
        access(all) fun evaluarNuevasMarcas(edadDias: UFix64, vidaMaxima: UFix64, puntosEvolucion: UFix64, reproducciones: UInt64) {
            // Marca de Primera Evolución (gained EP > 30)
            if puntosEvolucion >= 30.0 && !self.tieneMarca(AdvancedVisualTraitsModule.MARK_FIRST_EVOLUTION) {
                self.marcasEvolucion.append(AdvancedVisualTraitsModule.MARK_FIRST_EVOLUTION)
            }
            
            // Marca de Superviviente (50% de vida)
            if edadDias >= (vidaMaxima * 0.5) && !self.tieneMarca(AdvancedVisualTraitsModule.MARK_SURVIVOR) {
                self.marcasEvolucion.append(AdvancedVisualTraitsModule.MARK_SURVIVOR)
            }
            
            // Marca de Reproductor (tuvo hijos)
            if reproducciones > 0 && !self.tieneMarca(AdvancedVisualTraitsModule.MARK_BREEDER) {
                self.marcasEvolucion.append(AdvancedVisualTraitsModule.MARK_BREEDER)
            }
            
            // Marca de Anciano (80% de vida)
            if edadDias >= (vidaMaxima * 0.8) && !self.tieneMarca(AdvancedVisualTraitsModule.MARK_ELDER) {
                self.marcasEvolucion.append(AdvancedVisualTraitsModule.MARK_ELDER)
            }
            
            // Marca de Luchador (much EP gained, implies combat/evolution success)
            if puntosEvolucion >= 100.0 && !self.tieneMarca(AdvancedVisualTraitsModule.MARK_FIGHTER) {
                self.marcasEvolucion.append(AdvancedVisualTraitsModule.MARK_FIGHTER)
            }
        }
        
        // === EVOLUTION FUNCTIONS ===
        
        access(all) fun evolve(seeds: [UInt64]): String {
            if seeds.length < 3 { return self.getDisplayName() }
            
            // Evolve visual traits slowly and safely
            let potencial: UFix64 = 1.0 // Default evolution potential
            let volatility = 0.5 + (UFix64(seeds[0] % 1000) / 999.0) // 0.5-1.5
            
            // Evolve different visual aspects using different seeds
            self.evolvePatterns(seeds[0], potencial, volatility)
            self.evolveEffects(seeds[1], potencial, volatility)
            self.evolvePhysicalTraits(seeds[2], potencial, volatility)
            
            // Update circadian rhythm and health/energy cycles
            self.updateCycles(seeds)
            
            return self.getDisplayName()
        }
        
        access(all) fun evolveAccumulative(seeds: [UInt64], steps: UInt64): String {
            if seeds.length < 3 { return self.getDisplayName() }
            
            // Accumulative evolution for multiple steps
            let potencial: UFix64 = 1.0
            let baseVolatility = 0.5 + (UFix64(seeds[0] % 1000) / 999.0)
            
            // Scale evolution by number of steps
            let scaledVolatility = baseVolatility * UFix64(steps) / 250.0 // Normalized to daily steps
            
            self.evolvePatterns(seeds[0], potencial, scaledVolatility)
            self.evolveEffects(seeds[1], potencial, scaledVolatility)
            self.evolvePhysicalTraits(seeds[2], potencial, scaledVolatility)
            self.updateCycles(seeds)
            
            return self.getDisplayName()
        }
        
        // === EVOLUTION HELPERS ===
        
        access(self) fun evolvePatterns(_ seed: UInt64, _ potencial: UFix64, _ volatility: UFix64) {
            // Pattern evolution - very slow changes
            let magnitude = 0.0001 * potencial * volatility
            var randomSeed = seed
            
            // Evolve pattern density
            randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
            let randomNormalized = UFix64(randomSeed % 10000) / 9999.0
            
            if randomNormalized < 0.5 {
                let decrease = (0.5 - randomNormalized) * 2.0 * magnitude
                self.densidadPatron = self.densidadPatron > decrease ? self.densidadPatron - decrease : 0.0
            } else {
                let increase = (randomNormalized - 0.5) * 2.0 * magnitude
                self.densidadPatron = self.min(1.0, self.densidadPatron + increase)
            }
            
            // Evolve secondary colors slightly
            self.evolveColorComponent(randomSeed, magnitude, "R")
            self.evolveColorComponent(randomSeed * 2, magnitude, "G")
            self.evolveColorComponent(randomSeed * 3, magnitude, "B")
            
            // Very rare pattern type mutations
            if (randomSeed % 10000) == 0 { // 0.01% chance
                self.tipoPatron = UInt8((randomSeed / 1000) % 5) // 0-4
            }
        }
        
        access(self) fun evolveEffects(_ seed: UInt64, _ potencial: UFix64, _ volatility: UFix64) {
            // Effects evolution
            let magnitude = 0.0002 * potencial * volatility
            var randomSeed = seed
            
            // Evolve aura intensity
            randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
            let randomNormalized = UFix64(randomSeed % 10000) / 9999.0
            
            if randomNormalized < 0.5 {
                let decrease = (0.5 - randomNormalized) * 2.0 * magnitude
                self.intensidadAura = self.intensidadAura > decrease ? self.intensidadAura - decrease : 0.0
            } else {
                let increase = (randomNormalized - 0.5) * 2.0 * magnitude
                self.intensidadAura = self.min(1.0, self.intensidadAura + increase)
            }
            
            // Evolve brightness
            randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
            let brightNormalized = UFix64(randomSeed % 10000) / 9999.0
            
            if brightNormalized < 0.5 {
                let decrease = (0.5 - brightNormalized) * 2.0 * magnitude
                self.brilloSuperficie = self.brilloSuperficie > decrease ? self.brilloSuperficie - decrease : 0.0
            } else {
                let increase = (brightNormalized - 0.5) * 2.0 * magnitude
                self.brilloSuperficie = self.min(1.0, self.brilloSuperficie + increase)
            }
            
            // Rare aura type changes
            if (randomSeed % 5000) == 0 { // 0.02% chance
                self.tipoAura = UInt8((randomSeed / 1000) % 5) // 0-4
            }
        }
        
        access(self) fun evolvePhysicalTraits(_ seed: UInt64, _ potencial: UFix64, _ volatility: UFix64) {
            // Physical traits evolution
            let magnitude = 0.0001 * potencial * volatility
            var randomSeed = seed
            
            // Evolve eye size safely
            randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296
            let eyeNormalized = UFix64(randomSeed % 10000) / 9999.0
            
            if eyeNormalized < 0.5 {
                let decrease = (0.5 - eyeNormalized) * 2.0 * magnitude
                // Safely prevent underflow - eyes can't go below 0.5
                if self.tamanoOjos > (decrease + 0.5) {
                    self.tamanoOjos = self.tamanoOjos - decrease
                } else {
                    self.tamanoOjos = 0.5
                }
            } else {
                let increase = (eyeNormalized - 0.5) * 2.0 * magnitude
                self.tamanoOjos = self.min(2.0, self.tamanoOjos + increase)
            }
            
            // Rare physical mutations
            if (randomSeed % 8000) == 0 { // 0.0125% chance
                self.tipoOjos = UInt8((randomSeed / 2000) % 4) // 0-3
            }
            
            if (randomSeed % 7000) == 0 { // 0.014% chance
                self.tipoBoca = UInt8((randomSeed / 3000) % 4) // 0-3
            }
        }
        
        access(self) fun evolveColorComponent(_ seed: UInt64, _ magnitude: UFix64, _ component: String) {
            let randomNormalized = UFix64(seed % 10000) / 9999.0
            var currentValue: UFix64 = 0.0
            
            switch component {
                case "R": currentValue = self.colorSecundarioR
                case "G": currentValue = self.colorSecundarioG
                case "B": currentValue = self.colorSecundarioB
                default: return
            }
            
            var newValue = currentValue
            if randomNormalized < 0.5 {
                let decrease = (0.5 - randomNormalized) * 2.0 * magnitude
                newValue = currentValue > decrease ? currentValue - decrease : 0.0
            } else {
                let increase = (randomNormalized - 0.5) * 2.0 * magnitude
                newValue = self.min(1.0, currentValue + increase)
            }
            
            switch component {
                case "R": self.colorSecundarioR = newValue
                case "G": self.colorSecundarioG = newValue
                case "B": self.colorSecundarioB = newValue
            }
        }
        
        access(self) fun updateCycles(_ seeds: [UInt64]) {
            if seeds.length < 1 { return }
            
            // Update circadian rhythm based on time progression
            let currentTime = getCurrentBlock().timestamp
            let dayLength: UFix64 = 86400.0 // 24 hours in seconds
            let dayProgress = (UFix64(currentTime) % dayLength) / dayLength
            self.ritmoCircadiano = dayProgress
            
            // Health and energy can fluctuate slightly
            let healthSeed = seeds[0] % 10000
            if healthSeed < 10 { // 0.1% chance to change health
                let healthChange = UFix64(healthSeed) / 50000.0 // Very small change
                if (seeds[0] % 2) == 0 {
                    self.nivelSalud = self.min(1.0, self.nivelSalud + healthChange)
                } else {
                    self.nivelSalud = self.nivelSalud > healthChange ? self.nivelSalud - healthChange : 0.1
                }
            }
        }
        
        // === UTILITY FUNCTIONS ===
        
        access(self) fun min(_ a: UFix64, _ b: UFix64): UFix64 {
            return a < b ? a : b
        }
        
        access(self) fun max(_ a: UFix64, _ b: UFix64): UFix64 {
            return a > b ? a : b
        }
        
        access(self) fun clamp(_ value: UFix64, _ minVal: UFix64, _ maxVal: UFix64): UFix64 {
            return self.min(maxVal, self.max(minVal, value))
        }
        
        // === REPRODUCTION INTERFACE (NO-OP IMPLEMENTATIONS) ===
        // Advanced visual traits don't handle reproduction directly
        
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
        return <- create AdvancedVisualTraits(
            tipoPatron: 0,              // Smooth
            densidadPatron: 0.3,        // Light pattern
            colorSecundarioR: 0.5,      // Neutral gray
            colorSecundarioG: 0.5,
            colorSecundarioB: 0.5,
            brilloSuperficie: 0.2,      // Slightly matte
            tipoAura: 0,                // No aura
            intensidadAura: 0.0,
            emiteLuz: false,            // No glow
            colorLuzR: 0.8,             // Default warm light
            colorLuzG: 0.8,
            colorLuzB: 0.6,
            tipoOjos: 0,                // Round eyes
            tamanoOjos: 1.0,            // Normal size
            tipoBoca: 0,                // Small mouth
            texturaPiel: 0,             // Smooth skin
            ritmoCircadiano: 0.5,       // Mid-cycle
            nivelSalud: 0.8,            // Good health
            nivelEnergia: 0.7,          // Active
            efectoElemental: 0          // Normal
        )
    }
    
    access(all) fun createTraitWithSeed(seed: UInt64): @{TraitModule.Trait} {
        // Generate pseudo-random values using seed
        var seedState = seed
        
        // Generate pattern traits
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let tipoPatron = UInt8(seedState % 5) // 0-4
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let densidadPatron = UFix64(seedState % 1000) / 999.0 // 0.0-1.0
        
        // Generate secondary colors
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let colorSecundarioR = UFix64(seedState % 1000) / 999.0
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let colorSecundarioG = UFix64(seedState % 1000) / 999.0
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let colorSecundarioB = UFix64(seedState % 1000) / 999.0
        
        // Generate surface brightness
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let brilloSuperficie = UFix64(seedState % 1000) / 999.0
        
        // Generate aura traits
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let tipoAura = UInt8(seedState % 5) // 0-4
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let intensidadAura = UFix64(seedState % 1000) / 999.0
        
        // Generate light traits
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let emiteLuz = (seedState % 100) < 20 // 20% chance of bioluminescence
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let colorLuzR = 0.5 + (UFix64(seedState % 500) / 999.0) // 0.5-1.0 warm colors
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let colorLuzG = 0.4 + (UFix64(seedState % 600) / 999.0) // 0.4-1.0
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let colorLuzB = 0.2 + (UFix64(seedState % 700) / 999.0) // 0.2-0.9
        
        // Generate physical traits
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let tipoOjos = UInt8(seedState % 4) // 0-3
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let tamanoOjos = 0.5 + (UFix64(seedState % 1500) / 999.0) // 0.5-2.0
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let tipoBoca = UInt8(seedState % 4) // 0-3
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let texturaPiel = UInt8(seedState % 4) // 0-3
        
        // Generate cycle traits
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let ritmoCircadiano = UFix64(seedState % 1000) / 999.0
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let nivelSalud = 0.6 + (UFix64(seedState % 400) / 999.0) // 0.6-1.0 (generally healthy)
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let nivelEnergia = 0.3 + (UFix64(seedState % 700) / 999.0) // 0.3-1.0
        
        // Generate elemental effect
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let efectoElemental = UInt8(seedState % 4) // 0-3
        
        return <- create AdvancedVisualTraits(
            tipoPatron: tipoPatron,
            densidadPatron: densidadPatron,
            colorSecundarioR: colorSecundarioR,
            colorSecundarioG: colorSecundarioG,
            colorSecundarioB: colorSecundarioB,
            brilloSuperficie: brilloSuperficie,
            tipoAura: tipoAura,
            intensidadAura: intensidadAura,
            emiteLuz: emiteLuz,
            colorLuzR: colorLuzR,
            colorLuzG: colorLuzG,
            colorLuzB: colorLuzB,
            tipoOjos: tipoOjos,
            tamanoOjos: tamanoOjos,
            tipoBoca: tipoBoca,
            texturaPiel: texturaPiel,
            ritmoCircadiano: ritmoCircadiano,
            nivelSalud: nivelSalud,
            nivelEnergia: nivelEnergia,
            efectoElemental: efectoElemental
        )
    }
    
    access(all) fun createTraitWithValue(value: String): @{TraitModule.Trait} {
        let trait <- self.createDefaultTrait() as! @AdvancedVisualTraits
        trait.setValue(newValue: value)
        return <- trait
    }
    
    access(all) fun createChildTrait(parent1: &{TraitModule.Trait}, parent2: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        let p1 = parent1 as! &AdvancedVisualTraits
        let p2 = parent2 as! &AdvancedVisualTraits
        
        var seedState = seed
        
        // === INHERITANCE WITH VARIATIONS ===
        
        // Pattern inheritance - blend with slight mutation
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let patternChoice = seedState % 2
        let inheritedPatron = patternChoice == 0 ? p1.tipoPatron : p2.tipoPatron
        
        // Pattern mutation chance (5%)
        let childPatron = (seedState % 100) < 5 ? UInt8((seedState / 100) % 5) : inheritedPatron
        
        // Density - average with variation
        let avgDensity = (p1.densidadPatron + p2.densidadPatron) / 2.0
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let densityVariation = 0.9 + (UFix64(seedState % 200) / 1000.0) // 0.9-1.1 multiplier
        let childDensity = self.clamp(avgDensity * densityVariation, 0.0, 1.0)
        
        // Color inheritance - blend RGB channels separately
        let childColorR = self.blendColorSafely(p1.colorSecundarioR, p2.colorSecundarioR, seedState)
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let childColorG = self.blendColorSafely(p1.colorSecundarioG, p2.colorSecundarioG, seedState)
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let childColorB = self.blendColorSafely(p1.colorSecundarioB, p2.colorSecundarioB, seedState)
        
        // Brightness - average with hybrid vigor
        let avgBrillo = (p1.brilloSuperficie + p2.brilloSuperficie) / 2.0
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let brilloBonus = UFix64(seedState % 100) / 1000.0 // 0-0.1 bonus
        let childBrillo = self.clamp(avgBrillo + brilloBonus, 0.0, 1.0)
        
        // Aura inheritance - can inherit from either parent or mutate
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let auraChoice = seedState % 3
        var childAura: UInt8 = 0
        if auraChoice == 0 {
            childAura = p1.tipoAura
        } else if auraChoice == 1 {
            childAura = p2.tipoAura
        } else {
            childAura = UInt8((seedState / 100) % 5) // New aura type
        }
        
        // Aura intensity - average
        let childAuraIntensity = (p1.intensidadAura + p2.intensidadAura) / 2.0
        
        // Light inheritance
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let lightChance = seedState % 100
        let childEmiteLuz = p1.emiteLuz || p2.emiteLuz || lightChance < 5 // Parents or 5% new chance
        
        // Light colors - blend
        let childLuzR = self.blendColorSafely(p1.colorLuzR, p2.colorLuzR, seedState)
        let childLuzG = self.blendColorSafely(p1.colorLuzG, p2.colorLuzG, seedState * 2)
        let childLuzB = self.blendColorSafely(p1.colorLuzB, p2.colorLuzB, seedState * 3)
        
        // Physical traits inheritance
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let eyeChoice = seedState % 2
        let childOjos = eyeChoice == 0 ? p1.tipoOjos : p2.tipoOjos
        
        // Eye size - average with variation
        let avgEyeSize = (p1.tamanoOjos + p2.tamanoOjos) / 2.0
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let eyeVariation = 0.9 + (UFix64(seedState % 200) / 1000.0) // 0.9-1.1
        let childTamanoOjos = self.clamp(avgEyeSize * eyeVariation, 0.5, 2.0)
        
        // Mouth inheritance
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let mouthChoice = seedState % 2
        let childBoca = mouthChoice == 0 ? p1.tipoBoca : p2.tipoBoca
        
        // Texture inheritance
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let textureChoice = seedState % 2
        let childTextura = textureChoice == 0 ? p1.texturaPiel : p2.texturaPiel
        
        // Cycle traits - averages
        let childRitmo = (p1.ritmoCircadiano + p2.ritmoCircadiano) / 2.0
        let childSalud = (p1.nivelSalud + p2.nivelSalud) / 2.0
        let childEnergia = (p1.nivelEnergia + p2.nivelEnergia) / 2.0
        
        // Elemental effect - can inherit or mutate
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let elemChoice = seedState % 3
        var childElemental: UInt8 = 0
        if elemChoice == 0 {
            childElemental = p1.efectoElemental
        } else if elemChoice == 1 {
            childElemental = p2.efectoElemental
        } else {
            childElemental = UInt8((seedState / 100) % 4) // New effect
        }
        
        return <- create AdvancedVisualTraits(
            tipoPatron: childPatron,
            densidadPatron: childDensity,
            colorSecundarioR: childColorR,
            colorSecundarioG: childColorG,
            colorSecundarioB: childColorB,
            brilloSuperficie: childBrillo,
            tipoAura: childAura,
            intensidadAura: childAuraIntensity,
            emiteLuz: childEmiteLuz,
            colorLuzR: childLuzR,
            colorLuzG: childLuzG,
            colorLuzB: childLuzB,
            tipoOjos: childOjos,
            tamanoOjos: childTamanoOjos,
            tipoBoca: childBoca,
            texturaPiel: childTextura,
            ritmoCircadiano: childRitmo,
            nivelSalud: childSalud,
            nivelEnergia: childEnergia,
            efectoElemental: childElemental
        )
    }
    
    access(all) fun createMitosisChild(parent: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        let p = parent as! &AdvancedVisualTraits
        
        // Mitosis - mostly identical with small mutations
        var seedState = seed
        
        // Small chance of pattern mutations
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let childPatron = (seedState % 1000) == 0 ? UInt8((seedState / 1000) % 5) : p.tipoPatron
        
        // Very small variations in continuous traits
        let mutationFactor = 0.98 + (UFix64(seedState % 40) / 1000.0) // 0.98-1.02
        
        let childDensity = self.clamp(p.densidadPatron * mutationFactor, 0.0, 1.0)
        let childColorR = self.clamp(p.colorSecundarioR * mutationFactor, 0.0, 1.0)
        let childColorG = self.clamp(p.colorSecundarioG * mutationFactor, 0.0, 1.0)
        let childColorB = self.clamp(p.colorSecundarioB * mutationFactor, 0.0, 1.0)
        let childBrillo = self.clamp(p.brilloSuperficie * mutationFactor, 0.0, 1.0)
        let childAuraIntensity = self.clamp(p.intensidadAura * mutationFactor, 0.0, 1.0)
        let childTamanoOjos = self.clamp(p.tamanoOjos * mutationFactor, 0.5, 2.0)
        
        return <- create AdvancedVisualTraits(
            tipoPatron: childPatron,
            densidadPatron: childDensity,
            colorSecundarioR: childColorR,
            colorSecundarioG: childColorG,
            colorSecundarioB: childColorB,
            brilloSuperficie: childBrillo,
            tipoAura: p.tipoAura,
            intensidadAura: childAuraIntensity,
            emiteLuz: p.emiteLuz,
            colorLuzR: p.colorLuzR,
            colorLuzG: p.colorLuzG,
            colorLuzB: p.colorLuzB,
            tipoOjos: p.tipoOjos,
            tamanoOjos: childTamanoOjos,
            tipoBoca: p.tipoBoca,
            texturaPiel: p.texturaPiel,
            ritmoCircadiano: p.ritmoCircadiano,
            nivelSalud: p.nivelSalud,
            nivelEnergia: p.nivelEnergia,
            efectoElemental: p.efectoElemental
        )
    }
    
    // === HELPER FUNCTIONS ===
    
    access(all) fun blendColorSafely(_ color1: UFix64, _ color2: UFix64, _ seed: UInt64): UFix64 {
        let blend = (color1 + color2) / 2.0
        let variation = UFix64(seed % 200) / 1000.0 // ±0.1 variation
        let result = (seed % 2) == 0 ? blend + variation : blend > variation ? blend - variation : 0.0
        return self.clamp(result, 0.0, 1.0)
    }
    
    access(all) fun clamp(_ value: UFix64, _ minVal: UFix64, _ maxVal: UFix64): UFix64 {
        if value < minVal { return minVal }
        if value > maxVal { return maxVal }
        return value
    }
    
    // === MODULE IDENTITY ===
    
    access(all) view fun getModuleType(): String {
        return "advancedvisual"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    access(all) view fun getModuleName(): String {
        return "Advanced Visual Traits Module"
    }
    
    access(all) view fun getModuleDescription(): String {
        return "Enhanced visual genetics system with patterns, auras, bioluminescence, evolution marks, and advanced physical traits"
    }
    
    // === INITIALIZATION ===
    
    init() {
        // Initialize gene ranges for validation
        self.GENE_RANGES = {
            "tipoPatron": {"min": 0.0, "max": 4.0},
            "densidadPatron": {"min": 0.0, "max": 1.0},
            "colorSecundario": {"min": 0.0, "max": 1.0},
            "brilloSuperficie": {"min": 0.0, "max": 1.0},
            "tipoAura": {"min": 0.0, "max": 4.0},
            "intensidadAura": {"min": 0.0, "max": 1.0},
            "colorLuz": {"min": 0.0, "max": 1.0},
            "tipoOjos": {"min": 0.0, "max": 3.0},
            "tamanoOjos": {"min": 0.5, "max": 2.0},
            "tipoBoca": {"min": 0.0, "max": 3.0},
            "texturaPiel": {"min": 0.0, "max": 3.0},
            "ritmoCircadiano": {"min": 0.0, "max": 1.0},
            "nivelSalud": {"min": 0.0, "max": 1.0},
            "nivelEnergia": {"min": 0.0, "max": 1.0},
            "efectoElemental": {"min": 0.0, "max": 3.0}
        }
        
        // Initialize pattern types
        self.PATTERN_TYPES = {
            0: "Smooth",
            1: "Spots",
            2: "Stripes", 
            3: "Dots",
            4: "Swirls"
        }
        
        // Initialize aura types
        self.AURA_TYPES = {
            0: "None",
            1: "🔥Fire",
            2: "💧Water",
            3: "🌍Earth",
            4: "💨Air"
        }
        
        // Initialize eye types
        self.EYE_TYPES = {
            0: "Round",
            1: "Feline",
            2: "Compound",
            3: "Multiple"
        }
        
        // Initialize mouth types
        self.MOUTH_TYPES = {
            0: "Small",
            1: "Large",
            2: "Beak",
            3: "Tentacles"
        }
        
        // Initialize texture types
        self.TEXTURE_TYPES = {
            0: "Smooth",
            1: "Scaled",
            2: "Furry",
            3: "Crystalline"
        }
        
        // Initialize evolution mark types  
        self.EVOLUTION_MARK_TYPES = {
            1: "🌱FirstEvolution",
            2: "🛡️Survivor",
            3: "👶Breeder", 
            4: "👴Elder",
            5: "⚔️Fighter",
            6: "🗺️Explorer"
        }
        
        // Initialize elemental effects
        self.ELEMENTAL_EFFECTS = {
            0: "Normal",
            1: "💎Crystal",
            2: "🔥Flame",
            3: "❄️Ice"
        }
        
        // Initialize evolution mark constants
        self.MARK_FIRST_EVOLUTION = 1
        self.MARK_SURVIVOR = 2
        self.MARK_BREEDER = 3
        self.MARK_ELDER = 4
        self.MARK_FIGHTER = 5
        self.MARK_EXPLORER = 6
    }
} 