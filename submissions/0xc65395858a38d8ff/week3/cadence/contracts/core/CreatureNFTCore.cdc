import "NonFungibleToken"
import "MetadataViews"
import "ViewResolver"
import "IGeneModule"

access(all) contract CreatureNFTCore: NonFungibleToken {

    // === ELEMENTOS INMUTABLES DEL CORE ===
    access(all) var totalSupply: UInt64
    access(all) let MAX_ACTIVE_CREATURES: UInt64

    // === TIPOS AUXILIARES ===
    access(all) struct ModuleGenesData {
        access(all) let genes: {String: UFix64}
        
        init(genes: {String: UFix64}) {
            self.genes = genes
        }
    }

    // === CONSTANTES DE REPRODUCCIÓN ===
    access(all) let MITOSIS_LIFESPAN_BASE_FACTOR: UFix64
    access(all) let MITOSIS_LIFESPAN_EP_BONUS_FACTOR: UFix64
    access(all) let MITOSIS_POTENCIAL_BASE_INHERITANCE_FACTOR: UFix64
    access(all) let MITOSIS_POTENCIAL_EP_BONUS_FACTOR: UFix64

    // === REGISTRO DE MÓDULOS ===
    access(self) var registeredModuleTypes: {String: Bool}
    access(self) var moduleFactories: {String: {String: AnyStruct}} // tipo -> {address: Address, contractName: String}

    // === EVENTOS ===
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event NFTMinted(id: UInt64, name: String, birthTimestamp: UFix64, birthBlockHeight: UInt64, lifespanTotalSimulatedDays: UFix64)
    access(all) event DescriptionUpdated(id: UInt64, newDescription: String)
    access(all) event ThumbnailUpdated(id: UInt64, newThumbnail: String)
    access(all) event EvolutionProcessed(creatureID: UInt64, processedSteps: UInt64, newAge: UFix64, evolutionPoints: UFix64)
    access(all) event CreatureDied(creatureID: UInt64, deathBlockHeight: UInt64, deathTimestamp: UFix64)
    access(all) event HomeostasisTargetSet(creatureID: UInt64, gene: String, target: UFix64)
    access(all) event InitialSeedChanged(creatureID: UInt64, oldSeed: UInt64, newSeed: UInt64, changeCount: UInt64, epCost: UFix64)
    access(all) event MitosisOccurred(parentID: UInt64, childID: UInt64, epCost: UFix64)
    access(all) event SexualReproductionOccurred(parent1ID: UInt64, parent2ID: UInt64, childID: UInt64)
    access(all) event ModuleRegistered(moduleType: String, contractAddress: Address)
    access(all) event ModuleUnregistered(moduleType: String)

    // === STORAGE PATHS ===
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    // === CORE NFT RESOURCE ===
    access(all) resource NFT: NonFungibleToken.NFT, ViewResolver.Resolver {
        access(all) let id: UInt64
        access(all) let birthTimestamp: UFix64
        access(all) let birthBlockHeight: UInt64
        access(all) let name: String
        access(all) var description: String
        access(all) var thumbnail: String // ← VARIABLE para evolución visual

        // === SISTEMAS CORE (INMUTABLES) ===
        access(all) var puntosEvolucion: UFix64
        access(all) var edadDiasCompletos: UFix64
        access(all) var estaViva: Bool
        access(all) var deathBlockHeight: UInt64?
        access(all) var deathTimestamp: UFix64?
        access(all) let lifespanTotalSimulatedDays: UFix64
        access(all) var initialSeed: UInt64

        // === TRACKING DE EVOLUCIÓN ===
        access(all) var lastEvolutionProcessedBlockHeight: UInt64
        access(all) var lastEvolutionProcessedTimestamp: UFix64
        access(all) var committedToRandomBlockHeight: UInt64?
        access(all) var currentActiveBeaconSeed: String?
        access(all) var lastBeaconSeedFetchedBlockHeight: UInt64?
        access(all) var simulatedDaysProcessedWithCurrentSeed: UInt64

        // === HOMEOSTASIS ===
        access(all) var homeostasisTargets: {String: UFix64}

        // === SISTEMA MODULAR ===
        access(all) var geneModules: @{String: IGeneModule}
        access(all) var moduleMetadata: {String: {String: AnyStruct}}

        init(
            id: UInt64,
            name: String,
            description: String,
            thumbnail: String,
            birthBlockHeight: UInt64,
            initialPuntosEvolucion: UFix64,
            lifespanDays: UFix64,
            initialEdadDiasCompletos: UFix64,
            initialEstaViva: Bool,
            initialSeed: UInt64,
            initialHomeostasisTargets: {String: UFix64},
            initialModules: @{String: IGeneModule}
        ) {
            self.id = id
            self.birthTimestamp = getCurrentBlock().timestamp
            self.birthBlockHeight = birthBlockHeight
            self.name = name
            self.description = description
            self.thumbnail = thumbnail

            self.puntosEvolucion = initialPuntosEvolucion
            self.edadDiasCompletos = initialEdadDiasCompletos
            self.estaViva = initialEstaViva
            self.deathBlockHeight = nil
            self.deathTimestamp = nil
            self.lifespanTotalSimulatedDays = lifespanDays
            self.initialSeed = initialSeed

            self.lastEvolutionProcessedBlockHeight = birthBlockHeight
            self.lastEvolutionProcessedTimestamp = self.birthTimestamp
            self.committedToRandomBlockHeight = nil
            self.currentActiveBeaconSeed = nil
            self.lastBeaconSeedFetchedBlockHeight = nil
            self.simulatedDaysProcessedWithCurrentSeed = 0

            self.homeostasisTargets = initialHomeostasisTargets
            self.geneModules <- initialModules
            self.moduleMetadata = {}

            // Inicializar contador de cambios de semilla
            self.homeostasisTargets["_seedChangeCount"] = 0.0

            emit NFTMinted(
                id: self.id,
                name: self.name,
                birthTimestamp: self.birthTimestamp,
                birthBlockHeight: self.birthBlockHeight,
                lifespanTotalSimulatedDays: self.lifespanTotalSimulatedDays
            )
        }

        // === FUNCIONES CORE ===
        access(all) fun updateDescription(newDescription: String) {
            self.description = newDescription
            emit DescriptionUpdated(id: self.id, newDescription: newDescription)
        }

        access(all) fun updateThumbnail(newThumbnail: String) {
            self.thumbnail = newThumbnail
            emit ThumbnailUpdated(id: self.id, newThumbnail: newThumbnail)
        }

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
            emit HomeostasisTargetSet(creatureID: self.id, gene: gene, target: value)
        }

        access(all) fun setLastEvolutionProcessed(blockHeight: UInt64, timestamp: UFix64) {
            self.lastEvolutionProcessedBlockHeight = blockHeight
            self.lastEvolutionProcessedTimestamp = timestamp
        }

        // === GESTIÓN DE MÓDULOS ===
        access(all) fun getModuleGenes(moduleType: String): {String: UFix64}? {
            if let moduleRef = &self.geneModules[moduleType] as &IGeneModule? {
                return moduleRef.getGenes()
            }
            return nil
        }

        access(all) fun setModuleGene(moduleType: String, geneName: String, value: UFix64) {
            if let moduleRef = &self.geneModules[moduleType] as &IGeneModule? {
                moduleRef.setGene(name: geneName, value: value)
            }
        }

        access(all) fun addModule(moduleType: String, module: @IGeneModule) {
            let oldModule <- self.geneModules[moduleType] <- module
            destroy oldModule
        }

        access(all) fun removeModule(moduleType: String): @IGeneModule? {
            return <- self.geneModules.remove(key: moduleType)
        }

        // === EVOLUCIÓN DE TODOS LOS MÓDULOS ===
        access(all) fun evolveAllModules(seeds: [UInt64], stepsPerDay: UInt64) {
            // Obtener potencial evolutivo del módulo de combate
            let potencial = self.getModuleGenes("combat")?["potencialEvolutivo"] ?? 1.0

            // Evolucionar cada módulo
            for moduleType in self.geneModules.keys {
                if let moduleRef = &self.geneModules[moduleType] as &IGeneModule? {
                    let updatedGenes = moduleRef.evolveStep(
                        seeds: seeds,
                        stepsPerDay: stepsPerDay,
                        potencialEvolutivo: potencial,
                        homeostasisTargets: self.homeostasisTargets
                    )
                    // Los genes se actualizan automáticamente en el módulo
                }
            }
        }

        // === CAMBIO DE SEMILLA INICIAL ===
        access(all) fun changeInitialSeed(newSeedBase: UInt64): Bool {
            let seedChangeCount = self.homeostasisTargets["_seedChangeCount"] ?? 0.0
            
            if seedChangeCount >= 3.0 {
                return false
            }
            
            let epCost: UFix64 = 10.0
            if self.puntosEvolucion < epCost {
                return false
            }
            
            let oldSeed = self.initialSeed
            let currentBlock = getCurrentBlock()
            let newSeed = newSeedBase ^ UInt64(currentBlock.timestamp * 100000.0) ^ currentBlock.height
            
            self.initialSeed = newSeed
            let newChangeCount = seedChangeCount + 1.0
            self.homeostasisTargets["_seedChangeCount"] = newChangeCount
            self.puntosEvolucion = self.puntosEvolucion - epCost
            
            emit InitialSeedChanged(
                creatureID: self.id,
                oldSeed: oldSeed,
                newSeed: newSeed,
                changeCount: UInt64(newChangeCount),
                epCost: epCost
            )
            
            return true
        }

        // === GENERACIÓN DE SEMILLAS DIARIAS ===
        access(all) fun generateDailySeeds(diaSimulado: UInt64): [UInt64] {
            let daySalt = diaSimulado * 127
            let base = self.initialSeed ^ daySalt
            
            let a: UInt64 = 1664525
            let c: UInt64 = 1013904223
            let m: UInt64 = 4294967296
            
            var seedState = base % m
            var seeds: [UInt64] = []
            
            var i: Int = 0
            while i < 5 {
                seedState = (seedState * a + c) % m
                seeds.append(seedState)
                i = i + 1
            }
            
            return seeds
        }

        access(all) fun calcularDiasTranscurridos(timestampActual: UFix64, segundosPorDiaSimulado: UFix64): UFix64 {
            let segundosTranscurridos = timestampActual - self.lastEvolutionProcessedTimestamp
            return segundosTranscurridos / segundosPorDiaSimulado
        }

        // === GANANCIA DE PUNTOS DE EVOLUCIÓN ===
        access(all) fun gainEvolutionPointsForStep(r0: UInt64, stepsPerDay: UInt64) {
            let potencialEvolutivo = self.getModuleGenes("combat")?["potencialEvolutivo"] ?? 1.0

            let MAX_LIFESPAN_DAYS: UFix64 = 7.0
            let MAX_AGE_MULTIPLIER: UFix64 = 2.0
            let MIN_AGE_MULTIPLIER: UFix64 = 1.0
            
            let totalDecreaseOverLifespan = MAX_AGE_MULTIPLIER - MIN_AGE_MULTIPLIER
            var decreasePerDay: UFix64 = 0.0
            if MAX_LIFESPAN_DAYS > 0.0 { 
                decreasePerDay = totalDecreaseOverLifespan / MAX_LIFESPAN_DAYS
            }
            
            let calculatedAgeMultiplier = MAX_AGE_MULTIPLIER - (self.edadDiasCompletos * decreasePerDay)
            let ageMultiplier = self.max(MIN_AGE_MULTIPLIER, calculatedAgeMultiplier)
            
            let PYTHON_MULTIPLIER = 50.0
            let PYTHON_BASE_FACTOR = 0.01

            let correctedRandomFactor = 0.5 + (UFix64(r0 % 101) / 100.0)
            let baseEPPerStep = potencialEvolutivo * PYTHON_BASE_FACTOR * PYTHON_MULTIPLIER * ageMultiplier * correctedRandomFactor
            
            self.puntosEvolucion = self.puntosEvolucion + baseEPPerStep
        }

        // === FUNCIONES AUXILIARES ===
        access(self) fun max(_ a: UFix64, _ b: UFix64): UFix64 {
            if a > b { return a }
            return b
        }

        access(self) fun min(_ a: UFix64, _ b: UFix64): UFix64 {
            if a < b { return a }
            return b
        }

        // === REPRODUCCIÓN - MITOSIS ===
        access(all) fun performMitosis(epCost: UFix64): @NFT? {
            if !self.estaViva { return nil }
            if self.puntosEvolucion < epCost { return nil }
            
            self.puntosEvolucion = self.puntosEvolucion - epCost
            
            let currentBlock = getCurrentBlock()
            let timestampFactor = UInt64(currentBlock.timestamp) % 1000000
            let childSeed = self.initialSeed ^ timestampFactor ^ currentBlock.height
            
            // Preparar contexto de mitosis
            let mitosisContext: {String: AnyStruct} = {
                "parentID": self.id,
                "epCost": epCost,
                "mitosisTimestamp": currentBlock.timestamp
            }
            
            // Crear módulos del hijo usando mitosis de cada módulo
            let childModules: @{String: IGeneModule} <- {}
            for moduleType in self.geneModules.keys {
                if let moduleRef = &self.geneModules[moduleType] as &IGeneModule? {
                    // Verificar que el tipo de módulo esté registrado
                    if !CreatureNFTCore.registeredModuleTypes.containsKey(moduleType) {
                        panic("Tipo de módulo no registrado: ".concat(moduleType))
                    }
                    
                    // Obtener información del factory
                    let factoryInfo = CreatureNFTCore.moduleFactories[moduleType]
                        ?? panic("No se encontró factory para módulo tipo: ".concat(moduleType))
                    
                    let factoryAddress = factoryInfo["address"] as! Address
                    let contractName = factoryInfo["contractName"] as! String
                    
                    // Obtener referencia al contrato factory dinámicamente
                    let factoryAccount = getAccount(factoryAddress)
                    let factory = factoryAccount.contracts.borrow<&{IGeneModule.IModuleFactory}>(name: contractName)
                        ?? panic("No se pudo obtener referencia al factory ".concat(contractName).concat(" en ").concat(factoryAddress.toString()))
                    
                    // Crear módulo usando la interfaz común
                    let childModule <- factory.createModuleFromMitosis(
                        parentModule: moduleRef,
                        childSeed: childSeed,
                        epCost: epCost,
                        mitosisContext: mitosisContext
                    )
                    
                    let oldModule <- childModules[moduleType] <- childModule
                    destroy oldModule
                }
            }
            
            // Calcular esperanza de vida mejorada del hijo
            let baseLifespanForChild = self.lifespanTotalSimulatedDays * CreatureNFTCore.MITOSIS_LIFESPAN_BASE_FACTOR
            let lifespanEpBonus = epCost * CreatureNFTCore.MITOSIS_LIFESPAN_EP_BONUS_FACTOR
            let childLifespan = baseLifespanForChild + lifespanEpBonus
            
            CreatureNFTCore.totalSupply = CreatureNFTCore.totalSupply + 1
            let newID = CreatureNFTCore.totalSupply
            
            let newCreature <- create NFT(
                id: newID,
                name: "",
                description: "",
                thumbnail: self.thumbnail,
                birthBlockHeight: currentBlock.height,
                initialPuntosEvolucion: epCost / 4.0,
                lifespanDays: childLifespan,
                initialEdadDiasCompletos: 0.0,
                initialEstaViva: true,
                initialSeed: childSeed,
                initialHomeostasisTargets: {},
                initialModules: <- childModules
            )
            
            emit MitosisOccurred(parentID: self.id, childID: newID, epCost: epCost)
            return <-newCreature
        }

        // === DATOS PARA REPRODUCCIÓN SEXUAL ===
        access(all) fun getReproductionData(): {String: AnyStruct} {
            var modulesDataArray: [ModuleGenesData] = []
            var moduleTypes: [String] = []
            
            for moduleType in self.geneModules.keys {
                if let genes = self.getModuleGenes(moduleType) {
                    modulesDataArray.append(ModuleGenesData(genes: genes))
                    moduleTypes.append(moduleType)
                }
            }
            
            return {
                "id": self.id,
                "modulesDataArray": modulesDataArray,
                "moduleTypes": moduleTypes,
                "initialSeed": self.initialSeed
            }
        }

        access(all) fun emitEvolutionProcessedEvent(processedSteps: UInt64, newAge: UFix64, evolutionPoints: UFix64) {
            emit EvolutionProcessed(creatureID: self.id, processedSteps: processedSteps, newAge: newAge, evolutionPoints: evolutionPoints)
        }

        // === METADATA VIEWS ===
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
                    return MetadataViews.Display(
                        name: self.name.concat(" #").concat(self.id.toString()),
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(url: self.thumbnail)
                    )
                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(self.id)
                case Type<MetadataViews.NFTCollectionData>():
                    return CreatureNFTCore.resolveContractView(resourceType: Type<@CreatureNFTCore.NFT>(), viewType: Type<MetadataViews.NFTCollectionData>())
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return CreatureNFTCore.resolveContractView(resourceType: Type<@CreatureNFTCore.NFT>(), viewType: Type<MetadataViews.NFTCollectionDisplay>())
            }
            return nil
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-CreatureNFTCore.createEmptyCollection(nftType: Type<@CreatureNFTCore.NFT>())
        }

        destroy() {
            destroy self.geneModules
        }
    }

    // === INTERFACES PÚBLICAS Y COLECCIÓN ===
    access(all) resource interface CollectionPublic {
        access(all) view fun getIDs(): [UInt64]
        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}?
        access(all) view fun borrowCreatureNFT(id: UInt64): &CreatureNFTCore.NFT?
        access(all) view fun getActiveCreatureIDs(): [UInt64]
        access(all) view fun getActiveCreatureCount(): UInt64
        access(all) fun attemptSexualReproduction(): @NFT?
    }

    access(all) resource Collection: NonFungibleToken.Collection, CollectionPublic {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}
        access(self) var activeCreatureIDs: [UInt64]

        init() {
            self.ownedNFTs <- {}
            self.activeCreatureIDs = []
        }

        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("Cannot withdraw NFT: token not found")
            
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

        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @CreatureNFTCore.NFT
            let id: UInt64 = token.id
            
            if token.estaViva {
                if UInt64(self.activeCreatureIDs.length) >= CreatureNFTCore.MAX_ACTIVE_CREATURES {
                    panic("Límite máximo de criaturas vivas alcanzado. No se puede depositar más criaturas vivas.")
                }
                
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

        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
        }

        access(all) view fun borrowCreatureNFT(id: UInt64): &CreatureNFTCore.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
                return ref as! &CreatureNFTCore.NFT
            }
            return nil
        }

        access(all) fun borrowCreatureNFTForUpdate(id: UInt64): auth(Mutate, Insert, Remove) &CreatureNFTCore.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as auth(Mutate, Insert, Remove) &{NonFungibleToken.NFT}?
                return ref as! auth(Mutate, Insert, Remove) &CreatureNFTCore.NFT
            }
            return nil
        }

        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@CreatureNFTCore.NFT>()] = true
            return supportedTypes
        }

        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@CreatureNFTCore.NFT>()
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-CreatureNFTCore.createEmptyCollection(nftType: Type<@CreatureNFTCore.NFT>())
        }

        access(all) view fun getActiveCreatureIDs(): [UInt64] {
            return self.activeCreatureIDs
        }

        access(all) view fun getActiveCreatureCount(): UInt64 {
            return UInt64(self.activeCreatureIDs.length)
        }

        access(all) fun markCreatureAsAlive(creatureID: UInt64) {
            let creatureRef = self.borrowCreatureNFT(id: creatureID)
                ?? panic("La criatura con ID ".concat(creatureID.toString()).concat(" no existe en esta colección"))
            
            if !creatureRef.estaViva {
                panic("No se puede marcar como viva una criatura que está muerta")
            }
            
            var found = false
            for id in self.activeCreatureIDs {
                if id == creatureID {
                    found = true
                    break
                }
            }
            
            if !found {
                if UInt64(self.activeCreatureIDs.length) < CreatureNFTCore.MAX_ACTIVE_CREATURES {
                    self.activeCreatureIDs.append(creatureID)
                } else {
                    panic("No se puede marcar la criatura como viva: límite máximo de criaturas vivas alcanzado")
                }
            }
        }

        access(all) fun markCreatureAsDead(creatureID: UInt64) {
            var i = 0
            while i < self.activeCreatureIDs.length {
                if self.activeCreatureIDs[i] == creatureID {
                    self.activeCreatureIDs.remove(at: i)
                    break
                }
                i = i + 1
            }
        }

        // === REPRODUCCIÓN SEXUAL EN COLECCIÓN ===
        access(all) fun attemptSexualReproduction(): @NFT? {
            if UInt64(self.activeCreatureIDs.length) < 2 {
                return nil
            }
            
            if UInt64(self.activeCreatureIDs.length) >= CreatureNFTCore.MAX_ACTIVE_CREATURES {
                return nil
            }
            
            let reproductionChance: UFix64 = 0.25
            let currentBlock = getCurrentBlock()
            let timestampFactor = UInt64(currentBlock.timestamp) % 1000000
            let randomSeed = currentBlock.height ^ timestampFactor
            let randomValue = UFix64(randomSeed % 100) / 100.0
            
            if randomValue > reproductionChance {
                return nil
            }
            
            var shuffledIDs = self.activeCreatureIDs
            let shuffleSeed = randomSeed ^ UInt64(self.activeCreatureIDs.length)
            var i = shuffledIDs.length - 1
            while i > 0 {
                let j = UInt64(shuffleSeed ^ UInt64(i)) % UInt64(i + 1)
                let temp = shuffledIDs[i]
                shuffledIDs[i] = shuffledIDs[Int(j)]
                shuffledIDs[Int(j)] = temp
                i = i - 1
            }
            
            let parent1ID = shuffledIDs[0]
            let parent2ID = shuffledIDs[1]
            
            let parent1Ref = self.borrowCreatureNFT(id: parent1ID) ?? panic("No se pudo encontrar la criatura padre 1")
            let parent2Ref = self.borrowCreatureNFT(id: parent2ID) ?? panic("No se pudo encontrar la criatura padre 2")
            
            let parent1Data = parent1Ref.getReproductionData()
            let parent2Data = parent2Ref.getReproductionData()
            
            let parent1Seed = parent1Data["initialSeed"] as! UInt64
            let parent2Seed = parent2Data["initialSeed"] as! UInt64
            let childSeed = parent1Seed ^ parent2Seed ^ randomSeed
            
            // Preparar contexto de reproducción sexual
            let reproductionContext: {String: AnyStruct} = {
                "parent1ID": parent1ID,
                "parent2ID": parent2ID,
                "reproductionTimestamp": currentBlock.timestamp
            }
            
            // Combinar módulos de ambos padres
            let childModules: @{String: IGeneModule} <- {}
            let parent1ModulesData = parent1Data["modulesDataArray"] as! [ModuleGenesData]
            let parent2ModulesData = parent2Data["modulesDataArray"] as! [ModuleGenesData]
            let parent1ModuleTypes = parent1Data["moduleTypes"] as! [String]
            let parent2ModuleTypes = parent2Data["moduleTypes"] as! [String]
            
            // Procesar módulos que existen en ambos padres
            var i = 0
            while i < parent1ModuleTypes.length {
                let moduleType = parent1ModuleTypes[i]
                
                // Buscar si este tipo también existe en padre 2
                var parent2Index: Int? = nil
                var j = 0
                while j < parent2ModuleTypes.length {
                    if parent2ModuleTypes[j] == moduleType {
                        parent2Index = j
                        break
                    }
                    j = j + 1
                }
                
                if parent2Index != nil {
                    // Verificar que el tipo de módulo esté registrado
                    if !CreatureNFTCore.registeredModuleTypes.containsKey(moduleType) {
                        panic("Tipo de módulo no registrado: ".concat(moduleType))
                    }
                    
                    // Obtener referencias a módulos de ambos padres
                    let parent1ModuleRef = &parent1Ref.geneModules[moduleType] as &IGeneModule?
                        ?? panic("No se pudo obtener referencia al módulo ".concat(moduleType).concat(" del padre 1"))
                    let parent2ModuleRef = &parent2Ref.geneModules[moduleType] as &IGeneModule?
                        ?? panic("No se pudo obtener referencia al módulo ".concat(moduleType).concat(" del padre 2"))
                    
                    // Obtener información del factory
                    let factoryInfo = CreatureNFTCore.moduleFactories[moduleType]
                        ?? panic("No se encontró factory para módulo tipo: ".concat(moduleType))
                    
                    let factoryAddress = factoryInfo["address"] as! Address
                    let contractName = factoryInfo["contractName"] as! String
                    
                    // Obtener referencia al contrato factory dinámicamente
                    let factoryAccount = getAccount(factoryAddress)
                    let factory = factoryAccount.contracts.borrow<&{IGeneModule.IModuleFactory}>(name: contractName)
                        ?? panic("No se pudo obtener referencia al factory ".concat(contractName).concat(" en ").concat(factoryAddress.toString()))
                    
                    // Crear módulo usando la interfaz común
                    let childModule <- factory.createModuleFromSexualReproduction(
                        parent1Module: parent1ModuleRef,
                        parent2Module: parent2ModuleRef,
                        childSeed: childSeed,
                        reproductionContext: reproductionContext
                    )
                    
                    let oldModule <- childModules[moduleType] <- childModule
                    destroy oldModule
                }
                
                i = i + 1
            }
            
            // Calcular esperanza de vida basada en genes del hijo (si tenemos módulo combat)
            var baseLifespan: UFix64 = 5.0 // Valor por defecto
            if let combatModule = &childModules["combat"] as &IGeneModule? {
                baseLifespan = combatModule.getGene("max_lifespan_dias_base") ?? 5.0
            }
            
            CreatureNFTCore.totalSupply = CreatureNFTCore.totalSupply + 1
            let newID = CreatureNFTCore.totalSupply
            
            let newCreature <- create NFT(
                id: newID,
                name: "",
                description: "",
                thumbnail: parent1Ref.thumbnail,
                birthBlockHeight: currentBlock.height,
                initialPuntosEvolucion: 15.0,
                lifespanDays: baseLifespan,
                initialEdadDiasCompletos: 0.0,
                initialEstaViva: true,
                initialSeed: childSeed,
                initialHomeostasisTargets: {},
                initialModules: <- childModules
            )
            
            emit SexualReproductionOccurred(parent1ID: parent1ID, parent2ID: parent2ID, childID: newID)
            return <-newCreature
        }

        destroy() {
            destroy self.ownedNFTs
        }
    }

    // === MINTER RESOURCE ===
    access(all) resource NFTMinter {
        access(all) fun createNFT(
            name: String,
            description: String,
            thumbnail: String,
            birthBlockHeight: UInt64,
            initialPuntosEvolucion: UFix64,
            lifespanDays: UFix64,
            initialEdadDiasCompletos: UFix64,
            initialEstaViva: Bool,
            initialSeed: UInt64,
            initialHomeostasisTargets: {String: UFix64},
            initialModules: @{String: IGeneModule}
        ): @NFT {
            CreatureNFTCore.totalSupply = CreatureNFTCore.totalSupply + 1
            let newID = CreatureNFTCore.totalSupply
            
            return <-create NFT(
                id: newID,
                name: name,
                description: description,
                thumbnail: thumbnail,
                birthBlockHeight: birthBlockHeight,
                initialPuntosEvolucion: initialPuntosEvolucion,
                lifespanDays: lifespanDays,
                initialEdadDiasCompletos: initialEdadDiasCompletos,
                initialEstaViva: initialEstaViva,
                initialSeed: initialSeed,
                initialHomeostasisTargets: initialHomeostasisTargets,
                initialModules: <-initialModules
            )
        }
    }

    // === FUNCIONES PÚBLICAS ===
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    access(all) fun registerModule(moduleType: String, contractAddress: Address, contractName: String) {
        // Solo el admin puede registrar - implementar verificación de permisos
        self.registeredModuleTypes[moduleType] = true
        self.moduleFactories[moduleType] = {
            "address": contractAddress,
            "contractName": contractName
        }
        emit ModuleRegistered(moduleType: moduleType, contractAddress: contractAddress)
    }

    access(all) fun unregisterModule(moduleType: String) {
        // Solo el admin puede desregistrar - implementar verificación de permisos
        self.registeredModuleTypes.remove(key: moduleType)
        self.moduleFactories.remove(key: moduleType)
        emit ModuleUnregistered(moduleType: moduleType)
    }

    access(all) view fun getRegisteredModules(): [String] {
        return self.registeredModuleTypes.keys
    }

    // === METADATA VIEWS ===
    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return [
            Type<MetadataViews.NFTCollectionData>(),
            Type<MetadataViews.NFTCollectionDisplay>()
        ]
    }

    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<MetadataViews.NFTCollectionData>():
                return MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&CreatureNFTCore.Collection>(),
                    publicLinkedType: Type<&CreatureNFTCore.Collection>(),
                    createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                        return <-CreatureNFTCore.createEmptyCollection(nftType: Type<@CreatureNFTCore.NFT>())
                    })
                )
            case Type<MetadataViews.NFTCollectionDisplay>():
                let media = MetadataViews.Media(
                    file: MetadataViews.HTTPFile(url: "https://example.com/creature_collection_banner.png"),
                    mediaType: "image/png"
                )
                return MetadataViews.NFTCollectionDisplay(
                    name: "Evolving Creatures Core",
                    description: "A collection of unique, evolving digital creatures with modular gene systems.",
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
        self.totalSupply = 0
        self.MAX_ACTIVE_CREATURES = 5

        // Constantes de mitosis (mismos valores que V6)
        self.MITOSIS_LIFESPAN_BASE_FACTOR = 0.4
        self.MITOSIS_LIFESPAN_EP_BONUS_FACTOR = 0.005
        self.MITOSIS_POTENCIAL_BASE_INHERITANCE_FACTOR = 0.75
        self.MITOSIS_POTENCIAL_EP_BONUS_FACTOR = 0.001

        // Inicializar registros de módulos
        self.registeredModuleTypes = {}
        self.moduleFactories = {}

        // Paths
        self.CollectionStoragePath = /storage/CreatureNFTCoreCollection
        self.CollectionPublicPath = /public/CreatureNFTCoreCollection
        self.MinterStoragePath = /storage/CreatureNFTCoreMinter

        // Crear y guardar minter
        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)

        // Publicar capability del minter
        self.account.capabilities.unpublish(/public/CreatureNFTCoreMinter)
        let minterCapability = self.account.capabilities.storage.issue<&CreatureNFTCore.NFTMinter>(self.MinterStoragePath)
        self.account.capabilities.publish(minterCapability, at: /public/CreatureNFTCoreMinter)

        emit ContractInitialized()
    }
} 