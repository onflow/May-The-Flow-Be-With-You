import "IGeneModule"

access(all) contract CombatGeneModule: IGeneModule.IModuleFactory {

    // === CONSTANTES DE EVOLUCIÓN COMBATE ===
    access(all) let TASA_EVOLUCION_PASIVA_GEN_BASE: UFix64
    access(all) let FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE: UFix64
    access(all) let GENES_OCULTOS_RANGES: {String: {String: UFix64}}
    access(all) let GENES_VISIBLES_RANGES: {String: {String: UFix64}} // Para calcular influencias

    // === EVENTOS ===
    access(all) event CombatModuleCreated(genes: {String: UFix64})
    access(all) event CombatGenesEvolved(oldGenes: {String: UFix64}, newGenes: {String: UFix64})
    access(all) event CombatGenesReproduced(parentGenes: {String: UFix64}, childGenes: {String: UFix64}, reproductionType: String)

    // === COMBAT GENE MODULE RESOURCE ===
    access(all) resource CombatGenes: IGeneModule {
        access(self) var genes: {String: UFix64}
        access(self) let moduleVersion: String

        init(initialGenes: {String: UFix64}) {
            self.moduleVersion = "1.0.0"
            self.genes = {}
            
            // Inicializar con genes por defecto si no se proveen
            let defaultGenes: {String: UFix64} = {
                "puntosSaludMax": 100.0,
                "ataqueBase": 10.0,
                "defensaBase": 10.0,
                "agilidadCombate": 1.0,
                "tasaMetabolica": 1.0,
                "fertilidad": 0.5,
                "potencialEvolutivo": 1.0,
                "max_lifespan_dias_base": 5.0
            }
            
            // Usar genes iniciales si se proveen, sino usar defaults
            for geneName in defaultGenes.keys {
                if initialGenes.containsKey(geneName) {
                    self.genes[geneName] = initialGenes[geneName]!
                } else {
                    self.genes[geneName] = defaultGenes[geneName]!
                }
            }

            emit CombatModuleCreated(genes: self.genes)
        }

        // === IMPLEMENTACIÓN DE IGeneModule ===
        access(all) fun getModuleType(): String {
            return "combat"
        }

        access(all) fun getModuleVersion(): String {
            return self.moduleVersion
        }

        access(all) fun getGenes(): {String: UFix64} {
            return self.genes
        }

        access(all) fun setGene(name: String, value: UFix64) {
            if self.genes.containsKey(name) {
                self.genes[name] = self.clampGeneValue(geneName: name, value: value)
            }
        }

        access(all) fun getGene(name: String): UFix64? {
            return self.genes[name]
        }

        access(all) fun getGeneRanges(): {String: {String: UFix64}} {
            return CombatGeneModule.GENES_OCULTOS_RANGES
        }

        access(all) fun getAllGeneNames(): [String] {
            return self.genes.keys
        }

        // === EVOLUCIÓN - EXACTAMENTE TU LÓGICA ACTUAL DE COMBATE ===
        access(all) fun evolveStep(
            seeds: [UInt64],
            stepsPerDay: UInt64,
            potencialEvolutivo: UFix64,
            homeostasisTargets: {String: UFix64}
        ): {String: UFix64} {
            // Guardar genes anteriores para el evento
            let oldGenes = self.genes

            // Verificar que tenemos suficientes semillas
            if seeds.length < 2 {
                panic("CombatGeneModule.evolveStep requires at least 2 seeds")
            }

            let r0VolSeed = seeds[0]
            let r1PasSeedStep = seeds[1]

            let dailyVolatilityFactor = 0.5 + (UFix64(r0VolSeed % 1000) / 999.0) // ~0.5 a ~1.5

            // Por ahora, evolución sin influencias visuales (se puede agregar después)
            // TODO: Implementar sistema de acceso a otros módulos sin diccionarios anidados
            
            // Evolución básica de genes de combate
            let genesCombate = [
                "puntosSaludMax", 
                "ataqueBase", 
                "defensaBase", 
                "agilidadCombate",
                "tasaMetabolica",
                "fertilidad",
                "potencialEvolutivo",
                "max_lifespan_dias_base"
            ]
            
            for geneNombreOculto in genesCombate {
                var currentValue = self.genes[geneNombreOculto]!
                let minGeneValue = CombatGeneModule.GENES_OCULTOS_RANGES[geneNombreOculto]!["min"]!

                // Cambio base aleatorio pasivo
                let randomNormalized_Hid = UFix64(r1PasSeedStep % 10000) / 9999.0 // Rango [0.0, 1.0]
                let magnitude_Hid = CombatGeneModule.TASA_EVOLUCION_PASIVA_GEN_BASE * potencialEvolutivo * dailyVolatilityFactor
                var changeAmount_Hid: UFix64 = 0.0
                
                if randomNormalized_Hid < 0.5 {
                    // Restar
                    changeAmount_Hid = (0.5 - randomNormalized_Hid) * 2.0 * magnitude_Hid
                    if currentValue > changeAmount_Hid { 
                        currentValue = currentValue - changeAmount_Hid
                    } else { 
                        currentValue = minGeneValue 
                    }
                } else {
                    // Sumar
                    changeAmount_Hid = (randomNormalized_Hid - 0.5) * 2.0 * magnitude_Hid
                    currentValue = currentValue + changeAmount_Hid
                }
                
                self.genes[geneNombreOculto] = self.clampGeneValue(geneName: geneNombreOculto, value: currentValue)
            }

            emit CombatGenesEvolved(oldGenes: oldGenes, newGenes: self.genes)
            return self.genes
        }

        // === REPRODUCCIÓN SEXUAL ===
        access(all) fun combineGenesForSexualReproduction(
            otherParentModule: &{IGeneModule},
            childSeed: UInt64,
            reproductionContext: {String: AnyStruct}
        ): {String: UFix64} {
            let otherParentGenes = otherParentModule.getGenes()
            let childGenes: {String: UFix64} = {}
            
            // Mezclar genes ocultos (promedio con pequeña mutación)
            for geneName in self.genes.keys {
                if otherParentGenes.containsKey(geneName) {
                    // Promedio de ambos padres
                    let parent1Value = self.genes[geneName]!
                    let parent2Value = otherParentGenes[geneName]!
                    let avgValue = (parent1Value + parent2Value) / 2.0
                    
                    // Pequeña mutación (±10%)
                    let geneSeed = (childSeed >> 16) ^ UInt64(geneName.length)
                    let safeSeed = geneSeed % 200
                    let mutationFactor = 0.9 + (UFix64(safeSeed) / 1000.0) // 0.9-1.1
                    let mutatedValue = avgValue * mutationFactor
                    
                    childGenes[geneName] = self.clampGeneValue(geneName: geneName, value: mutatedValue)
                }
            }

            emit CombatGenesReproduced(parentGenes: self.genes, childGenes: childGenes, reproductionType: "sexual")
            return childGenes
        }

        // === REPRODUCCIÓN ASEXUAL (MITOSIS) ===
        access(all) fun mutateGenesForMitosis(
            childSeed: UInt64,
            epCost: UFix64,
            mitosisContext: {String: AnyStruct}
        ): {String: UFix64} {
            let childGenes: {String: UFix64} = {}
            
            // Copiar genes con pequeñas mutaciones (±5%)
            for geneName in self.genes.keys {
                let currentValue = self.genes[geneName]!
                
                // Mutación pequeña basada en la semilla del hijo
                let geneSeed = (childSeed >> 8) ^ UInt64(geneName.length)
                let safeSeed = geneSeed % 1000
                let mutationFactor = 0.95 + (UFix64(safeSeed) / 10000.0) // 0.95-1.05
                var mutatedValue = currentValue * mutationFactor
                
                // Mejoras especiales para mitosis basadas en EP cost
                if geneName == "potencialEvolutivo" {
                    // Mejorar potencial evolutivo del hijo
                    let parentPotencial = currentValue
                    let childPotencialBase = parentPotencial * 0.75 // MITOSIS_POTENCIAL_BASE_INHERITANCE_FACTOR
                    let potencialEpBonus = epCost * 0.001 // MITOSIS_POTENCIAL_EP_BONUS_FACTOR
                    mutatedValue = childPotencialBase + potencialEpBonus
                }
                
                childGenes[geneName] = self.clampGeneValue(geneName: geneName, value: mutatedValue)
            }

            emit CombatGenesReproduced(parentGenes: self.genes, childGenes: childGenes, reproductionType: "mitosis")
            return childGenes
        }

        // === VALIDACIÓN ===
        access(all) fun validateGeneValue(geneName: String, value: UFix64): Bool {
            if let ranges = CombatGeneModule.GENES_OCULTOS_RANGES[geneName] {
                let minVal = ranges["min"]!
                let maxVal = ranges["max"]!
                return value >= minVal && value <= maxVal
            }
            // Default: permitir valores positivos
            return value >= 0.0
        }

        access(all) fun clampGeneValue(geneName: String, value: UFix64): UFix64 {
            if let ranges = CombatGeneModule.GENES_OCULTOS_RANGES[geneName] {
                let minVal = ranges["min"]!
                let maxVal = ranges["max"]!
                return self.max(minVal, self.min(maxVal, value))
            }
            // Default clamp (valores positivos)
            return self.max(0.0, value)
        }

        // === SERIALIZACIÓN ===
        access(all) fun serialize(): {String: AnyStruct} {
            return {
                "moduleType": self.getModuleType(),
                "moduleVersion": self.moduleVersion,
                "genes": self.genes
            }
        }

        access(all) fun deserialize(data: {String: AnyStruct}) {
            if let genesData = data["genes"] as? {String: UFix64} {
                for geneName in genesData.keys {
                    if self.genes.containsKey(geneName) {
                        self.genes[geneName] = genesData[geneName]!
                    }
                }
            }
        }

        // === COMPATIBILIDAD ===
        access(all) fun isCompatibleWith(otherModule: &{IGeneModule}): Bool {
            return otherModule.getModuleType() == "combat"
        }

        // === FUNCIONES AUXILIARES - MISMAS QUE V6 ===
        access(self) fun UFix64toFix64(_ val: UFix64): Fix64 {
            let s = val.toString()
            let converted = Fix64.fromString(s)
            if converted == nil {
                panic("Failed to convert UFix64 '".concat(s).concat("' to Fix64"))
            }
            return converted!
        }

        access(self) fun Fix64toUFix64(_ val: Fix64): UFix64 {
            if val < 0.0 {
                panic("Cannot convert negative Fix64 to UFix64")
            }
            let s = val.toString()
            let converted = UFix64.fromString(s)
            if converted == nil {
                panic("Failed to convert Fix64 '".concat(s).concat("' to UFix64"))
            }
            return converted!
        }

        access(self) fun absFix64(_ value: Fix64): UFix64 {
            if value < 0.0 {
                return self.Fix64toUFix64(0.0 - value)
            }
            return self.Fix64toUFix64(value)
        }
        
        access(self) fun min(_ a: UFix64, _ b: UFix64): UFix64 {
            if a < b { return a }
            return b
        }
        
        access(self) fun max(_ a: UFix64, _ b: UFix64): UFix64 {
            if a > b { return a }
            return b
        }
    }

    // === FACTORY FUNCTIONS ===
    access(all) fun createCombatModule(initialGenes: {String: UFix64}): @CombatGenes {
        return <- create CombatGenes(initialGenes: initialGenes)
    }

    access(all) fun createDefaultCombatModule(): @CombatGenes {
        return <- create CombatGenes(initialGenes: {})
    }

    // === FUNCIÓN PARA CREAR MÓDULO DESDE REPRODUCCIÓN SEXUAL ===
    access(all) fun createCombatModuleFromSexualReproduction(
        parent1Module: &{IGeneModule},
        parent2Module: &{IGeneModule}, 
        childSeed: UInt64,
        reproductionContext: {String: AnyStruct}
    ): @CombatGenes {
        // Combinar genes de ambos padres
        let childGenes = parent1Module.combineGenesForSexualReproduction(
            otherParentModule: parent2Module,
            childSeed: childSeed,
            reproductionContext: reproductionContext
        )
        
        return <- create CombatGenes(initialGenes: childGenes)
    }

    // === FUNCIÓN PARA CREAR MÓDULO DESDE MITOSIS ===
    access(all) fun createCombatModuleFromMitosis(
        parentModule: &{IGeneModule},
        childSeed: UInt64,
        epCost: UFix64,
        mitosisContext: {String: AnyStruct}
    ): @CombatGenes {
        // Mutar genes del padre
        let childGenes = parentModule.mutateGenesForMitosis(
            childSeed: childSeed,
            epCost: epCost,
            mitosisContext: mitosisContext
        )
        
        return <- create CombatGenes(initialGenes: childGenes)
    }

    // === IMPLEMENTACIÓN DE IModuleFactory ===
    access(all) fun createDefaultModule(): @{IGeneModule} {
        return <- create CombatGenes(initialGenes: {})
    }

    access(all) fun createModuleWithGenes(initialGenes: {String: UFix64}): @{IGeneModule} {
        return <- create CombatGenes(initialGenes: initialGenes)
    }

    access(all) fun createModuleFromSexualReproduction(
        parent1Module: &{IGeneModule},
        parent2Module: &{IGeneModule}, 
        childSeed: UInt64,
        reproductionContext: {String: AnyStruct}
    ): @{IGeneModule} {
        let childGenes = parent1Module.combineGenesForSexualReproduction(
            otherParentModule: parent2Module,
            childSeed: childSeed,
            reproductionContext: reproductionContext
        )
        return <- create CombatGenes(initialGenes: childGenes)
    }

    access(all) fun createModuleFromMitosis(
        parentModule: &{IGeneModule},
        childSeed: UInt64,
        epCost: UFix64,
        mitosisContext: {String: AnyStruct}
    ): @{IGeneModule} {
        let childGenes = parentModule.mutateGenesForMitosis(
            childSeed: childSeed,
            epCost: epCost,
            mitosisContext: mitosisContext
        )
        return <- create CombatGenes(initialGenes: childGenes)
    }

    access(all) view fun getModuleType(): String {
        return "combat"
    }

    access(all) view fun getModuleVersion(): String {
        return "1.0.0"
    }

    init() {
        // Inicializar constantes (mismos valores que V6)
        self.TASA_EVOLUCION_PASIVA_GEN_BASE = 0.001
        self.FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE = 0.0001

        // Inicializar rangos de genes ocultos (exactos de V6)
        let ocultosRanges: {String: {String: UFix64}} = {}
        ocultosRanges["tasaMetabolica"] = {"min": 0.5, "max": 1.5}
        ocultosRanges["fertilidad"] = {"min": 0.1, "max": 0.9}
        ocultosRanges["potencialEvolutivo"] = {"min": 0.5, "max": 1.5}
        ocultosRanges["max_lifespan_dias_base"] = {"min": 3.0, "max": 7.0}
        ocultosRanges["puntosSaludMax"] = {"min": 50.0, "max": 200.0}
        ocultosRanges["ataqueBase"] = {"min": 5.0, "max": 25.0}
        ocultosRanges["defensaBase"] = {"min": 5.0, "max": 25.0}
        ocultosRanges["agilidadCombate"] = {"min": 0.5, "max": 2.0}
        self.GENES_OCULTOS_RANGES = ocultosRanges

        // Copiar rangos visuales para calcular influencias (exactos de V6)
        let visibleRanges: {String: {String: UFix64}} = {}
        visibleRanges["colorR"] = {"min": 0.0, "max": 1.0}
        visibleRanges["colorG"] = {"min": 0.0, "max": 1.0}
        visibleRanges["colorB"] = {"min": 0.0, "max": 1.0}
        visibleRanges["tamanoBase"] = {"min": 0.5, "max": 3.0}
        visibleRanges["formaPrincipal"] = {"min": 1.0, "max": 3.0}
        visibleRanges["numApendices"] = {"min": 0.0, "max": 8.0}
        visibleRanges["patronMovimiento"] = {"min": 1.0, "max": 4.0}
        self.GENES_VISIBLES_RANGES = visibleRanges
    }
} 