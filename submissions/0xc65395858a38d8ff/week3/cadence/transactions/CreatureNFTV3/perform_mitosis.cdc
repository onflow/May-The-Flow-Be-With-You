import "NonFungibleToken"
import "CreatureNFTV3"

// Esta transacción permite a un usuario realizar mitosis en una de sus criaturas
// La mitosis crea una nueva criatura a partir de una existente, con vida reducida
// Cuesta puntos de evolución (EP) al padre

transaction(creatureID: UInt64, epCost: UFix64) {
    // Referencia a la colección de NFTs del usuario
    let collectionRef: &CreatureNFTV3.Collection
    
    prepare(signer: auth(Storage) &Account) {
        // Obtener referencia a la colección
        self.collectionRef = signer.storage.borrow<auth(Storage) &CreatureNFTV3.Collection>(
            from: CreatureNFTV3.CollectionStoragePath
        ) ?? panic("No se pudo obtener referencia a la colección de criaturas")
        
        // Verificar que el costo de EP es razonable
        if epCost < 30.0 {
            panic("El costo mínimo de EP para mitosis es 30.0")
        }
    }
    
    execute {
        // Verificar que la colección no ha alcanzado el máximo de criaturas vivas
        if self.collectionRef.getActiveCreatureCount() >= CreatureNFTV3.MAX_ACTIVE_CREATURES {
            panic("No se puede realizar mitosis: se ha alcanzado el límite máximo de criaturas vivas")
        }
        
        // Obtener referencia a la criatura padre
        let parentRef = self.collectionRef.borrowCreatureNFTForUpdate(id: creatureID) 
            ?? panic("No se encontró la criatura con ID ".concat(creatureID.toString()))
        
        // Realizar mitosis
        let childNFT <- parentRef.performMitosis(epCost: epCost) 
            ?? panic("No se pudo realizar mitosis. Verifica que la criatura esté viva y tenga suficientes EP")
        
        // Depositar el nuevo NFT en la colección
        self.collectionRef.deposit(token: <-childNFT)
        
        log("Mitosis exitosa! Se ha creado una nueva criatura")
    }
} 