import NonFungibleToken from "0xNonFungibleToken"
import CreatureNFTV6 from "0xCreatureNFTV6"
import MetadataViews from "0xMetadataViews"

// Este script devuelve información sobre todas las criaturas vivas en una colección
// Útil para mostrar las criaturas disponibles en la UI, incluyendo su miniatura y estado vital.

access(all) struct CreatureUIData {
    access(all) let id: UInt64
    access(all) let name: String
    access(all) let description: String
    access(all) let thumbnail: String // URL de la miniatura
    access(all) let estaViva: Bool
    access(all) let edadDiasCompletos: UFix64
    access(all) let lifespanTotalSimulatedDays: UFix64
    access(all) let puntosEvolucion: UFix64
    access(all) let genesVisibles: {String: UFix64}
    access(all) let genesOcultos: {String: UFix64}
    access(all) let homeostasisTargets: {String: UFix64}
    access(all) let birthTimestamp: UFix64
    access(all) let lastEvolutionProcessedTimestamp: UFix64

    init(
        id: UInt64,
        name: String,
        description: String,
        thumbnail: String,
        estaViva: Bool,
        edadDiasCompletos: UFix64,
        lifespanTotalSimulatedDays: UFix64,
        puntosEvolucion: UFix64,
        genesVisibles: {String: UFix64},
        genesOcultos: {String: UFix64},
        homeostasisTargets: {String: UFix64},
        birthTimestamp: UFix64,
        lastEvolutionProcessedTimestamp: UFix64
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.thumbnail = thumbnail
        self.estaViva = estaViva
        self.edadDiasCompletos = edadDiasCompletos
        self.lifespanTotalSimulatedDays = lifespanTotalSimulatedDays
        self.puntosEvolucion = puntosEvolucion
        // Crear una copia explícita del diccionario para evitar problemas de tipo
        self.genesVisibles = genesVisibles.copy()
        self.genesOcultos = genesOcultos.copy()
        self.homeostasisTargets = homeostasisTargets.copy()
        self.birthTimestamp = birthTimestamp
        self.lastEvolutionProcessedTimestamp = lastEvolutionProcessedTimestamp
    }
}

access(all) fun main(userAddress: Address): [CreatureUIData] {
    let account = getAuthAccount(userAddress)
    
    let collectionCap = account
        .capabilities.get<&{CreatureNFTV6.CollectionPublic}>(CreatureNFTV6.CollectionPublicPath)
        .borrow() ?? panic("No se pudo obtener la colección pública")
    
    // Obtener los IDs de criaturas activas
    let activeIDs = collectionCap.getActiveCreatureIDs()
    
    var creaturesData: [CreatureUIData] = []
    
    for id in activeIDs {
        let creature = collectionCap.borrowCreatureNFT(id: id) 
            ?? panic("No se pudo obtener la criatura con ID: ".concat(id.toString()))
        
        // Resolver la vista Display para obtener la miniatura
        let displayView = creature.resolveView(Type<MetadataViews.Display>()) 
            ?? panic("No se pudo resolver la vista Display para la criatura: ".concat(id.toString()))
        let display = displayView as! MetadataViews.Display
        let httpFile = display.thumbnail as! MetadataViews.HTTPFile

        // Crear y añadir el struct de datos
        creaturesData.append(
            CreatureUIData(
                id: creature.id,
                name: display.name, // Usar el nombre de la vista Display
                description: display.description, // Usar la descripción de la vista Display
                thumbnail: httpFile.url, // Usar la URL de la miniatura de la vista Display
                estaViva: creature.estaViva,
                edadDiasCompletos: creature.edadDiasCompletos,
                lifespanTotalSimulatedDays: creature.lifespanTotalSimulatedDays,
                puntosEvolucion: creature.puntosEvolucion,
                genesVisibles: creature.genesVisibles,
                genesOcultos: creature.genesOcultos,
                homeostasisTargets: creature.homeostasisTargets,
                birthTimestamp: creature.birthTimestamp,
                lastEvolutionProcessedTimestamp: creature.lastEvolutionProcessedTimestamp
            )
        )
    }
    
    return creaturesData
} 