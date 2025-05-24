import "NonFungibleToken"
import "MetadataViews"
import "ViewResolver" // Added for explicit conformance if needed by NFT resource

access(all) contract CreatureNFTV2: NonFungibleToken {

    /// Total supply of CreatureNFTs in existence
    access(all) var totalSupply: UInt64

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
            self.initialSeed = self.id ^ UInt64(self.birthTimestamp * 100000.0) ^ self.birthBlockHeight
            
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
            emit CreatureNFTV2.InitialSeedChanged(
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
                    return CreatureNFTV2.resolveContractView(resourceType: Type<@CreatureNFTV2.NFT>(), viewType: Type<MetadataViews.NFTCollectionData>())
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return CreatureNFTV2.resolveContractView(resourceType: Type<@CreatureNFTV2.NFT>(), viewType: Type<MetadataViews.NFTCollectionDisplay>())
            }
            return nil
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-CreatureNFTV2.createEmptyCollection(nftType: Type<@CreatureNFTV2.NFT>())
        }
    }

    /// Define el interfaz público de la colección para exponer los métodos especiales de las criaturas
    access(all) resource interface CollectionPublic {
        access(all) view fun getIDs(): [UInt64]
        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}?
        access(all) view fun borrowCreatureNFT(id: UInt64): &CreatureNFTV2.NFT?
    }

    /// Defines the Collection resource that holds NFTs
    access(all) resource Collection: NonFungibleToken.Collection, CollectionPublic {
        /// Dictionary of NFT conforming tokens
        /// NFT is a resource type with an `UInt64` ID field
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init () {
            self.ownedNFTs <- {}
        }

        /// Removes an NFT from the collection and moves it to the caller
        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("Cannot withdraw NFT: token not found")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        /// Adds an NFT to the collections dictionary
        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @CreatureNFTV2.NFT
            let id: UInt64 = token.id
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
        access(all) view fun borrowCreatureNFT(id: UInt64): &CreatureNFTV2.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
                return ref as! &CreatureNFTV2.NFT
            }
            return nil
        }
        
        /// Gets an authorized reference to a specific NFT that can be modified
        access(all) fun borrowCreatureNFTForUpdate(id: UInt64): auth(Mutate, Insert, Remove) &CreatureNFTV2.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as auth(Mutate, Insert, Remove) &{NonFungibleToken.NFT}?
                return ref as! auth(Mutate, Insert, Remove) &CreatureNFTV2.NFT
            }
            return nil
        }

        /// Returns supported NFT types the collection can receive
        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@CreatureNFTV2.NFT>()] = true
            return supportedTypes
        }

        /// Returns whether or not the given type is accepted by the collection
        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@CreatureNFTV2.NFT>()
        }

        /// Create an empty NFT Collection
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-CreatureNFTV2.createEmptyCollection(nftType: Type<@CreatureNFTV2.NFT>())
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
            CreatureNFTV2.totalSupply = CreatureNFTV2.totalSupply + 1
            let newID = CreatureNFTV2.totalSupply
            
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
                    publicCollection: Type<&CreatureNFTV2.Collection>(),
                    publicLinkedType: Type<&CreatureNFTV2.Collection>(),
                    createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                        return <-CreatureNFTV2.createEmptyCollection(nftType: Type<@CreatureNFTV2.NFT>())
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
                    name: "Evolving Creatures V2",
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

        // Set the named paths
        self.CollectionStoragePath = /storage/CreatureNFTV2Collection
        self.CollectionPublicPath = /public/CreatureNFTV2Collection
        self.MinterStoragePath = /storage/CreatureNFTV2Minter

        // Create and save the NFTMinter resource
        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
} 