import "NonFungibleToken"
import "MetadataViews"
import "ViewResolver" // Added for explicit conformance if needed by NFT resource

access(all) contract CreatureNFTV6: NonFungibleToken {

    // --- Evolution Constants (Inspired by Python Simulation) ---
    // Estas constantes serán inicializadas en la función init()
    access(all) let TASA_APRENDIZAJE_HOMEOSTASIS_BASE: UFix64
    access(all) let TASA_EVOLUCION_PASIVA_GEN_BASE: UFix64
    access(all) let FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE: UFix64
    access(all) let GENES_VISIBLES_RANGES: {String: {String: UFix64}}
    access(all) let GENES_OCULTOS_RANGES: {String: {String: UFix64}}
    // --- New Mitosis Constants ---
    access(all) let MITOSIS_LIFESPAN_BASE_FACTOR: UFix64
    access(all) let MITOSIS_LIFESPAN_EP_BONUS_FACTOR: UFix64
    access(all) let MITOSIS_POTENCIAL_BASE_INHERITANCE_FACTOR: UFix64
    access(all) let MITOSIS_POTENCIAL_EP_BONUS_FACTOR: UFix64
    // --- End Mitosis Constants ---
    // --- End Evolution Constants ---

    /// Total supply of CreatureNFTs in existence
    access(all) var totalSupply: UInt64

    /// Límite máximo de criaturas vivas por cuenta
    access(all) let MAX_ACTIVE_CREATURES: UInt64

    /// The event that is emitted when the contract is created
    access(all) event ContractInitialized()

    /// The event that is emitted when an NFT is withdrawn from a Collection
    access(all) event Withdraw(id: UInt64, from: Address?)

    /// The event that is emitted when an NFT is deposited to a Collection
    access(all) event Deposit(id: UInt64, to: Address?)

    /// The event that is emitted when an NFT is minted
    access(all) event NFTMinted(
        id: UInt64, 
        name: String, 
        birthTimestamp: UFix64,
        birthBlockHeight: UInt64,
        lifespanTotalSimulatedDays: UFix64
    )
    
    /// The event that is emitted when an NFT's description is updated
    access(all) event DescriptionUpdated(id: UInt64, newDescription: String)

    /// The event that is emitted when an NFT evolves
    access(all) event EvolutionProcessed(
        creatureID: UInt64, 
        processedSteps: UInt64, 
        newAge: UFix64, 
        evolutionPoints: UFix64
    )

    /// The event that is emitted when an NFT dies
    access(all) event CreatureDied(
        creatureID: UInt64, 
        deathBlockHeight: UInt64, 
        deathTimestamp: UFix64
    )

    /// The event that is emitted when a homeostasis target is set
    access(all) event HomeostasisTargetSet(
        creatureID: UInt64, 
        gene: String, 
        target: UFix64
    )

    /// The event that is emitted when la semilla inicial es cambiada
    access(all) event InitialSeedChanged(
        creatureID: UInt64,
        oldSeed: UInt64,
        newSeed: UInt64,
        changeCount: UInt64,
        epCost: UFix64
    )
    
    /// The event that is emitted when mitosis occurs
    access(all) event MitosisOccurred(
        parentID: UInt64,
        childID: UInt64,
        epCost: UFix64
    )
    
    /// The event that is emitted when sexual reproduction occurs
    access(all) event SexualReproductionOccurred(
        parent1ID: UInt64,
        parent2ID: UInt64,
        childID: UInt64
    )

    /// Storage and Public Paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    /// The core resource that represents a Non Fungible Token.
    /// New instances will be created using the NFTMinter resource
    /// and stored in the Collection resource
    access(all) resource NFT: NonFungibleToken.NFT, ViewResolver.Resolver {
        access(all) let id: UInt64
        access(all) let birthTimestamp: UFix64
        access(all) let birthBlockHeight: UInt64
        
        access(all) let name: String
        access(all) var description: String
        access(all) let thumbnail: String // URL to an image

        // Attributes for evolution
        access(all) let genesVisibles: {String: UFix64}
        access(all) let genesOcultos: {String: UFix64} // Reverted to let, modification happens in local var before child NFT init
        access(all) var puntosEvolucion: UFix64 // Mutable by game logic contract
        access(all) let lifespanTotalSimulatedDays: UFix64
        access(all) var edadDiasCompletos: UFix64 // Mutable by game logic contract
        access(all) var estaViva: Bool             // Mutable by game logic contract
        access(all) var deathBlockHeight: UInt64?    // Mutable by game logic contract
        access(all) var deathTimestamp: UFix64?      // Mutable by game logic contract

        // Evolution tracking placeholders - managed by game logic contract
        access(all) var lastEvolutionProcessedBlockHeight: UInt64
        access(all) var lastEvolutionProcessedTimestamp: UFix64
        access(all) var committedToRandomBlockHeight: UInt64?
        access(all) var currentActiveBeaconSeed: String? // UInt256 might need custom handling/lib, using String for simplicity for now
        access(all) var lastBeaconSeedFetchedBlockHeight: UInt64?
        access(all) var simulatedDaysProcessedWithCurrentSeed: UInt64
        
        // Homeostasis targets - Explicitly allow modification of this dictionary
        access(all) var homeostasisTargets: {String: UFix64}
        
        // Semilla inicial para la criatura (se utiliza para derivar semillas diarias)
        access(all) var initialSeed: UInt64

        // --- START Funciones Matemáticas Auxiliares Adicionales ---
        access(self) fun UFix64toFix64(_ val: UFix64): Fix64 {
            // Este es un workaround común. Asegúrate de que los valores sean apropiados.
            let s = val.toString()
            let converted = Fix64.fromString(s) // Usar Fix64.fromString()
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
            let converted = UFix64.fromString(s) // Usar UFix64.fromString()
            if converted == nil {
                panic("Failed to convert Fix64 '".concat(s).concat("' to UFix64"))
            }
            return converted!
        }

        // Nueva función para valor absoluto de Fix64 devolviendo UFix64
        access(self) fun absFix64(_ value: Fix64): UFix64 {
            if value < 0.0 {
                return self.Fix64toUFix64(0.0 - value) // Llama a la función definida aquí
            }
            return self.Fix64toUFix64(value) // Llama a la función definida aquí
        }
        // --- END Funciones Matemáticas Auxiliares Adicionales ---

        init(
            id: UInt64,
            name: String,
            description: String,
            thumbnail: String,
            birthBlockHeight: UInt64, 
            initialGenesVisibles: {String: UFix64},
            initialGenesOcultos: {String: UFix64},
            initialPuntosEvolucion: UFix64,
            lifespanDays: UFix64,
            initialEdadDiasCompletos: UFix64,
            initialEstaViva: Bool,
            initialHomeostasisTargets: {String: UFix64}
        ) {
            self.id = id
            self.birthTimestamp = getCurrentBlock().timestamp
            self.birthBlockHeight = birthBlockHeight
            self.name = name
            self.description = description
            self.thumbnail = thumbnail

            self.genesVisibles = initialGenesVisibles
            self.genesOcultos = initialGenesOcultos
            self.puntosEvolucion = initialPuntosEvolucion
            self.lifespanTotalSimulatedDays = lifespanDays
            self.edadDiasCompletos = initialEdadDiasCompletos
            self.estaViva = initialEstaViva
            self.deathBlockHeight = nil
            self.deathTimestamp = nil

            self.lastEvolutionProcessedBlockHeight = birthBlockHeight // Initialize with birth block
            self.lastEvolutionProcessedTimestamp = self.birthTimestamp // Initialize with birth time
            self.committedToRandomBlockHeight = nil
            self.currentActiveBeaconSeed = nil
            self.lastBeaconSeedFetchedBlockHeight = nil
            self.simulatedDaysProcessedWithCurrentSeed = 0
            self.homeostasisTargets = initialHomeostasisTargets
            
            // Generar semilla inicial basada en ID, timestamp y altura del bloque
            // La combinación de estos valores debería dar una semilla única para cada criatura
            // MODIFICADO para prevenir overflow con el timestamp
            let timestampFactor = UInt64(self.birthTimestamp) % 1000000 // Usar módulo para seguridad
            self.initialSeed = self.id ^ timestampFactor ^ self.birthBlockHeight
            
            // Inicializar contador de cambios de semilla en el diccionario de homeostasis
            self.homeostasisTargets["_seedChangeCount"] = 0.0

            emit NFTMinted(
                id: self.id, 
                name: self.name, 
                birthTimestamp: self.birthTimestamp,
                birthBlockHeight: self.birthBlockHeight,
                lifespanTotalSimulatedDays: self.lifespanTotalSimulatedDays
            )
        }

        access(all) fun updateDescription(newDescription: String) {
            self.description = newDescription
            emit DescriptionUpdated(id: self.id, newDescription: newDescription)
        }
        
        // --- Funciones de evolución ---
        
        access(all) fun updatePuntosEvolucion(newEP: UFix64) {
            self.puntosEvolucion = newEP
        }

        access(all) fun updateEdad(newEdad: UFix64) {
            self.edadDiasCompletos = newEdad
        }

        access(all) fun updateVitalStatus(newEstaViva: Bool, newDeathBlock: UInt64?, newDeathTimestamp: UFix64?) {
            self.estaViva = newEstaViva
            self.deathBlockHeight = newDeathBlock
            self.deathTimestamp = newDeathTimestamp
            
            if !newEstaViva {
                emit CreatureDied(
                    creatureID: self.id,
                    deathBlockHeight: newDeathBlock!,
                    deathTimestamp: newDeathTimestamp!
                )
            }
        }
        
        access(all) fun setHomeostasisTarget(gene: String, value: UFix64) {
            self.homeostasisTargets[gene] = value
            emit HomeostasisTargetSet(
                creatureID: self.id,
                gene: gene,
                target: value
            )
        }

        access(all) fun setLastEvolutionProcessed(blockHeight: UInt64, timestamp: UFix64) {
            self.lastEvolutionProcessedBlockHeight = blockHeight
            self.lastEvolutionProcessedTimestamp = timestamp
        }
        
        // Método para cambiar la semilla inicial (máximo 3 veces, cuesta 10 EP)
        access(all) fun changeInitialSeed(newSeedBase: UInt64): Bool {
            // Obtener el contador de cambios actual del diccionario de homeostasis
            let seedChangeCount = self.homeostasisTargets["_seedChangeCount"] ?? 0.0
            
            // Verificar si se puede cambiar la semilla
            if seedChangeCount >= 3.0 {
                // Ya ha cambiado la semilla 3 veces, no se permite más
                return false
            }
            
            // Verificar si tiene suficientes puntos de evolución
            let epCost: UFix64 = 10.0
            if self.puntosEvolucion < epCost {
                // No tiene suficientes puntos de evolución
                return false
            }
            
            // Guardar la semilla anterior para el evento
            let oldSeed = self.initialSeed
            
            // Generar nueva semilla basada en la entrada del usuario y otros factores para evitar duplicación
            let currentBlock = getCurrentBlock()
            let newSeed = newSeedBase ^ UInt64(currentBlock.timestamp * 100000.0) ^ currentBlock.height
            
            // Actualizar semilla inicial
            self.initialSeed = newSeed
            
            // Incrementar contador de cambios
            let newChangeCount = seedChangeCount + 1.0
            self.homeostasisTargets["_seedChangeCount"] = newChangeCount
            
            // Deducir puntos de evolución
            self.puntosEvolucion = self.puntosEvolucion - epCost
            
            // Emitir evento
            emit CreatureNFTV6.InitialSeedChanged(
                creatureID: self.id,
                oldSeed: oldSeed,
                newSeed: newSeed,
                changeCount: UInt64(newChangeCount),
                epCost: epCost
            )
            
            return true
        }

        // Método para generar semillas diarias basadas en la semilla inicial y el día simulado
        access(all) fun generateDailySeeds(diaSimulado: UInt64): [UInt64] {
            let daySalt = diaSimulado * 127 // Factor primo para mejorar distribución
            let base = self.initialSeed ^ daySalt
            
            // Implementación simplificada del PRNG de la simulación Python
            let a: UInt64 = 1664525
            let c: UInt64 = 1013904223
            let m: UInt64 = 4294967296 // 2^32
            
            var seedState = base % m
            var seeds: [UInt64] = []
            
            // Generar 5 semillas diarias (como en simulation.py)
            var i: Int = 0
            while i < 5 {
                seedState = (seedState * a + c) % m
                seeds.append(seedState)
                i = i + 1
            }
            
            return seeds
        }
        
        // Método para calcular días transcurridos desde última evolución procesada
        access(all) fun calcularDiasTranscurridos(timestampActual: UFix64, segundosPorDiaSimulado: UFix64): UFix64 {
            let segundosTranscurridos = timestampActual - self.lastEvolutionProcessedTimestamp
            return segundosTranscurridos / segundosPorDiaSimulado
        }
        
        // Funciones matemáticas auxiliares
        access(self) fun abs(_ value: UFix64): UFix64 {
            if value < 0.0 {
                return 0.0 - value
            }
            return value
        }
        
        access(self) fun min(_ a: UFix64, _ b: UFix64): UFix64 {
            if a < b {
                return a
            }
            return b
        }
        
        access(self) fun max(_ a: UFix64, _ b: UFix64): UFix64 {
            if a > b {
                return a
            }
            return b
        }

        // Helper para clamp genérico si no se encuentra un rango específico
        access(self) fun clampValue(_ value: UFix64, _ geneName: String, _ geneRanges: {String: {String: UFix64}}): UFix64 {
            if let ranges = geneRanges[geneName] {
                let minVal = ranges["min"]!
                let maxVal = ranges["max"]!
                return self.max(minVal, self.min(maxVal, value))
            }
            // Default clamp si el gen no está en los rangos definidos (ej. 0.0 a 1.0)
            // Esto es una fallback, idealmente todos los genes manipulados tendrían sus rangos definidos.
            return self.max(0.0, self.min(1.0, value))
        }

        // Método para aplicar evolución por step específico (tiny evolution)
        // r0_volatilidad_seed, r1_semilla_pasiva_step_seed, r2_boost_homeo_seed, r3_semilla_homeo_efec_seed
        access(all) fun updateGenesForStep(r0VolSeed: UInt64, r1PasSeed: UInt64, r2BoostHomeoSeed: UInt64, r3HomeoEfecSeed: UInt64, stepsPerDay: UInt64) {
            // let stepFactor = 1.0 / UFix64(stepsPerDay) // No se usa directamente si las tasas son por step
            let potencialEvolutivo = self.genesOcultos["potencialEvolutivo"] ?? 1.0

            // Simular daily_volatility_factor (0.5 a 1.5) y daily_homeostasis_boost (0.8 a 1.2) de Python
            let dailyVolatilityFactor = 0.5 + (UFix64(r0VolSeed % 1000) / 999.0) 
            let dailyHomeostasisBoost = 0.8 + (UFix64(r2BoostHomeoSeed % 1000) / 999.0) * 0.4

            for geneName in self.genesVisibles.keys {
                var currentValue = self.genesVisibles[geneName]!
                
                // Placeholder para determinar si el gen es entero y sus rangos específicos
                // Actualmente GENES_VISIBLES_RANGES no distingue enteros.
                // La función clampValue usará el rango si existe, sino 0.0-1.0.
                // let isIntegerGene = false // TODO: Determinar esto si es necesario para redondeo

                if self.homeostasisTargets[geneName] != nil {
                    let targetValue = self.homeostasisTargets[geneName]!
                    let diferencia = targetValue - currentValue
                    
                    // Efectividad de homeostasis por step (0.8 a 1.2)
                    let efectividadTimestepHomeo = 0.8 + (UFix64(r3HomeoEfecSeed % 1000) / 999.0) * 0.4
                    
                    var cambioHomeostasis = diferencia * CreatureNFTV6.TASA_APRENDIZAJE_HOMEOSTASIS_BASE * potencialEvolutivo 
                                        * efectividadTimestepHomeo * dailyHomeostasisBoost
                    
                    // Asegurar que el cambio no invierta el signo si es muy grande
                    if self.abs(cambioHomeostasis) > self.abs(diferencia) {
                        cambioHomeostasis = diferencia
                    }
                    
                    currentValue = currentValue + cambioHomeostasis
                } else {
                    // Evolución Pasiva
                    let randomNormalized_Vis = UFix64(r1PasSeed % 10000) / 9999.0 // Rango [0.0, 1.0]
                    let magnitude_Vis = CreatureNFTV6.TASA_EVOLUCION_PASIVA_GEN_BASE * potencialEvolutivo * dailyVolatilityFactor
                    var changeAmount_Vis: UFix64 = 0.0

                    if randomNormalized_Vis < 0.5 {
                        // Restar
                        changeAmount_Vis = (0.5 - randomNormalized_Vis) * 2.0 * magnitude_Vis
                        if currentValue > changeAmount_Vis {
                            currentValue = currentValue - changeAmount_Vis
                        } else {
                            // Corrected access to optional dictionary
                            var minGeneValue_Vis: UFix64 = 0.0
                            if let geneRange = CreatureNFTV6.GENES_VISIBLES_RANGES[geneName] {
                                minGeneValue_Vis = geneRange["min"] ?? 0.0
                            }
                            currentValue = minGeneValue_Vis
                        }
                    } else {
                        // Sumar
                        changeAmount_Vis = (randomNormalized_Vis - 0.5) * 2.0 * magnitude_Vis
                        currentValue = currentValue + changeAmount_Vis
                    }
                    // La asignación de currentValue ya se hizo dentro del if/else
                }
                
                // Aplicar clamp usando los rangos definidos en el contrato
                self.genesVisibles[geneName] = self.clampValue(currentValue, geneName, CreatureNFTV6.GENES_VISIBLES_RANGES)
                // if isIntegerGene { self.genesVisibles[geneName] = UFix64(Int(self.genesVisibles[geneName]!)) } // Redondeo si fuera entero
            }
        }
        
        // Nueva función para la evolución de genes ocultos de combate
        // r0VolSeed: semilla diaria para volatilidad general.
        // r1PasSeedStep: semilla que varía por step para la evolución pasiva base.
        // Las influencias se tomarán de los genes visibles actuales.
        access(all) fun _updateCombatGenesForStep(r0VolSeed: UInt64, r1PasSeedStep: UInt64, stepsPerDay: UInt64) {
            let potencialEvolutivo = self.genesOcultos["potencialEvolutivo"] ?? 1.0
            let dailyVolatilityFactor = 0.5 + (UFix64(r0VolSeed % 1000) / 999.0) // ~0.5 a ~1.5

            // Pre-calcular normalizaciones de genes visibles relevantes
            var normTamanoBase: UFix64 = 0.5 
            if let rangoTB = CreatureNFTV6.GENES_VISIBLES_RANGES["tamanoBase"] {
                let minTB = rangoTB["min"]!
                let maxTB = rangoTB["max"]!
                if (maxTB - minTB) > 0.0 {
                    normTamanoBase = (self.genesVisibles["tamanoBase"]! - minTB) / (maxTB - minTB)
                }
            }
            // Calculate tendTamanoNormFactor as Fix64 to represent -1.0 to 1.0 range
            let tendTamanoNormFactor_signed: Fix64 = (self.UFix64toFix64(normTamanoBase) - 0.5) * 2.0

            var normNumApendices: UFix64 = 0.5 
            if let rangoNA = CreatureNFTV6.GENES_VISIBLES_RANGES["numApendices"] {
                let minNA = rangoNA["min"]!
                let maxNA = rangoNA["max"]!
                if (maxNA - minNA) > 0.0 {
                    normNumApendices = (self.genesVisibles["numApendices"]! - minNA) / (maxNA - minNA)
                }
            }

            let formaActual = self.genesVisibles["formaPrincipal"]! 
            let apendicesActuales = self.genesVisibles["numApendices"]! 

            let genesCombate = [
                "puntosSaludMax", 
                "ataqueBase", 
                "defensaBase", 
                "agilidadCombate"
            ]

            for geneNombreOculto in genesCombate {
                var currentValue = self.genesOcultos[geneNombreOculto]!
                let minGeneValue = CreatureNFTV6.GENES_OCULTOS_RANGES[geneNombreOculto]!["min"]!

                // 1. Cambio base aleatorio pasivo
                let randomNormalized_Hid = UFix64(r1PasSeedStep % 10000) / 9999.0 // Rango [0.0, 1.0]
                let magnitude_Hid = CreatureNFTV6.TASA_EVOLUCION_PASIVA_GEN_BASE * potencialEvolutivo * dailyVolatilityFactor
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
                // La asignación de currentValue ya se hizo dentro del if/else

                // 2. Cambio por influencias de genes visibles
                let factorEvolucionInfluenciaBase = CreatureNFTV6.FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE * potencialEvolutivo * dailyVolatilityFactor

                if geneNombreOculto == "puntosSaludMax" {
                    let influenceMagnitude = self.absFix64(tendTamanoNormFactor_signed * 1.0) * factorEvolucionInfluenciaBase
                    if tendTamanoNormFactor_signed >= 0.0 {
                        currentValue = currentValue + influenceMagnitude
                    } else {
                        if currentValue > influenceMagnitude { currentValue = currentValue - influenceMagnitude } else { currentValue = minGeneValue }
                    }
                    // tendenciaForma = (formaActual == 2.0) ? 0.5 : 0.0
                    if formaActual == 2.0 { currentValue = currentValue + (0.5 * factorEvolucionInfluenciaBase) }
                
                } else if geneNombreOculto == "ataqueBase" {
                    // tendenciaForma
                    if formaActual == 3.0 { currentValue = currentValue + (1.0 * factorEvolucionInfluenciaBase) }
                    else if formaActual == 1.0 { // Factor -0.3
                        let decremento = 0.3 * factorEvolucionInfluenciaBase
                        if currentValue > decremento { currentValue = currentValue - decremento } else { currentValue = minGeneValue }
                    }
                    // tendenciaApendices = normNumApendices * 0.7
                    currentValue = currentValue + (normNumApendices * 0.7 * factorEvolucionInfluenciaBase)
                    // tendenciaTamano = tendTamanoNormFactor * 0.3
                    let tamanoInfluenceAtaque = self.absFix64(tendTamanoNormFactor_signed * 0.3) * factorEvolucionInfluenciaBase
                    if tendTamanoNormFactor_signed >= 0.0 {
                        currentValue = currentValue + tamanoInfluenceAtaque
                    } else {
                        if currentValue > tamanoInfluenceAtaque { currentValue = currentValue - tamanoInfluenceAtaque } else { currentValue = minGeneValue }
                    }

                } else if geneNombreOculto == "defensaBase" {
                    // tendenciaForma
                    if formaActual == 2.0 { currentValue = currentValue + (1.0 * factorEvolucionInfluenciaBase) }
                    else if formaActual == 3.0 { // Factor -0.3
                        let decremento = 0.3 * factorEvolucionInfluenciaBase
                        if currentValue > decremento { currentValue = currentValue - decremento } else { currentValue = minGeneValue }
                    }
                    // tendenciaTamano = tendTamanoNormFactor * 1.0
                    let tamanoInfluenceDefensa = self.absFix64(tendTamanoNormFactor_signed * 1.0) * factorEvolucionInfluenciaBase
                    if tendTamanoNormFactor_signed >= 0.0 {
                        currentValue = currentValue + tamanoInfluenceDefensa
                    } else {
                        if currentValue > tamanoInfluenceDefensa { currentValue = currentValue - tamanoInfluenceDefensa } else { currentValue = minGeneValue }
                    }

                } else if geneNombreOculto == "agilidadCombate" {
                    // tendenciaForma
                    if formaActual == 1.0 { currentValue = currentValue + (1.0 * factorEvolucionInfluenciaBase) }
                    else if formaActual == 2.0 { // Factor -0.7
                        let decremento = 0.7 * factorEvolucionInfluenciaBase
                        if currentValue > decremento { currentValue = currentValue - decremento } else { currentValue = minGeneValue }
                    }
                    // tendenciaTamano = -tendTamanoNormFactor * 1.0 (mayor tamaño, menos ágil)
                    // Si tendTamanoNormFactor_signed es positivo (grande), se resta para agilidad (efecto negativo)
                    // Si tendTamanoNormFactor_signed es negativo (pequeno), se suma para agilidad (efecto positivo)
                    let tamanoInfluenceAgilidad = self.absFix64(tendTamanoNormFactor_signed * 1.0) * factorEvolucionInfluenciaBase
                    if tendTamanoNormFactor_signed >= 0.0 { // Creatura grande (factor positivo), impacto negativo en agilidad
                        if currentValue > tamanoInfluenceAgilidad { currentValue = currentValue - tamanoInfluenceAgilidad } else { currentValue = minGeneValue }
                    } else { // Creatura pequena (factor negativo), impacto positivo en agilidad
                        currentValue = currentValue + tamanoInfluenceAgilidad
                    }
                    
                    // numApendices: U-shape, óptimo en el medio del rango (0-8 -> óptimo 4)
                    // uShapeFactor conceptualmente -1.0 (extremos) a 1.0 (óptimo)
                    var uShapeInfluenceFactor: UFix64 = 0.0
                    var uShapeIsPositiveInfluence = true
                    if let rangoNA = CreatureNFTV6.GENES_VISIBLES_RANGES["numApendices"] {
                        let minNA = rangoNA["min"]!; let maxNA = rangoNA["max"]!
                        let optimoApendices = (minNA + maxNA) / 2.0
                        let distMaxDesdeOptimoAp = (maxNA - minNA) / 2.0
                        if distMaxDesdeOptimoAp > 0.0 {
                            // Corrected calculation for uShapeFactorRaw to prevent underflow
                            var uShapeFactorRaw_signed: Fix64 = 0.0
                            
                            // Calculate absolute difference safely for UFix64
                            var diffAbsApendices: UFix64 = 0.0
                            if apendicesActuales > optimoApendices {
                                diffAbsApendices = apendicesActuales - optimoApendices
                            } else {
                                diffAbsApendices = optimoApendices - apendicesActuales
                            }
                            let normalizedDistance = diffAbsApendices / distMaxDesdeOptimoAp
                            
                            let proximityToOptimum = 1.0 - normalizedDistance // Rango [0.0, 1.0] donde 1.0 es óptimo
                            
                            uShapeFactorRaw_signed = (self.UFix64toFix64(proximityToOptimum) - 0.5) * 2.0

                            uShapeInfluenceFactor = self.absFix64(uShapeFactorRaw_signed * 0.5) // Factor 0.5 de Python para apéndices en agilidad
                            if uShapeFactorRaw_signed < 0.0 { uShapeIsPositiveInfluence = false }
                        }    
                    }
                    if uShapeIsPositiveInfluence {
                        currentValue = currentValue + (uShapeInfluenceFactor * factorEvolucionInfluenciaBase)
                    } else {
                        let decremento = uShapeInfluenceFactor * factorEvolucionInfluenciaBase
                        if currentValue > decremento { currentValue = currentValue - decremento } else { currentValue = minGeneValue }
                    }
                }
                
                self.genesOcultos[geneNombreOculto] = self.clampValue(currentValue, geneNombreOculto, CreatureNFTV6.GENES_OCULTOS_RANGES)
            }
        }

        // Método para ganar puntos de evolución por step
        access(all) fun gainEvolutionPointsForStep(r0: UInt64, stepsPerDay: UInt64) {
            // Obtener potencialEvolutivo de los genes ocultos
            let potencialEvolutivo = self.genesOcultos["potencialEvolutivo"] ?? 1.0 

            // Calcular ageMultiplier con disminución lineal
            let MAX_LIFESPAN_DAYS: UFix64 = 7.0 // Vida máxima para este cálculo
            let MAX_AGE_MULTIPLIER: UFix64 = 2.0
            let MIN_AGE_MULTIPLIER: UFix64 = 1.0
            
            let totalDecreaseOverLifespan = MAX_AGE_MULTIPLIER - MIN_AGE_MULTIPLIER
            var decreasePerDay: UFix64 = 0.0
            // Evitar división por cero si lifespan fuera 0, aunque lifespanTotalSimulatedDays debería ser > 0
            if MAX_LIFESPAN_DAYS > 0.0 { 
                decreasePerDay = totalDecreaseOverLifespan / MAX_LIFESPAN_DAYS
            }
            
            let calculatedAgeMultiplier = MAX_AGE_MULTIPLIER - (self.edadDiasCompletos * decreasePerDay)
            // Usar self.max que está definido en este recurso NFT
            let ageMultiplier = self.max(MIN_AGE_MULTIPLIER, calculatedAgeMultiplier) 
            
            // Multiplicador base de Python y factor de ganancia
            let PYTHON_MULTIPLIER = 50.0
            let PYTHON_BASE_FACTOR = 0.01 // Corresponde a FACTOR_GANANCIA_EP_POR_TIMESTEP en Python

            // Factor aleatorio (rango 0.5 a 1.5)
            // (UFix64(r0 % 101) / 100.0) da 0.0 a 1.0. Sumando 0.5 -> 0.5 a 1.5
            let correctedRandomFactor = 0.5 + (UFix64(r0 % 101) / 100.0)

            // Cálculo de EP por step
            let baseEPPerStep = potencialEvolutivo * PYTHON_BASE_FACTOR * PYTHON_MULTIPLIER * ageMultiplier * correctedRandomFactor
            
            self.puntosEvolucion = self.puntosEvolucion + baseEPPerStep
        }

        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Serial>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>()
            ]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    // The thumbnail here could be dynamic based on creature state later
                    // if the game logic contract provides a way to get current image representation.
                    return MetadataViews.Display(
                        name: self.name.concat(" #").concat(self.id.toString()),
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(
                            url: self.thumbnail // Base thumbnail
                        )
                    )
                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(
                        self.id
                    )
                case Type<MetadataViews.NFTCollectionData>():
                    return CreatureNFTV6.resolveContractView(resourceType: Type<@CreatureNFTV6.NFT>(), viewType: Type<MetadataViews.NFTCollectionData>())
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return CreatureNFTV6.resolveContractView(resourceType: Type<@CreatureNFTV6.NFT>(), viewType: Type<MetadataViews.NFTCollectionDisplay>())
            }
            return nil
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-CreatureNFTV6.createEmptyCollection(nftType: Type<@CreatureNFTV6.NFT>())
        }

        // --- Funciones de reproducción ---
        
        // Función para realizar mitosis (reproducción asexual)
        // Gasta EP del padre para crear un descendiente con vida reducida
        access(all) fun performMitosis(epCost: UFix64): @NFT? {
            // Verificar si la criatura está viva
            if !self.estaViva {
                return nil
            }
            
            // Verificar si tiene suficientes EP
            if self.puntosEvolucion < epCost {
                return nil
            }
            
            // Deducir EP
            self.puntosEvolucion = self.puntosEvolucion - epCost
            
            // Generar semilla para el descendiente basada en la del padre
            let currentBlock = getCurrentBlock()
            let timestampFactor = UInt64(currentBlock.timestamp) % 1000000 // Limitar tamaño
            let childSeed = self.initialSeed ^ timestampFactor ^ currentBlock.height
            
            // Crear nuevos genes con pequenas mutaciones
            // Usamos 'var' para childGenesOcultos porque modificaremos potencialEvolutivo
            let childGenesVisibles: {String: UFix64} = {}
            var childGenesOcultos: {String: UFix64} = {} 
            
            // Copiar genes visibles con pequenas mutaciones
            for genName in self.genesVisibles.keys {
                let currentValue = self.genesVisibles[genName]!
                // Mutación pequena (±5%)
                // Asegurarse que childSeed % 100 no cause problemas si childSeed es muy grande.
                // Usar (childSeed % 1000) / 10000.0 para un rango 0.0 a 0.099, luego ajustar.
                // Para 0.95 a 1.05 (rango de 0.1), sería: 0.95 + (UFix64(childSeed % 1000) / 10000.0)
                let mutationFactor = 0.95 + (UFix64(childSeed % 1000) / 10000.0) 
                childGenesVisibles[genName] = currentValue * mutationFactor
            }
            
            // Copiar genes ocultos con pequenas mutaciones
            for genName in self.genesOcultos.keys {
                let currentValue = self.genesOcultos[genName]!
                // Mutación pequena (±5%)
                // Usar (childSeed >> 8) para variar la semilla
                let mutationFactor = 0.95 + (UFix64(((childSeed >> 8) % 1000)) / 10000.0)
                childGenesOcultos[genName] = currentValue * mutationFactor
            }

            // --- START: Mejoras del hijo basadas en epCost ---

            // 1. Mejorar Potencial Evolutivo del Hijo
            let parentPotencial = self.genesOcultos["potencialEvolutivo"] ?? 1.0 
            let childPotencialBase = parentPotencial * CreatureNFTV6.MITOSIS_POTENCIAL_BASE_INHERITANCE_FACTOR
            let potencialEpBonus = epCost * CreatureNFTV6.MITOSIS_POTENCIAL_EP_BONUS_FACTOR
            var finalChildPotencial = childPotencialBase + potencialEpBonus
            
            // Clamp potencial evolutivo del hijo
            if let potencialRanges = CreatureNFTV6.GENES_OCULTOS_RANGES["potencialEvolutivo"] {
                finalChildPotencial = self.max(potencialRanges["min"]!, self.min(potencialRanges["max"]!, finalChildPotencial))
            } else { // Fallback clamp si no hay rango (improbable para potencialEvolutivo)
                finalChildPotencial = self.max(0.5, self.min(2.0, finalChildPotencial)) // Ejemplo de fallback
            }
            childGenesOcultos["potencialEvolutivo"] = finalChildPotencial

            // 2. Mejorar Esperanza de Vida del Hijo
            // Asegurarse que self.lifespanTotalSimulatedDays es positivo
            let baseLifespanForChild = self.lifespanTotalSimulatedDays * CreatureNFTV6.MITOSIS_LIFESPAN_BASE_FACTOR
            let lifespanEpBonus = epCost * CreatureNFTV6.MITOSIS_LIFESPAN_EP_BONUS_FACTOR
            var childLifespan = baseLifespanForChild + lifespanEpBonus

            // Opcional: Clamp para la esperanza de vida del hijo, por ejemplo, a un máximo razonable
            // o asegurarse que no sea menor que un mínimo.
            // Por ahora, lo dejamos así, asumiendo que los factores son razonables.
            // Podríamos añadir un clamp similar al de potencialEvolutivo si es necesario, usando GENES_OCULTOS_RANGES["max_lifespan_dias_base"]

            // --- END: Mejoras del hijo basadas en epCost ---
            
            // Obtener siguiente ID desde el contrato
            CreatureNFTV6.totalSupply = CreatureNFTV6.totalSupply + 1
            let newID = CreatureNFTV6.totalSupply
            
            // Crear nueva criatura con vida reducida (mitad)
            let newCreature <- create NFT(
                id: newID,
                name: "", // Sin nombre predefinido
                description: "", // Sin descripción predefinida
                thumbnail: self.thumbnail, // Usar el mismo thumbnail
                birthBlockHeight: currentBlock.height,
                initialGenesVisibles: childGenesVisibles,
                initialGenesOcultos: childGenesOcultos,
                initialPuntosEvolucion: epCost / 4.0, // 1/4 del costo como EP inicial
                lifespanDays: childLifespan, // Esperanza de vida mejorada
                initialEdadDiasCompletos: 0.0,
                initialEstaViva: true,
                initialHomeostasisTargets: {}
            )
            
            // Emitir evento
            emit MitosisOccurred(
                parentID: self.id,
                childID: newID,
                epCost: epCost
            )
            
            return <-newCreature
        }
        
        // Función auxiliar para reproducción sexual
        // Esta función será usada internamente por la colección
        access(all) fun getReproductionData(): {String: AnyStruct} {
            return {
                "id": self.id,
                "genesVisibles": self.genesVisibles,
                "genesOcultos": self.genesOcultos,
                "initialSeed": self.initialSeed
            }
        }

        // Nueva función para emitir el evento de evolución procesada
        access(all) fun emitEvolutionProcessedEvent(processedSteps: UInt64, newAge: UFix64, evolutionPoints: UFix64) {
            emit EvolutionProcessed(
                creatureID: self.id,
                processedSteps: processedSteps,
                newAge: newAge,
                evolutionPoints: evolutionPoints
            )
        }
    }

    /// Define el interfaz público de la colección para exponer los métodos especiales de las criaturas
    access(all) resource interface CollectionPublic {
        access(all) view fun getIDs(): [UInt64]
        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}?
        access(all) view fun borrowCreatureNFT(id: UInt64): &CreatureNFTV6.NFT?
        access(all) view fun getActiveCreatureIDs(): [UInt64]
        access(all) view fun getActiveCreatureCount(): UInt64
        access(all) fun attemptSexualReproduction(): @NFT?
    }

    /// Defines the Collection resource that holds NFTs
    access(all) resource Collection: NonFungibleToken.Collection, CollectionPublic {
        /// Dictionary of NFT conforming tokens
        /// NFT is a resource type with an `UInt64` ID field
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}
        
        /// Array para seguimiento de criaturas vivas
        access(self) var activeCreatureIDs: [UInt64]

        init () {
            self.ownedNFTs <- {}
            self.activeCreatureIDs = []
        }

        /// Removes an NFT from the collection and moves it to the caller
        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("Cannot withdraw NFT: token not found")
            
            // Eliminar de la lista de criaturas activas si existe
            var i = 0
            while i < self.activeCreatureIDs.length {
                if self.activeCreatureIDs[i] == withdrawID {
                    self.activeCreatureIDs.remove(at: i)
                    break 
                }
                i = i + 1
            }
            
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        /// Adds an NFT to the collections dictionary
        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @CreatureNFTV6.NFT
            let id: UInt64 = token.id
            
            // Verificar si está viva y gestionar límite
            if token.estaViva {
                if UInt64(self.activeCreatureIDs.length) >= CreatureNFTV6.MAX_ACTIVE_CREATURES {
                    panic("Límite máximo de criaturas vivas alcanzado (5). No se puede depositar más criaturas vivas.")
                }
                
                // Verificar si ya está en la lista (por si acaso)
                var found = false
                for activeID in self.activeCreatureIDs {
                    if activeID == id { 
                        found = true
                        break 
                    }
                }
                if !found { 
                    self.activeCreatureIDs.append(id) 
                }
            }
            
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }

        /// Helper method for getting the collection IDs
        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        /// Gets a reference to an NFT in the collection
        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
        }

        /// Gets a reference to a specific NFT type in the collection (read-only)
        access(all) view fun borrowCreatureNFT(id: UInt64): &CreatureNFTV6.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
                return ref as! &CreatureNFTV6.NFT
            }
            return nil
        }
        
        /// Gets an authorized reference to a specific NFT that can be modified
        access(all) fun borrowCreatureNFTForUpdate(id: UInt64): auth(Mutate, Insert, Remove) &CreatureNFTV6.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as auth(Mutate, Insert, Remove) &{NonFungibleToken.NFT}?
                return ref as! auth(Mutate, Insert, Remove) &CreatureNFTV6.NFT
            }
            return nil
        }

        /// Returns supported NFT types the collection can receive
        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@CreatureNFTV6.NFT>()] = true
            return supportedTypes
        }

        /// Returns whether or not the given type is accepted by the collection
        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@CreatureNFTV6.NFT>()
        }

        /// Create an empty NFT Collection
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-CreatureNFTV6.createEmptyCollection(nftType: Type<@CreatureNFTV6.NFT>())
        }
        
        /// Obtiene la lista de IDs de criaturas vivas en la colección
        access(all) view fun getActiveCreatureIDs(): [UInt64] {
            return self.activeCreatureIDs
        }
        
        /// Obtiene el número de criaturas vivas en la colección
        access(all) view fun getActiveCreatureCount(): UInt64 {
            return UInt64(self.activeCreatureIDs.length)
        }
        
        /// Marca una criatura como viva en la colección (usado cuando una criatura revive)
        access(all) fun markCreatureAsAlive(creatureID: UInt64) {
            // Verificar que la criatura existe en la colección
            let creatureRef = self.borrowCreatureNFT(id: creatureID)
                ?? panic("La criatura con ID ".concat(creatureID.toString()).concat(" no existe en esta colección"))
            
            // Verificar que la criatura está viva
            if !creatureRef.estaViva {
                panic("No se puede marcar como viva una criatura que está muerta")
            }
            
            // Verificar si ya está en la lista de activas
            var found = false
            for id in self.activeCreatureIDs {
                if id == creatureID {
                    found = true
                    break
                }
            }
            
            // Si no está en la lista y hay espacio, anadirla
            if !found {
                if UInt64(self.activeCreatureIDs.length) < CreatureNFTV6.MAX_ACTIVE_CREATURES {
                    self.activeCreatureIDs.append(creatureID)
                    log("Criatura ".concat(creatureID.toString()).concat(" marcada como viva en la colección"))
                } else {
                    panic("No se puede marcar la criatura como viva: límite máximo de criaturas vivas alcanzado (5)")
                }
            }
        }
        
        /// Marca una criatura como muerta en la colección
        access(all) fun markCreatureAsDead(creatureID: UInt64) {
            // Eliminar de la lista de activas si existe
            var i = 0
            while i < self.activeCreatureIDs.length {
                if self.activeCreatureIDs[i] == creatureID {
                    self.activeCreatureIDs.remove(at: i)
                    log("Criatura ".concat(creatureID.toString()).concat(" marcada como muerta en la colección"))
                    break
                }
                i = i + 1
            }
        }

        /// Intenta reproducción sexual entre dos criaturas aleatorias
        /// Retorna un nuevo NFT si tiene éxito, o nil si falla
        access(all) fun attemptSexualReproduction(): @NFT? {
            // Verificar que haya al menos 2 criaturas vivas
            if UInt64(self.activeCreatureIDs.length) < 2 {
                return nil
            }
            
            // Verificar que no exceda el límite máximo
            if UInt64(self.activeCreatureIDs.length) >= CreatureNFTV6.MAX_ACTIVE_CREATURES {
                return nil
            }
            
            // Probabilidad base de reproducción (original)
            let reproductionChance: UFix64 = 0.25 // Restaurado a 0.25 (valor original)
            
            // Generar un número aleatorio para determinar si ocurre la reproducción
            let currentBlock = getCurrentBlock()
            let timestampFactor = UInt64(currentBlock.timestamp) % 1000000 // Limitar tamaño
            let randomSeed = currentBlock.height ^ timestampFactor
            let randomValue = UFix64(randomSeed % 100) / 100.0
            
            if randomValue > reproductionChance {
                // No ocurre reproducción esta vez
                return nil
            }
            
            // Elegir dos padres aleatorios diferentes
            if self.activeCreatureIDs.length < 2 {
                return nil
            }
            
            // Mezclar los IDs para selección aleatoria
            var shuffledIDs = self.activeCreatureIDs
            
            // Algoritmo simple de shuffle
            let shuffleSeed = randomSeed ^ UInt64(self.activeCreatureIDs.length)
            var i = shuffledIDs.length - 1
            while i > 0 {
                let j = UInt64(shuffleSeed ^ UInt64(i)) % UInt64(i + 1)
                let temp = shuffledIDs[i]
                shuffledIDs[i] = shuffledIDs[Int(j)]
                shuffledIDs[Int(j)] = temp
                i = i - 1
            }
            
            // Tomar los dos primeros IDs después del shuffle
            let parent1ID = shuffledIDs[0]
            let parent2ID = shuffledIDs[1]
            
            // Obtener referencias a los padres
            let parent1Ref = self.borrowCreatureNFT(id: parent1ID) ?? panic("No se pudo encontrar la criatura padre 1")
            let parent2Ref = self.borrowCreatureNFT(id: parent2ID) ?? panic("No se pudo encontrar la criatura padre 2")
            
            // Obtener datos para la reproducción
            let parent1Data = parent1Ref.getReproductionData()
            let parent2Data = parent2Ref.getReproductionData()
            
            // Combinar semillas de ambos padres
            let parent1Seed = parent1Data["initialSeed"] as! UInt64
            let parent2Seed = parent2Data["initialSeed"] as! UInt64
            let childSeed = parent1Seed ^ parent2Seed ^ randomSeed
            
            // Combinar genes de ambos padres
            let childGenesVisibles: {String: UFix64} = {}
            let childGenesOcultos: {String: UFix64} = {}
            
            // Obtener genes de los padres
            let p1GenesVisibles = parent1Data["genesVisibles"] as! {String: UFix64}
            let p2GenesVisibles = parent2Data["genesVisibles"] as! {String: UFix64}
            let p1GenesOcultos = parent1Data["genesOcultos"] as! {String: UFix64}
            let p2GenesOcultos = parent2Data["genesOcultos"] as! {String: UFix64}
            
            // Mezclar genes visibles (herencia mendeliana simplificada)
            for genName in p1GenesVisibles.keys {
                // 50% de probabilidad de heredar de cada padre, con pequena mutación
                let geneSeed = childSeed ^ UInt64(genName.length)
                let parentChoice = geneSeed % 2 // 0 o 1
                let baseValue = parentChoice == 0 ? p1GenesVisibles[genName]! : p2GenesVisibles[genName]!
                
                // Pequena mutación (±10%)
                // Fix: Usar valor limitado para evitar overflow
                let safeSeed = geneSeed % 200 // Limitar el valor a 0-199
                let mutationFactor = 0.9 + (UFix64(safeSeed) / 1000.0) // 0.9-1.1
                childGenesVisibles[genName] = baseValue * mutationFactor
            }
            
            // Mezclar genes ocultos (promedio con pequena mutación)
            for genName in p1GenesOcultos.keys {
                // Promedio de ambos padres
                let parent1Value = p1GenesOcultos[genName]!
                let parent2Value = p2GenesOcultos[genName]!
                let avgValue = (parent1Value + parent2Value) / 2.0
                
                // Pequena mutación (±10%)
                // Fix: Usar valor limitado para evitar overflow
                let geneSeed = (childSeed >> 16) ^ UInt64(genName.length)
                let safeSeed = geneSeed % 200 // Limitar el valor a 0-199
                let mutationFactor = 0.9 + (UFix64(safeSeed) / 1000.0) // 0.9-1.1
                childGenesOcultos[genName] = avgValue * mutationFactor
            }
            
            // Calcular esperanza de vida basada en el gen correspondiente
            let baseLifespan = childGenesOcultos["max_lifespan_dias_base"]!
            
            // Crear nueva criatura con vida completa
            CreatureNFTV6.totalSupply = CreatureNFTV6.totalSupply + 1
            let newID = CreatureNFTV6.totalSupply
            
            let newCreature <- create NFT(
                id: newID,
                name: "", // Sin nombre predefinido
                description: "", // Sin descripción predefinida
                thumbnail: parent1Ref.thumbnail, // Usar el thumbnail del primer padre
                birthBlockHeight: currentBlock.height,
                initialGenesVisibles: childGenesVisibles,
                initialGenesOcultos: childGenesOcultos,
                initialPuntosEvolucion: 15.0, // EP inicial estándar
                lifespanDays: baseLifespan, // Vida completa
                initialEdadDiasCompletos: 0.0,
                initialEstaViva: true,
                initialHomeostasisTargets: {}
            )
            
            // Emitir evento
            emit SexualReproductionOccurred(
                parent1ID: parent1ID,
                parent2ID: parent2ID,
                childID: newID
            )
            
            return <-newCreature
        }
    }

    /// Resource that allows minting of NFTs
    access(all) resource NFTMinter {
        /// Mints a new NFT with given parameters
        access(all) fun createNFT(
            name: String, 
            description: String, 
            thumbnail: String,
            birthBlockHeight: UInt64,
            initialGenesVisibles: {String: UFix64},
            initialGenesOcultos: {String: UFix64},
            initialPuntosEvolucion: UFix64,
            lifespanDays: UFix64,
            initialEdadDiasCompletos: UFix64,
            initialEstaViva: Bool,
            initialHomeostasisTargets: {String: UFix64}
        ): @NFT {
            CreatureNFTV6.totalSupply = CreatureNFTV6.totalSupply + 1
            let newID = CreatureNFTV6.totalSupply
            
            return <-create NFT(
                id: newID,
                name: name,
                description: description,
                thumbnail: thumbnail,
                birthBlockHeight: birthBlockHeight,
                initialGenesVisibles: initialGenesVisibles,
                initialGenesOcultos: initialGenesOcultos,
                initialPuntosEvolucion: initialPuntosEvolucion,
                lifespanDays: lifespanDays,
                initialEdadDiasCompletos: initialEdadDiasCompletos,
                initialEstaViva: initialEstaViva,
                initialHomeostasisTargets: initialHomeostasisTargets
            )
        }
    }

    /// Creates an empty collection for storing NFTs
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    /// Gets a list of views for all NFTs defined by this contract
    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return [
            Type<MetadataViews.NFTCollectionData>(),
            Type<MetadataViews.NFTCollectionDisplay>()
        ]
    }

    /// Resolves a view that applies to all the NFTs defined by this contract
    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<MetadataViews.NFTCollectionData>():
                return MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&CreatureNFTV6.Collection>(),
                    publicLinkedType: Type<&CreatureNFTV6.Collection>(),
                    createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                        return <-CreatureNFTV6.createEmptyCollection(nftType: Type<@CreatureNFTV6.NFT>())
                    })
                )
            case Type<MetadataViews.NFTCollectionDisplay>():
                let media = MetadataViews.Media(
                    file: MetadataViews.HTTPFile(
                        url: "https://example.com/creature_collection_banner.png"
                    ),
                    mediaType: "image/png"
                )
                return MetadataViews.NFTCollectionDisplay(
                    name: "Evolving Creatures V3",
                    description: "A collection of unique, evolving digital creatures with simulated life cycles.",
                    externalURL: MetadataViews.ExternalURL("https://example.com/creatures"),
                    squareImage: media,
                    bannerImage: media,
                    socials: {
                        "twitter": MetadataViews.ExternalURL("https://twitter.com/YourCreatureProject")
                    }
                )
        }
        return nil
    }

    init() {
        log("CreatureNFTV6: init() STARTED")

        // Initialize the total supply
        self.totalSupply = 0
        log("CreatureNFTV6: totalSupply initialized")
        
        // Inicializar el límite de criaturas vivas por cuenta
        self.MAX_ACTIVE_CREATURES = 5
        log("CreatureNFTV6: MAX_ACTIVE_CREATURES initialized")

        // Set the named paths
        self.CollectionStoragePath = /storage/CreatureNFTV6Collection
        self.CollectionPublicPath = /public/CreatureNFTV6Collection
        self.MinterStoragePath = /storage/CreatureNFTV6Minter
        log("CreatureNFTV6: Paths initialized")

        // --- START Initialize Evolution Constants & Gene Ranges ---
        self.TASA_APRENDIZAJE_HOMEOSTASIS_BASE = 0.05
        self.TASA_EVOLUCION_PASIVA_GEN_BASE = 0.001
        self.FACTOR_INFLUENCIA_VISUAL_SOBRE_COMBATE = 0.0001

        let visibleRanges: {String: {String: UFix64}} = {}
        visibleRanges["colorR"] = {"min": 0.0, "max": 1.0}
        visibleRanges["colorG"] = {"min": 0.0, "max": 1.0}
        visibleRanges["colorB"] = {"min": 0.0, "max": 1.0}
        visibleRanges["tamanoBase"] = {"min": 0.5, "max": 3.0}
        visibleRanges["formaPrincipal"] = {"min": 1.0, "max": 3.0} 
        visibleRanges["numApendices"] = {"min": 0.0, "max": 8.0}
        visibleRanges["patronMovimiento"] = {"min": 1.0, "max": 4.0}
        self.GENES_VISIBLES_RANGES = visibleRanges

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
        log("CreatureNFTV6: Constants and Ranges initialized")
        // --- END Initialize Evolution Constants & Gene Ranges ---

        // --- START Initialize Mitosis Constants ---
        self.MITOSIS_LIFESPAN_BASE_FACTOR = 0.4
        self.MITOSIS_LIFESPAN_EP_BONUS_FACTOR = 0.005 // Ej: 100 EP = +0.5 días
        self.MITOSIS_POTENCIAL_BASE_INHERITANCE_FACTOR = 0.75 
        self.MITOSIS_POTENCIAL_EP_BONUS_FACTOR = 0.001 // Ej: 100 EP = +0.1 al potencial
        // --- END Initialize Mitosis Constants ---
        log("CreatureNFTV6: Mitosis constants initialized") // Added log for this section too

        // Create and save the NFTMinter resource
        log("CreatureNFTV6: Attempting to create and save NFTMinter")
        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)
        log("CreatureNFTV6: NFTMinter saved to storage")

        // Attempt to unlink first, in case of a bad existing capability (for debugging)
        log("CreatureNFTV6: Attempting to unpublish /public/CreatureNFTV6Minter")
        self.account.capabilities.unpublish(/public/CreatureNFTV6Minter)
        log("Attempted to unpublish /public/CreatureNFTV6Minter (if it existed)")

        // Publish a capability to the NFTMinter for the contract owner
        log("CreatureNFTV6: Attempting to publish Minter capability")
        let minterCapability = self.account.capabilities.storage.issue<&CreatureNFTV6.NFTMinter>(self.MinterStoragePath)
        self.account.capabilities.publish(minterCapability, at: /public/CreatureNFTV6Minter)
        log("Minter capability published to /public/CreatureNFTV6Minter")

        emit ContractInitialized()
        log("CreatureNFTV6: init() COMPLETED")
    }
} 