import "EvolvingCreatureNFT"

// Script para obtener todas las criaturas activas del usuario
// Compatible con el nuevo sistema modular EvolvingCreatureNFT

access(all) struct CreatureUIData {
    access(all) let id: UInt64
    access(all) let name: String
    access(all) let description: String
    access(all) let thumbnail: String
    access(all) let estaViva: Bool
    access(all) let edadDiasCompletos: UFix64
    access(all) let lifespanTotalSimulatedDays: UFix64
    access(all) let puntosEvolucion: UFix64
    access(all) let initialSeed: UInt64
    access(all) let traitValues: {String: String?}
    access(all) let registeredModules: [String]

    init(
        id: UInt64,
        name: String,
        description: String,
        thumbnail: String,
        estaViva: Bool,
        edadDiasCompletos: UFix64,
        lifespanTotalSimulatedDays: UFix64,
        puntosEvolucion: UFix64,
        initialSeed: UInt64,
        traitValues: {String: String?},
        registeredModules: [String]
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.thumbnail = thumbnail
        self.estaViva = estaViva
        self.edadDiasCompletos = edadDiasCompletos
        self.lifespanTotalSimulatedDays = lifespanTotalSimulatedDays
        self.puntosEvolucion = puntosEvolucion
        self.initialSeed = initialSeed
        self.traitValues = traitValues
        self.registeredModules = registeredModules
    }
}

access(all) fun main(userAddress: Address): [CreatureUIData] {
    let account = getAccount(userAddress)
    
    let collectionCap = account
        .capabilities.get<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionPublicPath)
        .borrow() ?? panic("No se pudo obtener la colección pública")
    
    // Obtener los IDs de criaturas activas
    let activeIDs = collectionCap.getActiveCreatureIDs()
    
    var creaturesData: [CreatureUIData] = []
    
    for id in activeIDs {
        let creature = collectionCap.borrowEvolvingCreatureNFT(id: id) 
            ?? panic("No se pudo obtener la criatura con ID: ".concat(id.toString()))
        
        // Obtener valores de traits para todos los módulos registrados
        let traitValues: {String: String?} = {}
        let registeredModules = EvolvingCreatureNFT.getRegisteredModules()
        
        for moduleType in registeredModules {
            traitValues[moduleType] = creature.getTraitValue(traitType: moduleType)
        }

        // Crear y añadir el struct de datos
        creaturesData.append(
            CreatureUIData(
                id: creature.id,
                name: creature.name,
                description: creature.description,
                thumbnail: creature.thumbnail,
                estaViva: creature.estaViva,
                edadDiasCompletos: creature.edadDiasCompletos,
                lifespanTotalSimulatedDays: creature.lifespanTotalSimulatedDays,
                puntosEvolucion: creature.puntosEvolucion,
                initialSeed: creature.initialSeed,
                traitValues: traitValues,
                registeredModules: registeredModules
            )
        )
    }
    
    return creaturesData
} 