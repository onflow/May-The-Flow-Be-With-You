import "CreatureNFTV2"

// Este script devuelve información sobre la semilla inicial actual 
// y el estado de cambios de semilla de una criatura NFT V2.

pub fun main(ownerAddress: Address, nftID: UInt64): {String: AnyStruct} {
    // Obtener referencia a la colección pública del propietario
    let collectionRef = getAccount(ownerAddress)
        .getCapability(CreatureNFTV2.CollectionPublicPath)
        .borrow<&{CreatureNFTV2.CollectionPublic}>()
        ?? panic("No se pudo obtener referencia a la colección pública. Asegúrate de que la cuenta esté configurada correctamente.")
        
    // Obtener referencia a la criatura específica
    let creatureRef = collectionRef.borrowCreatureNFT(id: nftID)
        ?? panic("No se pudo obtener referencia a la criatura con ID ".concat(nftID.toString()))
    
    // Obtener contador de cambios de semilla del diccionario de homeostasis
    let seedChangeCount = creatureRef.homeostasisTargets["_seedChangeCount"] ?? 0.0
    let seedChangesRemaining = 3.0 - seedChangeCount
    
    // Preparar resultado
    let result: {String: AnyStruct} = {
        "creature_id": creatureRef.id,
        "name": creatureRef.name,
        "current_initial_seed": creatureRef.initialSeed,
        "seed_changes_made": UInt64(seedChangeCount),
        "seed_changes_remaining": UInt64(seedChangesRemaining),
        "evolution_points": creatureRef.puntosEvolucion,
        "has_enough_ep_for_change": creatureRef.puntosEvolucion >= 10.0,
        "can_change_seed": (seedChangeCount < 3.0) && (creatureRef.puntosEvolucion >= 10.0) && creatureRef.estaViva
    }
    
    return result
} 