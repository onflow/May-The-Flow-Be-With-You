// ReproductionModule.cdc
// Advanced genetics and sexual reproduction module - COMPLETE GENETIC SYSTEM

import "TraitModule"

access(all) contract ReproductionModule: TraitModule {
    
    // === GENETIC CONSTANTS ===
    access(all) let GENETIC_MARKERS_COUNT: Int
    access(all) let OPTIMAL_GENETIC_DISTANCE: UFix64
    access(all) let MUTATION_CHANCE: UInt64  // 1 in X chance
    access(all) let MUTATION_STRENGTH: UFix64
    access(all) let REPRODUCTION_COOLDOWN_HOURS: UFix64
    
    // === COMPATIBILITY MATRIX ===
    access(all) let COMPATIBILITY_MATRIX: {UInt64: {UInt64: UFix64}}
    
    // === EVENTS ===
    access(all) event ReproductionOpportunityAvailable(
        creature1ID: UInt64, 
        creature2ID: UInt64, 
        compatibilityScore: UFix64,
        windowExpires: UFix64
    )
    access(all) event ReproductionCandidatesCleared(creatureID: UInt64, reason: String)
    access(all) event GeneticAnalysisCompleted(
        creature1ID: UInt64, 
        creature2ID: UInt64, 
        geneticDistance: UFix64,
        hybridVigor: UFix64,
        predictedOffspringQuality: UFix64
    )
    
    // === REPRODUCTION STATUS RESOURCE ===
    access(all) resource ReproductionStatus: TraitModule.Trait {
        // === GENETIC MARKERS (10 unique genetic markers) ===
        access(all) var geneticMarkers: [UFix64]           // 10 marcadores genéticos únicos (0.0-1.0)
        access(all) var dominanceProfile: [Bool]           // Cuáles genes son dominantes (true) o recesivos (false)
        access(all) var fertilityGenes: UFix64             // Genes específicos de fertilidad (0.1-0.9)
        access(all) var compatibilityType: UInt64          // Tipo de compatibilidad (1-4, como grupos sanguíneos)
        access(all) var reproductiveMaturity: UFix64       // Madurez reproductiva (0.0-1.0)
        
        // === REPRODUCTIVE STATE ===
        access(all) var reproductionCandidates: [UInt64]   // IDs de posibles parejas
        access(all) var reproductionReadyTimestamp: UFix64? // Cuándo está listo para reproducirse
        access(all) var lastReproductionCheck: UFix64      // Última evaluación
        access(all) var reproductionCooldown: UFix64       // Cooldown hasta próxima oportunidad
        access(all) var lastReproductionTimestamp: UFix64  // Última reproducción exitosa
        access(all) var reproductionCount: UInt64          // Número de reproducciones exitosas
        
        init(
            geneticMarkers: [UFix64],
            dominanceProfile: [Bool],
            fertilityGenes: UFix64,
            compatibilityType: UInt64,
            reproductiveMaturity: UFix64
        ) {
            self.geneticMarkers = geneticMarkers
            self.dominanceProfile = dominanceProfile
            self.fertilityGenes = fertilityGenes
            self.compatibilityType = compatibilityType
            self.reproductiveMaturity = reproductiveMaturity
            
            // Initialize reproductive state
            self.reproductionCandidates = []
            self.reproductionReadyTimestamp = nil
            self.lastReproductionCheck = 0.0
            self.reproductionCooldown = 0.0
            self.lastReproductionTimestamp = 0.0
            self.reproductionCount = 0
        }
        
        access(all) view fun getValue(): String {
            var markersStr = ""
            var i = 0
            while i < self.geneticMarkers.length {
                if i > 0 { markersStr = markersStr.concat(",") }
                markersStr = markersStr.concat(self.geneticMarkers[i].toString())
                i = i + 1
            }
            
            var dominanceStr = ""
            i = 0
            while i < self.dominanceProfile.length {
                if i > 0 { dominanceStr = dominanceStr.concat(",") }
                dominanceStr = dominanceStr.concat(self.dominanceProfile[i] ? "D" : "R")
                i = i + 1
            }
            
            return "MARKERS:".concat(markersStr)
                .concat("|DOM:").concat(dominanceStr)
                .concat("|FERT:").concat(self.fertilityGenes.toString())
                .concat("|TYPE:").concat(self.compatibilityType.toString())
                .concat("|MAT:").concat(self.reproductiveMaturity.toString())
                .concat("|COUNT:").concat(self.reproductionCount.toString())
        }
        
        access(all) fun setValue(newValue: String) {
            // Simple parsing - could be improved for full functionality
            if newValue.contains("FERT:") {
                self.fertilityGenes = 0.5 // Default fallback
            }
            if newValue.contains("TYPE:") {
                self.compatibilityType = 1 // Default fallback
            }
        }
        
        access(all) view fun getDisplayName(): String {
            let fertDisplay = ReproductionModule.formatFertility(self.fertilityGenes)
            let typeDisplay = ReproductionModule.formatCompatibilityType(self.compatibilityType)
            let maturityDisplay = ReproductionModule.formatMaturity(self.reproductiveMaturity)
            let candidatesCount = UInt64(self.reproductionCandidates.length)
            
            return "Genetics: ".concat(fertDisplay)
                .concat(" ").concat(typeDisplay)
                .concat(" ").concat(maturityDisplay)
                .concat(" 👥").concat(candidatesCount.toString())
        }
        
        access(all) fun evolve(seeds: [UInt64]): String {
            if seeds.length < 3 { return self.getDisplayName() }
            
            let currentTimestamp = getCurrentBlock().timestamp
            
            // Evolution affects reproductive maturity and genetic expression
            let potencialEvolutivo: UFix64 = 1.0 // Would get from other module if available
            let dailyVolatilityFactor = 0.5 + (UFix64(seeds[0] % 1000) / 999.0)
            
            // Mature over time (slow process)
            if self.reproductiveMaturity < 1.0 {
                let maturityGrowth = 0.001 * potencialEvolutivo * dailyVolatilityFactor
                self.reproductiveMaturity = self.min(1.0, self.reproductiveMaturity + maturityGrowth)
            }
            
            // Very slow genetic drift (epigenetic changes)
            if seeds.length >= 4 && (seeds[3] % 1000) == 0 { // 0.1% chance
                let markerIndex = Int(seeds[1] % UInt64(self.geneticMarkers.length))
                let drift = 0.001 * (UFix64(seeds[2] % 100) / 100.0 - 0.5) // ±0.0005
                self.geneticMarkers[markerIndex] = self.clamp(
                    self.geneticMarkers[markerIndex] + drift, 
                    0.0, 
                    1.0
                )
            }
            
            // Update last check timestamp
            self.lastReproductionCheck = currentTimestamp
            
            return self.getDisplayName()
        }
        
        // === GENETIC ANALYSIS ===
        
        access(all) fun calculateGeneticDistance(partner: &ReproductionStatus): UFix64 {
            // Euclidean distance between genetic markers
            var totalDistance: UFix64 = 0.0
            var i = 0
            while i < self.geneticMarkers.length && i < partner.geneticMarkers.length {
                let diff = self.abs(self.geneticMarkers[i] - partner.geneticMarkers[i])
                totalDistance = totalDistance + (diff * diff)
                i = i + 1
            }
            return self.sqrt(totalDistance)
        }
        
        access(all) fun calculateHybridVigor(partner: &ReproductionStatus): UFix64 {
            // Hybrid vigor: genetic diversity leads to stronger offspring
            let geneticDistance = self.calculateGeneticDistance(partner: partner)
            
            // Optimal distance for maximum hybrid vigor
            let optimalDistance = ReproductionModule.OPTIMAL_GENETIC_DISTANCE
            let distanceFromOptimal = self.abs(geneticDistance - optimalDistance)
            
            // Vigor peaks at optimal distance, declines with extreme distances
            let vigorBonus = 0.5 * (1.0 - self.min(1.0, distanceFromOptimal / optimalDistance))
            return 1.0 + vigorBonus // 1.0 to 1.5 multiplier
        }
        
        access(all) fun calculateReproductiveCompatibility(partner: &ReproductionStatus): UFix64 {
            // 1. Type compatibility (like blood types)
            let typeCompat = ReproductionModule.getTypeCompatibility(
                selfType: self.compatibilityType, 
                partnerType: partner.compatibilityType
            )
            
            // 2. Fertility compatibility
            let avgFertility = (self.fertilityGenes + partner.fertilityGenes) / 2.0
            let fertilityCompat = avgFertility
            
            // 3. Genetic distance (not too close, not too far)
            let geneticDistance = self.calculateGeneticDistance(partner: partner)
            let geneticCompat = 1.0 - self.min(1.0, self.abs(geneticDistance - ReproductionModule.OPTIMAL_GENETIC_DISTANCE) / 2.0)
            
            // 4. Maturity compatibility
            let maturityCompat = self.min(self.reproductiveMaturity, partner.reproductiveMaturity)
            
            // Weighted average
            return (typeCompat * 0.3) + 
                   (fertilityCompat * 0.25) + 
                   (geneticCompat * 0.25) +
                   (maturityCompat * 0.2)
        }
        
        access(all) fun predictOffspringQuality(partner: &ReproductionStatus): UFix64 {
            let compatibility = self.calculateReproductiveCompatibility(partner: partner)
            let hybridVigor = self.calculateHybridVigor(partner: partner)
            
            // Quality prediction based on genetic factors
            return compatibility * hybridVigor
        }
        
        // === REPRODUCTION MANAGEMENT ===
        
        access(all) fun addCandidate(partnerID: UInt64, compatibilityScore: UFix64) {
            // Only add if high enough compatibility and not already present
            if compatibilityScore >= 0.4 {
                var found = false
                for candidate in self.reproductionCandidates {
                    if candidate == partnerID {
                        found = true
                        break
                    }
                }
                if !found {
                    self.reproductionCandidates.append(partnerID)
                }
            }
        }
        
        access(all) fun clearCandidates(reason: String) {
            self.reproductionCandidates = []
            self.reproductionReadyTimestamp = nil
            
            // Apply cooldown
            let currentTimestamp = getCurrentBlock().timestamp
            self.reproductionCooldown = currentTimestamp + ReproductionModule.REPRODUCTION_COOLDOWN_HOURS * 3600.0
            
            emit ReproductionCandidatesCleared(creatureID: 0, reason: reason) // Would need creature ID
        }
        
        access(all) view fun isReproductionReady(): Bool {
            let currentTimestamp = getCurrentBlock().timestamp
            
            // Check cooldown
            if currentTimestamp < self.reproductionCooldown {
                return false
            }
            
            // Check maturity
            if self.reproductiveMaturity < 0.7 {
                return false
            }
            
            // Check if has candidates
            return self.reproductionCandidates.length > 0
        }
        
        access(all) view fun canReproduceWith(partnerID: UInt64): Bool {
            if !self.isReproductionReady() {
                return false
            }
            
            for candidate in self.reproductionCandidates {
                if candidate == partnerID {
                    return true
                }
            }
            return false
        }
        
        access(all) fun recordSuccessfulReproduction() {
            self.reproductionCount = self.reproductionCount + 1
            self.lastReproductionTimestamp = getCurrentBlock().timestamp
            self.clearCandidates(reason: "successful_reproduction")
        }
        
        // === UTILITY FUNCTIONS ===
        
        access(self) fun abs(_ value: UFix64): UFix64 {
            return value // UFix64 is always positive
        }
        
        access(self) fun sqrt(_ value: UFix64): UFix64 {
            // Simple square root approximation (Newton's method)
            if value == 0.0 { return 0.0 }
            var x = value / 2.0
            var prev: UFix64 = 0.0
            var iterations = 0
            while iterations < 10 && self.abs(x - prev) > 0.001 {
                prev = x
                x = (x + value / x) / 2.0
                iterations = iterations + 1
            }
            return x
        }
        
        access(self) fun min(_ a: UFix64, _ b: UFix64): UFix64 {
            return a < b ? a : b
        }
        
        access(self) fun clamp(_ value: UFix64, _ minVal: UFix64, _ maxVal: UFix64): UFix64 {
            return self.min(maxVal, self.max(minVal, value))
        }
        
        access(self) fun max(_ a: UFix64, _ b: UFix64): UFix64 {
            return a > b ? a : b
        }
    }
    
    // === STATIC HELPER FUNCTIONS ===
    
    access(all) view fun getTypeCompatibility(selfType: UInt64, partnerType: UInt64): UFix64 {
        if let compatibilityRow = self.COMPATIBILITY_MATRIX[selfType] {
            return compatibilityRow[partnerType] ?? 0.0
        }
        return 0.0
    }
    
    access(all) view fun formatFertility(_ value: UFix64): String {
        if value < 0.3 { return "🚫Sterile" }
        if value < 0.5 { return "🌱Low" }
        if value < 0.7 { return "🌿Med" }
        return "🌺High"
    }
    
    access(all) view fun formatCompatibilityType(_ value: UInt64): String {
        switch value {
            case 1: return "🅰️TypeA"
            case 2: return "🅱️TypeB" 
            case 3: return "🆎TypeAB"
            case 4: return "🅾️TypeO"
            default: return "❓Unknown"
        }
    }
    
    access(all) view fun formatMaturity(_ value: UFix64): String {
        if value < 0.3 { return "🐣Juvenile" }
        if value < 0.7 { return "🐥Adolescent" }
        if value < 0.9 { return "🐓Adult" }
        return "🦅Mature"
    }
    
    // === FACTORY FUNCTIONS ===
    
    access(all) fun createDefaultTrait(): @{TraitModule.Trait} {
        // Generate default genetic profile
        let defaultMarkers: [UFix64] = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
        let defaultDominance: [Bool] = [true, false, true, false, true, false, true, false, true, false]
        
        return <- create ReproductionStatus(
            geneticMarkers: defaultMarkers,
            dominanceProfile: defaultDominance,
            fertilityGenes: 0.5,
            compatibilityType: 1,
            reproductiveMaturity: 0.1
        )
    }
    
    access(all) fun createTraitWithSeed(seed: UInt64): @{TraitModule.Trait} {
        // Generate genetic markers using seed
        var markers: [UFix64] = []
        var dominance: [Bool] = []
        var seedState = seed
        
        var i = 0
        while i < ReproductionModule.GENETIC_MARKERS_COUNT {
            // Generate marker value (0.0-1.0)
            seedState = (seedState * 1664525 + 1013904223) % 4294967296
            let markerValue = UFix64(seedState % 1000) / 999.0
            markers.append(markerValue)
            
            // Generate dominance (50/50 chance)
            seedState = (seedState * 1664525 + 1013904223) % 4294967296
            dominance.append(seedState % 2 == 0)
            
            i = i + 1
        }
        
        // Generate other genetic traits
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let fertilityGenes = 0.1 + (UFix64(seedState % 800) / 999.0) // 0.1-0.9
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let compatibilityType = (seedState % 4) + 1 // 1-4
        
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let reproductiveMaturity = UFix64(seedState % 300) / 999.0 // 0.0-0.3 (starts immature)
        
        return <- create ReproductionStatus(
            geneticMarkers: markers,
            dominanceProfile: dominance,
            fertilityGenes: fertilityGenes,
            compatibilityType: compatibilityType,
            reproductiveMaturity: reproductiveMaturity
        )
    }
    
    access(all) fun createTraitWithValue(value: String): @{TraitModule.Trait} {
        let trait <- self.createDefaultTrait() as! @ReproductionStatus
        trait.setValue(newValue: value)
        return <- trait
    }
    
    access(all) fun createChildTrait(parent1: &{TraitModule.Trait}, parent2: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        let p1 = parent1 as! &ReproductionStatus
        let p2 = parent2 as! &ReproductionStatus
        
        // === ADVANCED GENETIC INHERITANCE ===
        
        // 1. Inherit genetic markers with Mendelian genetics
        var childMarkers: [UFix64] = []
        var childDominance: [Bool] = []
        var seedState = seed
        var i = 0
        
        while i < ReproductionModule.GENETIC_MARKERS_COUNT && i < p1.geneticMarkers.length && i < p2.geneticMarkers.length {
            // Determine which parent's gene is expressed
            seedState = (seedState * 1664525 + 1013904223) % 4294967296
            let inheritFromP1 = seedState % 2 == 0
            
            if inheritFromP1 {
                childMarkers.append(p1.geneticMarkers[i])
                childDominance.append(p1.dominanceProfile[i])
            } else {
                childMarkers.append(p2.geneticMarkers[i])
                childDominance.append(p2.dominanceProfile[i])
            }
            
            // Check for mutation (rare)
            seedState = (seedState * 1664525 + 1013904223) % 4294967296
            if seedState % ReproductionModule.MUTATION_CHANCE == 0 {
                let mutationDir = seedState % 2 == 0 ? 1.0 : -1.0
                let mutation = ReproductionModule.MUTATION_STRENGTH * mutationDir * (UFix64(seedState % 100) / 100.0)
                childMarkers[i] = self.clamp(childMarkers[i] + mutation, 0.0, 1.0)
                
                // Possible dominance flip
                if seedState % 10 == 0 {
                    childDominance[i] = !childDominance[i]
                }
            }
            
            i = i + 1
        }
        
        // 2. Fertility genes with hybrid vigor
        let hybridVigor = p1.calculateHybridVigor(partner: p2)
        let avgFertility = (p1.fertilityGenes + p2.fertilityGenes) / 2.0
        let childFertility = self.clamp(avgFertility * hybridVigor, 0.1, 0.9)
        
        // 3. Compatibility type inheritance (simplified Mendelian)
        seedState = (seedState * 1664525 + 1013904223) % 4294967296
        let childCompatibilityType = self.inheritCompatibilityType(p1.compatibilityType, p2.compatibilityType, seedState)
        
        // 4. Start with low maturity (must develop)
        let childMaturity = 0.05 + (UFix64(seedState % 50) / 1000.0) // 0.05-0.1
        
        return <- create ReproductionStatus(
            geneticMarkers: childMarkers,
            dominanceProfile: childDominance,
            fertilityGenes: childFertility,
            compatibilityType: childCompatibilityType,
            reproductiveMaturity: childMaturity
        )
    }
    
    access(all) fun createMitosisChild(parent: &{TraitModule.Trait}, seed: UInt64): @{TraitModule.Trait} {
        let p = parent as! &ReproductionStatus
        
        // Mitosis: mostly identical but with some mutations
        var childMarkers: [UFix64] = []
        var childDominance: [Bool] = []
        var seedState = seed
        var i = 0
        
        while i < p.geneticMarkers.length {
            childMarkers.append(p.geneticMarkers[i])
            childDominance.append(p.dominanceProfile[i])
            
            // Small chance of mutation in mitosis
            seedState = (seedState * 1664525 + 1013904223) % 4294967296
            if seedState % (ReproductionModule.MUTATION_CHANCE * 2) == 0 { // Half chance vs sexual reproduction
                let mutation = ReproductionModule.MUTATION_STRENGTH * 0.5 * (UFix64(seedState % 100) / 100.0 - 0.5)
                childMarkers[i] = self.clamp(childMarkers[i] + mutation, 0.0, 1.0)
            }
            
            i = i + 1
        }
        
        // Slight variation in other traits
        let mutationFactor = 0.95 + (UFix64(seed % 100) / 1000.0) // 0.95-1.05
        let childFertility = self.clamp(p.fertilityGenes * mutationFactor, 0.1, 0.9)
        
        return <- create ReproductionStatus(
            geneticMarkers: childMarkers,
            dominanceProfile: childDominance,
            fertilityGenes: childFertility,
            compatibilityType: p.compatibilityType, // Same type in mitosis
            reproductiveMaturity: 0.05 // Start immature
        )
    }
    
    // === GENETIC INHERITANCE HELPERS ===
    
    access(all) fun inheritCompatibilityType(_ parent1Type: UInt64, _ parent2Type: UInt64, _ seed: UInt64): UInt64 {
        // Simplified genetic inheritance for compatibility types
        // In reality this would follow more complex genetics
        let combinedTypes = [parent1Type, parent2Type]
        let selectedIndex = seed % 2
        return combinedTypes[selectedIndex]
    }
    
    access(all) fun clamp(_ value: UFix64, _ minVal: UFix64, _ maxVal: UFix64): UFix64 {
        if value < minVal { return minVal }
        if value > maxVal { return maxVal }
        return value
    }
    
    // === MODULE IDENTITY ===
    
    access(all) view fun getModuleType(): String {
        return "reproduction"
    }
    
    access(all) view fun getVersion(): String {
        return "1.0.0"
    }
    
    access(all) view fun getModuleName(): String {
        return "Reproduction Module"
    }
    
    access(all) view fun getModuleDescription(): String {
        return "Advanced genetics and sexual reproduction system with genetic markers, compatibility, and hybrid vigor"
    }
    
    init() {
        // Initialize genetic constants
        self.GENETIC_MARKERS_COUNT = 10
        self.OPTIMAL_GENETIC_DISTANCE = 2.0
        self.MUTATION_CHANCE = 100 // 1 in 100 chance
        self.MUTATION_STRENGTH = 0.05 // 5% mutation strength
        self.REPRODUCTION_COOLDOWN_HOURS = 12.0 // 12 hour cooldown
        
        // Initialize compatibility matrix (like blood type compatibility)
        let matrix: {UInt64: {UInt64: UFix64}} = {}
        
        // Type 1 (A-like): compatible with 1 and 3
        matrix[1] = {1: 0.9, 2: 0.3, 3: 0.7, 4: 0.1}
        
        // Type 2 (B-like): compatible with 2 and 3  
        matrix[2] = {1: 0.3, 2: 0.9, 3: 0.7, 4: 0.1}
        
        // Type 3 (AB-like): compatible with all
        matrix[3] = {1: 0.7, 2: 0.7, 3: 1.0, 4: 0.5}
        
        // Type 4 (O-like): universal donor but selective receiver
        matrix[4] = {1: 0.8, 2: 0.8, 3: 0.8, 4: 0.6}
        
        self.COMPATIBILITY_MATRIX = matrix
    }
} 