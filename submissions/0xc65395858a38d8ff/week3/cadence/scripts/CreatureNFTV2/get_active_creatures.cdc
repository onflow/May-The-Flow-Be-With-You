import "CreatureNFTV2"

// Este script devuelve información sobre las criaturas activas (vivas) de un usuario
// incluyendo el número total y los IDs.

pub struct ActiveCreaturesInfo {
    pub let ownerAddress: Address
    pub let activeCreatureIDs: [UInt64]
    pub let activeCreatureCount: UInt64
    pub let maxActiveCreatures: UInt64
    pub let hasReachedMaxActiveCreatures: Bool

    init(
        ownerAddress: Address,
        activeCreatureIDs: [UInt64],
        activeCreatureCount: UInt64,
        maxActiveCreatures: UInt64
    ) {
        self.ownerAddress = ownerAddress
        self.activeCreatureIDs = activeCreatureIDs
        self.activeCreatureCount = activeCreatureCount
        self.maxActiveCreatures = maxActiveCreatures
        self.hasReachedMaxActiveCreatures = activeCreatureCount >= maxActiveCreatures
    }
}

pub fun main(ownerAddress: Address): ActiveCreaturesInfo {
    // Obtener referencia a la colección pública del propietario
    let collectionRef = getAccount(ownerAddress)
        .getCapability(CreatureNFTV2.CollectionPublicPath)
        .borrow<&{CreatureNFTV2.CollectionPublic}>()
        ?? panic("No se pudo obtener referencia a la colección pública. Asegúrate de que la cuenta esté configurada correctamente.")
    
    // Obtener IDs de criaturas activas
    let activeCreatureIDs = collectionRef.getActiveCreatureIDs()
    let activeCreatureCount = collectionRef.getActiveCreatureCount()
    
    return ActiveCreaturesInfo(
        ownerAddress: ownerAddress,
        activeCreatureIDs: activeCreatureIDs,
        activeCreatureCount: activeCreatureCount,
        maxActiveCreatures: CreatureNFTV2.MAX_ACTIVE_CREATURES
    )
} 