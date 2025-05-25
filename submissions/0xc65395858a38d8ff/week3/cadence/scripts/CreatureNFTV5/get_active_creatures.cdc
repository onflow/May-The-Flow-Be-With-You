import "CreatureNFTV5"

// Este script devuelve información sobre todas las criaturas vivas en una colección
// Útil para mostrar las criaturas disponibles para reproducción

access(all) fun main(userAddress: Address): [AnyStruct] {
    // Obtener referencia a la colección pública
    let collectionRef = getAccount(userAddress)
        .capabilities.get<&{CreatureNFTV5.CollectionPublic}>(CreatureNFTV5.CollectionPublicPath)
        .borrow() ?? panic("No se pudo obtener la colección pública")
    
    // Obtener los IDs de criaturas activas
    let activeIDs = collectionRef.getActiveCreatureIDs()
    
    // Crear array para almacenar datos de criaturas
    let creaturesData: [AnyStruct] = []
    
    // Obtener datos para cada criatura activa
    for id in activeIDs {
        let creatureRef = collectionRef.borrowCreatureNFT(id: id)
            ?? panic("No se encontró la criatura con ID ".concat(id.toString()))
        
        // Recopilar datos relevantes
        let creatureData: {String: AnyStruct} = {
            "id": id,
            "name": creatureRef.name,
            "description": creatureRef.description,
            "age": creatureRef.edadDiasCompletos,
            "lifespan": creatureRef.lifespanTotalSimulatedDays,
            "evolutionPoints": creatureRef.puntosEvolucion,
            "genesVisibles": creatureRef.genesVisibles,
            "initialSeed": creatureRef.initialSeed,
            "seedChangeCount": creatureRef.homeostasisTargets["_seedChangeCount"] ?? 0.0
        }
        
        creaturesData.append(creatureData)
    }
    
    return creaturesData
} 