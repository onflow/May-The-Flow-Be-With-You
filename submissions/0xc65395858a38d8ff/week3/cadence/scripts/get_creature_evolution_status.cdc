import "CreatureNFTV2"

// Este script obtiene el estado evolutivo de una criatura NFT,
// incluyendo sus genes actuales, objetivos de homeostasis y progreso.

pub struct CreatureEvolutionStatus {
    pub let id: UInt64
    pub let name: String
    pub let age: UFix64
    pub let maxLifespan: UFix64
    pub let evolutionPoints: UFix64
    pub let isAlive: Bool
    pub let lastProcessedTimestamp: UFix64
    pub let genesVisibles: {String: UFix64}
    pub let genesOcultos: {String: UFix64}
    pub let homeostasisTargets: {String: UFix64}
    pub let evolutionProgress: {String: UFix64} // Progreso hacia los objetivos (0.0-1.0)

    init(
        id: UInt64,
        name: String,
        age: UFix64,
        maxLifespan: UFix64,
        evolutionPoints: UFix64,
        isAlive: Bool,
        lastProcessedTimestamp: UFix64,
        genesVisibles: {String: UFix64},
        genesOcultos: {String: UFix64},
        homeostasisTargets: {String: UFix64}
    ) {
        self.id = id
        self.name = name
        self.age = age
        self.maxLifespan = maxLifespan
        self.evolutionPoints = evolutionPoints
        self.isAlive = isAlive
        self.lastProcessedTimestamp = lastProcessedTimestamp
        self.genesVisibles = genesVisibles
        self.genesOcultos = genesOcultos
        self.homeostasisTargets = homeostasisTargets
        
        // Calcular progreso de evolución (diferencia con objetivos)
        self.evolutionProgress = {}
        
        for geneName in homeostasisTargets.keys {
            if genesVisibles[geneName] != nil {
                let currentValue = genesVisibles[geneName]!
                let targetValue = homeostasisTargets[geneName]!
                let differenceAbs = (targetValue - currentValue).abs()
                
                // Convertir diferencia a progreso de 0.0 a 1.0
                // 0.0 = muy lejos del objetivo, 1.0 = objetivo alcanzado
                let progress = differenceAbs < 0.01 ? 1.0 : (1.0 - min(differenceAbs, 1.0))
                self.evolutionProgress[geneName] = progress
            }
        }
    }
}

pub fun main(ownerAddress: Address, creatureID: UInt64): CreatureEvolutionStatus {
    // Acceder a la colección pública
    let collection = getAccount(ownerAddress)
        .capabilities.borrow<&{CreatureNFTV2.CollectionPublic}>(CreatureNFTV2.CollectionPublicPath)
        ?? panic("No se pudo acceder a la colección pública en la dirección ".concat(ownerAddress.toString()))
    
    // Obtener referencia al NFT
    let creature = collection.borrowCreatureNFT(id: creatureID)
        ?? panic("No se pudo encontrar la criatura con ID ".concat(creatureID.toString()))
    
    // Devolver el estado de evolución
    return CreatureEvolutionStatus(
        id: creature.id,
        name: creature.name,
        age: creature.edadDiasCompletos,
        maxLifespan: creature.lifespanTotalSimulatedDays,
        evolutionPoints: creature.puntosEvolucion,
        isAlive: creature.estaViva,
        lastProcessedTimestamp: creature.lastEvolutionProcessedTimestamp,
        genesVisibles: creature.genesVisibles,
        genesOcultos: creature.genesOcultos,
        homeostasisTargets: creature.homeostasisTargets
    )
} 