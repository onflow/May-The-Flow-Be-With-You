import "IGeneModule"

access(all) contract VisualGeneModule: IGeneModule.IModuleFactory {

    // === CONSTANTES DE EVOLUCIÓN VISUAL ===
    access(all) let TASA_APRENDIZAJE_HOMEOSTASIS_BASE: UFix64
    access(all) let TASA_EVOLUCION_PASIVA_GEN_BASE: UFix64
    access(all) let GENES_VISIBLES_RANGES: {String: {String: UFix64}}

    // === EVENTOS ===
    access(all) event VisualModuleCreated(genes: {String: UFix64})
    access(all) event VisualGenesEvolved(oldGenes: {String: UFix64}, newGenes: {String: UFix64})
    access(all) event VisualGenesReproduced(parentGenes: {String: UFix64}, childGenes: {String: UFix64}, reproductionType: String)

    // === VISUAL GENE MODULE RESOURCE ===
    access(all) resource VisualGenes: IGeneModule {
        access(self) var genes: {String: UFix64}
        access(self) let moduleVersion: String

        init(initialGenes: {String: UFix64}) {
            self.moduleVersion = "1.0.0"
            self.genes = {}
            
            // Inicializar con genes por defecto si no se proveen
            let defaultGenes: {String: UFix64} = {
                "colorR": 0.5,
                "colorG": 0.5,
                "colorB": 0.5,
                "tamanoBase": 1.0,
                "formaPrincipal": 1.0,
                "numApendices": 2.0,
                "patronMovimiento": 1.0
            }
            
            // Usar genes iniciales si se proveen, sino usar defaults
            for geneName in defaultGenes.keys {
                if initialGenes.containsKey(geneName) {
                    self.genes[geneName] = initialGenes[geneName]!
                } else {
                    self.genes[geneName] = defaultGenes[geneName]!
                }
            }

            emit VisualModuleCreated(genes: self.genes)
        }

        // === IMPLEMENTACIÓN DE IGeneModule ===
        access(all) fun getModuleType(): String {
            return "visual"
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
            return VisualGeneModule.GENES_VISIBLES_RANGES
        }

        access(all) fun getAllGeneNames(): [String] {
            return self.genes.keys
        }

        // === EVOLUCIÓN - EXACTAMENTE TU LÓGICA ACTUAL ===
        access(all) fun evolveStep(
            seeds: [UInt64],
            stepsPerDay: UInt64,
            potencialEvolutivo: UFix64,
            homeostasisTargets: {String: UFix64}
        ): {String: UFix64} {
            // Guardar genes anteriores para el evento
            let oldGenes = self.genes

            // Verificar que tenemos suficientes semillas
            if seeds.length < 4 {
                panic("VisualGeneModule.evolveStep requires at least 4 seeds")
            }

            let r0VolSeed = seeds[0]
            let r1PasSeed = seeds[1] 
            let r2BoostHomeoSeed = seeds[2]
            let r3HomeoEfecSeed = seeds[3]

            // Simular daily_volatility_factor (0.5 a 1.5) y daily_homeostasis_boost (0.8 a 1.2)
            let dailyVolatilityFactor = 0.5 + (UFix64(r0VolSeed % 1000) / 999.0)
            let dailyHomeostasisBoost = 0.8 + (UFix64(r2BoostHomeoSeed % 1000) / 999.0) * 0.4

            for geneName in self.genes.keys {
                var currentValue = self.genes[geneName]!
                
                if homeostasisTargets[geneName] != nil {
                    // === HOMEOSTASIS ===
                    let targetValue = homeostasisTargets[geneName]!
                    let diferencia = targetValue - currentValue
                    
                    // Efectividad de homeostasis por step (0.8 a 1.2)
                    let efectividadTimestepHomeo = 0.8 + (UFix64(r3HomeoEfecSeed % 1000) / 999.0) * 0.4
                    
                    var cambioHomeostasis = diferencia * VisualGeneModule.TASA_APRENDIZAJE_HOMEOSTASIS_BASE * potencialEvolutivo 
                                        * efectividadTimestepHomeo * dailyHomeostasisBoost
                    
                    // Asegurar que el cambio no invierta el signo si es muy grande
                    if self.abs(cambioHomeostasis) > self.abs(diferencia) {
                        cambioHomeostasis = diferencia
                    }
                    
                    currentValue = currentValue + cambioHomeostasis
                } else {
                    // === EVOLUCIÓN PASIVA ===
                    let randomNormalized_Vis = UFix64(r1PasSeed % 10000) / 9999.0 // Rango [0.0, 1.0]
                    let magnitude_Vis = VisualGeneModule.TASA_EVOLUCION_PASIVA_GEN_BASE * potencialEvolutivo * dailyVolatilityFactor
                    var changeAmount_Vis: UFix64 = 0.0

                    if randomNormalized_Vis < 0.5 {
                        // Restar
                        changeAmount_Vis = (0.5 - randomNormalized_Vis) * 2.0 * magnitude_Vis
                        if currentValue > changeAmount_Vis {
                            currentValue = currentValue - changeAmount_Vis
                        } else {
                            // Usar el valor mínimo del rango
                            var minGeneValue_Vis: UFix64 = 0.0
                            if let geneRange = VisualGeneModule.GENES_VISIBLES_RANGES[geneName] {
                                minGeneValue_Vis = geneRange["min"] ?? 0.0
                            }
                            currentValue = minGeneValue_Vis
                        }
                    } else {
                        // Sumar
                        changeAmount_Vis = (randomNormalized_Vis - 0.5) * 2.0 * magnitude_Vis
                        currentValue = currentValue + changeAmount_Vis
                    }
                }
                
                // Aplicar clamp usando los rangos definidos en el contrato
                self.genes[geneName] = self.clampGeneValue(geneName: geneName, value: currentValue)
            }

            emit VisualGenesEvolved(oldGenes: oldGenes, newGenes: self.genes)
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
            
            // Herencia mendeliana simplificada con mutación
            for geneName in self.genes.keys {
                if otherParentGenes.containsKey(geneName) {
                    // 50% de probabilidad de heredar de cada padre
                    let geneSeed = childSeed ^ UInt64(geneName.length)
                    let parentChoice = geneSeed % 2 // 0 o 1
                    let baseValue = parentChoice == 0 ? self.genes[geneName]! : otherParentGenes[geneName]!
                    
                    // Pequeña mutación (±10%)
                    let safeSeed = geneSeed % 200
                    let mutationFactor = 0.9 + (UFix64(safeSeed) / 1000.0) // 0.9-1.1
                    let mutatedValue = baseValue * mutationFactor
                    
                    childGenes[geneName] = self.clampGeneValue(geneName: geneName, value: mutatedValue)
                }
            }

            emit VisualGenesReproduced(parentGenes: self.genes, childGenes: childGenes, reproductionType: "sexual")
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
                let geneSeed = childSeed ^ UInt64(geneName.length)
                let safeSeed = geneSeed % 1000
                let mutationFactor = 0.95 + (UFix64(safeSeed) / 10000.0) // 0.95-1.05
                let mutatedValue = currentValue * mutationFactor
                
                childGenes[geneName] = self.clampGeneValue(geneName: geneName, value: mutatedValue)
            }

            emit VisualGenesReproduced(parentGenes: self.genes, childGenes: childGenes, reproductionType: "mitosis")
            return childGenes
        }

        // === VALIDACIÓN ===
        access(all) fun validateGeneValue(geneName: String, value: UFix64): Bool {
            if let ranges = VisualGeneModule.GENES_VISIBLES_RANGES[geneName] {
                let minVal = ranges["min"]!
                let maxVal = ranges["max"]!
                return value >= minVal && value <= maxVal
            }
            // Default: permitir valores entre 0.0 y 10.0
            return value >= 0.0 && value <= 10.0
        }

        access(all) fun clampGeneValue(geneName: String, value: UFix64): UFix64 {
            if let ranges = VisualGeneModule.GENES_VISIBLES_RANGES[geneName] {
                let minVal = ranges["min"]!
                let maxVal = ranges["max"]!
                return self.max(minVal, self.min(maxVal, value))
            }
            // Default clamp (0.0 a 10.0)
            return self.max(0.0, self.min(10.0, value))
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
            return otherModule.getModuleType() == "visual"
        }

        // === FUNCIONES AUXILIARES ===
        access(self) fun abs(_ value: UFix64): UFix64 {
            return value // UFix64 siempre es positivo
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
    access(all) fun createVisualModule(initialGenes: {String: UFix64}): @VisualGenes {
        return <- create VisualGenes(initialGenes: initialGenes)
    }

    access(all) fun createDefaultVisualModule(): @VisualGenes {
        return <- create VisualGenes(initialGenes: {})
    }

    // === FUNCIÓN PARA CREAR MÓDULO DESDE REPRODUCCIÓN SEXUAL ===
    access(all) fun createVisualModuleFromSexualReproduction(
        parent1Module: &{IGeneModule},
        parent2Module: &{IGeneModule}, 
        childSeed: UInt64,
        reproductionContext: {String: AnyStruct}
    ): @VisualGenes {
        // Combinar genes de ambos padres
        let childGenes = parent1Module.combineGenesForSexualReproduction(
            otherParentModule: parent2Module,
            childSeed: childSeed,
            reproductionContext: reproductionContext
        )
        
        return <- create VisualGenes(initialGenes: childGenes)
    }

    // === FUNCIÓN PARA CREAR MÓDULO DESDE MITOSIS ===
    access(all) fun createVisualModuleFromMitosis(
        parentModule: &{IGeneModule},
        childSeed: UInt64,
        epCost: UFix64,
        mitosisContext: {String: AnyStruct}
    ): @VisualGenes {
        // Mutar genes del padre
        let childGenes = parentModule.mutateGenesForMitosis(
            childSeed: childSeed,
            epCost: epCost,
            mitosisContext: mitosisContext
        )
        
        return <- create VisualGenes(initialGenes: childGenes)
    }

    // === IMPLEMENTACIÓN DE IModuleFactory ===
    access(all) fun createDefaultModule(): @{IGeneModule} {
        return <- create VisualGenes(initialGenes: {})
    }

    access(all) fun createModuleWithGenes(initialGenes: {String: UFix64}): @{IGeneModule} {
        return <- create VisualGenes(initialGenes: initialGenes)
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
        return <- create VisualGenes(initialGenes: childGenes)
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
        return <- create VisualGenes(initialGenes: childGenes)
    }

    access(all) view fun getModuleType(): String {
        return "visual"
    }

    access(all) view fun getModuleVersion(): String {
        return "1.0.0"
    }

    init() {
        // Inicializar constantes (mismos valores que V6)
        self.TASA_APRENDIZAJE_HOMEOSTASIS_BASE = 0.05
        self.TASA_EVOLUCION_PASIVA_GEN_BASE = 0.001

        // Inicializar rangos de genes visibles (exactos de V6)
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