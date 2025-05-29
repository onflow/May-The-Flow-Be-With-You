import "CreatureNFTV3"

// Este script devuelve información sobre el estado reproductivo de una criatura
// Informa EP disponible, costo mínimo para mitosis, y más

pub fun main(userAddress: Address, creatureID: UInt64): {String: AnyStruct} {
    // Obtener referencia a la colección pública
    let collectionRef = getAccount(userAddress)
        .capabilities.get<&{CreatureNFTV3.CollectionPublic}>(CreatureNFTV3.CollectionPublicPath)
        .borrow() ?? panic("No se pudo obtener la colección pública")
    
    // Obtener referencia a la criatura específica
    let creatureRef = collectionRef.borrowCreatureNFT(id: creatureID)
        ?? panic("No se encontró la criatura con ID ".concat(creatureID.toString()))
    
    // Número de criaturas activas en la colección
    let activeCreatureCount = collectionRef.getActiveCreatureCount()
    
    // Obtener EP actuales
    let currentEP = creatureRef.puntosEvolucion
    
    // Costo mínimo para mitosis
    let minEPForMitosis: UFix64 = 30.0
    
    // Verificar si está viva
    let isAlive = creatureRef.estaViva
    
    // Verificar si puede hacer mitosis (suficientes EP y está viva)
    let canPerformMitosis = isAlive && currentEP >= minEPForMitosis && activeCreatureCount < CreatureNFTV3.MAX_ACTIVE_CREATURES
    
    // Verificar reproducción sexual (necesita al menos 2 criaturas vivas)
    let canAttemptSexualReproduction = activeCreatureCount >= 2 && activeCreatureCount < CreatureNFTV3.MAX_ACTIVE_CREATURES
    
    return {
        "id": creatureID,
        "isAlive": isAlive,
        "currentEP": currentEP,
        "minEPForMitosis": minEPForMitosis,
        "canPerformMitosis": canPerformMitosis,
        "activeCreatureCount": activeCreatureCount,
        "maxActiveCreatures": CreatureNFTV3.MAX_ACTIVE_CREATURES,
        "canAttemptSexualReproduction": canAttemptSexualReproduction
    }
} 