import "NonFungibleToken"
import "MetadataViews"
import "ViewResolver" // Added for explicit conformance if needed by NFT resource

access(all) contract CreatureNFTV3: NonFungibleToken {

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
        access(all) let genesOcultos: {String: UFix64}
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
            emit CreatureNFTV3.InitialSeedChanged(
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

        // Método para aplicar evolución por step específico (tiny evolution)
        access(all) fun updateGenesForStep(r0: UInt64, r1: UInt64, stepsPerDay: UInt64) {
            // Esta es una versión escalada de updateGenes
            // donde cada step representa 1/stepsPerDay de un día completo
            let stepFactor = 1.0 / UFix64(stepsPerDay)
            
            // Implementación de _updateGenes de simulation.py pero escalada para steps
            for geneName in self.genesVisibles.keys {
                let currentValue = self.genesVisibles[geneName]!
                
                // Verificar si existe un objetivo de homeostasis para este gen
                if self.homeostasisTargets[geneName] != nil {
                    let targetValue = self.homeostasisTargets[geneName]!
                    
                    // Calcular diferencia entre valor actual y objetivo
                    let difference = targetValue - currentValue
                    let differenceAbs = self.abs(difference)
                    
                    // Si hay suficiente diferencia, evolucionar hacia el objetivo
                    if differenceAbs > 0.0001 { // Umbral reducido para steps pequeños
                        // Usar valores aleatorios para determinar velocidad de cambio
                        let randomFactor = UFix64(r0 % 1000) / 1000.0
                        // Tasa evolutiva base diaria (entre 1% y 6%) dividida por número de steps
                        let evolutionRatePerStep = (0.01 + (0.05 * randomFactor)) * stepFactor
                        
                        // Dirección del cambio
                        var changeAmount: UFix64 = 0.0
                        if difference > 0.0 {
                            changeAmount = self.min(evolutionRatePerStep, difference)
                        } else {
                            // Usando la versión positiva y luego negándola manualmente
                            let positiveRate = evolutionRatePerStep
                            if differenceAbs < positiveRate {
                                changeAmount = 0.0 - differenceAbs
                            } else {
                                changeAmount = 0.0 - positiveRate
                            }
                        }
                        
                        // Aplicar cambio
                        self.genesVisibles[geneName] = currentValue + changeAmount
                    }
                } else {
                    // Para genes sin objetivo, aplicar pequeñas mutaciones aleatorias
                    // Usar R0 y R1 para mutaciones base
                    let r0Factor = UFix64(r0 % 100) / 100.0
                    let r1Factor = UFix64(r1 % 100) / 100.0
                    
                    // Probabilidad reducida para mutación por step (10% / stepsPerDay)
                    if r0Factor < (0.1 * stepFactor) {
                        // Dirección y magnitud de la mutación (también escaladas)
                        let mutationStrength = 0.01 * (r1Factor * 2.0) * stepFactor
                        
                        // Aplicar mutación - versión simplificada
                        var newValue = currentValue
                        
                        // Si r1Factor > 0.5, aumentamos el valor
                        if r1Factor > 0.5 {
                            newValue = currentValue + mutationStrength
                            // Verificar límite superior
                            if newValue > 1.0 {
                                newValue = 1.0
                            }
                        } else {
                            // Si no, lo disminuimos
                            if currentValue > mutationStrength {
                                newValue = currentValue - mutationStrength
                            } else {
                                newValue = 0.0
                            }
                        }
                        
                        // Actualizar gen
                        self.genesVisibles[geneName] = newValue
                    }
                }
            }
        }
        
        // Método para ganar puntos de evolución por step
        access(all) fun gainEvolutionPointsForStep(r0: UInt64, stepsPerDay: UInt64) {
            // Versión escalada de gainEvolutionPoints para un step individual
            let stepFactor = 1.0 / UFix64(stepsPerDay)
            
            // Calcular EP diarios basados en edad y factores aleatorios (como en simulation.py)
            var ageMultiplier: UFix64 = 0.0
            if self.edadDiasCompletos < 10.0 {
                ageMultiplier = 2.0 // Criaturas jóvenes ganan más EP
            } else if self.edadDiasCompletos < 30.0 {
                ageMultiplier = 1.5 // Criaturas adolescentes ganan EP moderado
            } else {
                ageMultiplier = 1.0 // Criaturas adultas ganan EP normal
            }
            
            // Usar factor aleatorio para EP (entre 0.5 y 1.5)
            let randomFactor = 0.5 + (UFix64(r0 % 100) / 100.0)
            
            // Base diaria de EP: entre 0.5 y 1.5 dividido por número de steps
            let baseEPPerStep = 1.0 * ageMultiplier * randomFactor * stepFactor
            
            // Añadir EP ganados
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
                    return CreatureNFTV3.resolveContractView(resourceType: Type<@CreatureNFTV3.NFT>(), viewType: Type<MetadataViews.NFTCollectionData>())
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return CreatureNFTV3.resolveContractView(resourceType: Type<@CreatureNFTV3.NFT>(), viewType: Type<MetadataViews.NFTCollectionDisplay>())
            }
            return nil
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-CreatureNFTV3.createEmptyCollection(nftType: Type<@CreatureNFTV3.NFT>())
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
            let childSeed = self.initialSeed ^ UInt64(currentBlock.timestamp * 100000.0) ^ currentBlock.height
            
            // Crear nuevos genes con pequeñas mutaciones
            let childGenesVisibles: {String: UFix64} = {}
            let childGenesOcultos: {String: UFix64} = {}
            
            // Copiar genes visibles con pequeñas mutaciones
            for genName in self.genesVisibles.keys {
                let currentValue = self.genesVisibles[genName]!
                // Mutación pequeña (±5%)
                let mutationFactor = 0.95 + (UFix64(childSeed % 100) / 1000.0) // 0.95-1.05
                childGenesVisibles[genName] = currentValue * mutationFactor
            }
            
            // Copiar genes ocultos con pequeñas mutaciones
            for genName in self.genesOcultos.keys {
                let currentValue = self.genesOcultos[genName]!
                // Mutación pequeña (±5%)
                let mutationFactor = 0.95 + (UFix64((childSeed >> 8) % 100) / 1000.0) // 0.95-1.05
                childGenesOcultos[genName] = currentValue * mutationFactor
            }
            
            // Obtener siguiente ID desde el contrato
            CreatureNFTV3.totalSupply = CreatureNFTV3.totalSupply + 1
            let newID = CreatureNFTV3.totalSupply
            
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
                lifespanDays: self.lifespanTotalSimulatedDays / 2.0, // Mitad de vida
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
        access(all) view fun borrowCreatureNFT(id: UInt64): &CreatureNFTV3.NFT?
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
            let token <- token as! @CreatureNFTV3.NFT
            let id: UInt64 = token.id
            
            // Verificar si está viva y gestionar límite
            if token.estaViva {
                if UInt64(self.activeCreatureIDs.length) >= CreatureNFTV3.MAX_ACTIVE_CREATURES {
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
        access(all) view fun borrowCreatureNFT(id: UInt64): &CreatureNFTV3.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
                return ref as! &CreatureNFTV3.NFT
            }
            return nil
        }
        
        /// Gets an authorized reference to a specific NFT that can be modified
        access(all) fun borrowCreatureNFTForUpdate(id: UInt64): auth(Mutate, Insert, Remove) &CreatureNFTV3.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as auth(Mutate, Insert, Remove) &{NonFungibleToken.NFT}?
                return ref as! auth(Mutate, Insert, Remove) &CreatureNFTV3.NFT
            }
            return nil
        }

        /// Returns supported NFT types the collection can receive
        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@CreatureNFTV3.NFT>()] = true
            return supportedTypes
        }

        /// Returns whether or not the given type is accepted by the collection
        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@CreatureNFTV3.NFT>()
        }

        /// Create an empty NFT Collection
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-CreatureNFTV3.createEmptyCollection(nftType: Type<@CreatureNFTV3.NFT>())
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
            
            // Si no está en la lista y hay espacio, añadirla
            if !found {
                if UInt64(self.activeCreatureIDs.length) < CreatureNFTV3.MAX_ACTIVE_CREATURES {
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
            if UInt64(self.activeCreatureIDs.length) >= CreatureNFTV3.MAX_ACTIVE_CREATURES {
                return nil
            }
            
            // Probabilidad base de reproducción (25%)
            let reproductionChance: UFix64 = 0.25
            
            // Generar un número aleatorio para determinar si ocurre la reproducción
            let currentBlock = getCurrentBlock()
            let randomSeed = currentBlock.height ^ UInt64(currentBlock.timestamp * 1000.0)
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
                // 50% de probabilidad de heredar de cada padre, con pequeña mutación
                let geneSeed = childSeed ^ UInt64(genName.length)
                let parentChoice = geneSeed % 2 // 0 o 1
                let baseValue = parentChoice == 0 ? p1GenesVisibles[genName]! : p2GenesVisibles[genName]!
                
                // Pequeña mutación (±10%)
                let mutationFactor = 0.9 + (UFix64(geneSeed % 200) / 1000.0) // 0.9-1.1
                childGenesVisibles[genName] = baseValue * mutationFactor
            }
            
            // Mezclar genes ocultos (promedio con pequeña mutación)
            for genName in p1GenesOcultos.keys {
                // Promedio de ambos padres
                let parent1Value = p1GenesOcultos[genName]!
                let parent2Value = p2GenesOcultos[genName]!
                let avgValue = (parent1Value + parent2Value) / 2.0
                
                // Pequeña mutación (±10%)
                let geneSeed = (childSeed >> 16) ^ UInt64(genName.length)
                let mutationFactor = 0.9 + (UFix64(geneSeed % 200) / 1000.0) // 0.9-1.1
                childGenesOcultos[genName] = avgValue * mutationFactor
            }
            
            // Calcular esperanza de vida basada en el gen correspondiente
            let baseLifespan = childGenesOcultos["max_lifespan_dias_base"]!
            
            // Crear nueva criatura con vida completa
            CreatureNFTV3.totalSupply = CreatureNFTV3.totalSupply + 1
            let newID = CreatureNFTV3.totalSupply
            
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
            CreatureNFTV3.totalSupply = CreatureNFTV3.totalSupply + 1
            let newID = CreatureNFTV3.totalSupply
            
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
                    publicCollection: Type<&CreatureNFTV3.Collection>(),
                    publicLinkedType: Type<&CreatureNFTV3.Collection>(),
                    createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                        return <-CreatureNFTV3.createEmptyCollection(nftType: Type<@CreatureNFTV3.NFT>())
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
        // Initialize the total supply
        self.totalSupply = 0
        
        // Inicializar el límite de criaturas vivas por cuenta
        self.MAX_ACTIVE_CREATURES = 5

        // Set the named paths
        self.CollectionStoragePath = /storage/CreatureNFTV3Collection
        self.CollectionPublicPath = /public/CreatureNFTV3Collection
        self.MinterStoragePath = /storage/CreatureNFTV3Minter

        // Create and save the NFTMinter resource
        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
} 