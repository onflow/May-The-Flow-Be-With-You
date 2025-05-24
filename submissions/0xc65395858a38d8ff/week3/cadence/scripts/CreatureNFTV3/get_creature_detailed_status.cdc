import "CreatureNFTV3"

// Este script devuelve información detallada sobre una criatura específica
// Incluye datos de evolución, edad, estado vital, y capacidad reproductiva

pub fun main(userAddress: Address, creatureID: UInt64): {String: AnyStruct} {
    // Obtener referencia a la colección pública
    let collectionRef = getAccount(userAddress)
        .capabilities.get<&{CreatureNFTV3.CollectionPublic}>(CreatureNFTV3.CollectionPublicPath)
        .borrow() ?? panic("No se pudo obtener la colección pública")
    
    // Obtener referencia a la criatura específica
    let creatureRef = collectionRef.borrowCreatureNFT(id: creatureID)
        ?? panic("No se encontró la criatura con ID ".concat(creatureID.toString()))
    
    // Calcular cuánto tiempo ha pasado desde la última evolución procesada
    let currentTimestamp = getCurrentBlock().timestamp
    let timeSinceLastEvolution = currentTimestamp - creatureRef.lastEvolutionProcessedTimestamp
    
    // Número de criaturas activas en la colección
    let activeCreatureCount = collectionRef.getActiveCreatureCount()
    
    // Información reproductiva
    let canPerformMitosis = creatureRef.estaViva && 
                            creatureRef.puntosEvolucion >= 30.0 && 
                            activeCreatureCount < CreatureNFTV3.MAX_ACTIVE_CREATURES
    
    let canAttemptSexualReproduction = activeCreatureCount >= 2 && 
                                      activeCreatureCount < CreatureNFTV3.MAX_ACTIVE_CREATURES
    
    // Calcular tiempo de vida restante en días
    let remainingLifespan: UFix64 = creatureRef.estaViva ? 
                              creatureRef.lifespanTotalSimulatedDays - creatureRef.edadDiasCompletos : 
                              0.0
    
    // Información sobre cambios de semilla
    let seedChangeCount = creatureRef.homeostasisTargets["_seedChangeCount"] ?? 0.0
    let remainingSeedChanges = 3.0 - seedChangeCount
    
    // Datos sobre homeostasis
    let homeostasisTargets: {String: UFix64} = {}
    for key in creatureRef.homeostasisTargets.keys {
        // Solo incluir objetivos de homeostasis reales (no el contador de cambios de semilla)
        if key != "_seedChangeCount" {
            homeostasisTargets[key] = creatureRef.homeostasisTargets[key]!
        }
    }
    
    // Construir respuesta completa
    return {
        // Información básica
        "id": creatureID,
        "name": creatureRef.name,
        "description": creatureRef.description,
        "thumbnail": creatureRef.thumbnail,
        "isAlive": creatureRef.estaViva,
        
        // Información temporal
        "age": creatureRef.edadDiasCompletos,
        "lifespan": creatureRef.lifespanTotalSimulatedDays,
        "remainingLifespan": remainingLifespan,
        "birthTimestamp": creatureRef.birthTimestamp,
        "birthBlockHeight": creatureRef.birthBlockHeight,
        "lastEvolutionTimestamp": creatureRef.lastEvolutionProcessedTimestamp,
        "timeSinceLastEvolution": timeSinceLastEvolution,
        
        // Información vital
        "deathTimestamp": creatureRef.deathTimestamp,
        "deathBlockHeight": creatureRef.deathBlockHeight,
        
        // Información de evolución
        "evolutionPoints": creatureRef.puntosEvolucion,
        "genesVisibles": creatureRef.genesVisibles,
        "genesOcultos": creatureRef.genesOcultos,
        "homeostasisTargets": homeostasisTargets,
        
        // Información de semilla
        "initialSeed": creatureRef.initialSeed,
        "seedChangeCount": seedChangeCount,
        "remainingSeedChanges": remainingSeedChanges,
        
        // Información de reproducción
        "canPerformMitosis": canPerformMitosis,
        "canAttemptSexualReproduction": canAttemptSexualReproduction,
        "activeCreatureCount": activeCreatureCount,
        "maxActiveCreatures": CreatureNFTV3.MAX_ACTIVE_CREATURES
    }
} 