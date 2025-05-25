import "NonFungibleToken"
import "CreatureNFTV6"

// Esta transacción permite a un usuario realizar mitosis en una de sus criaturas V6.
// La mitosis crea una nueva criatura a partir de una existente.
// Cuesta puntos de evolución (EP) al padre.

transaction(creatureID: UInt64, epCost: UFix64) {
    // Referencia a la colección de NFTs del usuario
    let collectionRef: &CreatureNFTV6.Collection
    
    prepare(signer: auth(Storage) &Account) {
        // Obtener referencia a la colección
        self.collectionRef = signer.storage.borrow<auth(Storage) &CreatureNFTV6.Collection>(
            from: CreatureNFTV6.CollectionStoragePath
        ) ?? panic("No se pudo obtener referencia a la colección de criaturas V6")
        
        // Verificar que el costo de EP es razonable (según la lógica de V5, podría ajustarse para V6)
        if epCost < 10.0 { // Assuming minimum cost remains 10.0; adjust if V6 has different logic
            panic("El costo mínimo de EP para mitosis es 10.0")
        }
    }
    
    execute {
        // Verificar que la colección no ha alcanzado el máximo de criaturas vivas
        if self.collectionRef.getActiveCreatureCount() >= CreatureNFTV6.MAX_ACTIVE_CREATURES {
            panic("No se puede realizar mitosis: se ha alcanzado el límite máximo de criaturas vivas")
        }
        
        // Obtener referencia a la criatura padre
        let parentRef = self.collectionRef.borrowCreatureNFTForUpdate(id: creatureID) 
            ?? panic("No se encontró la criatura con ID ".concat(creatureID.toString()))
        
        // Realizar mitosis
        let childNFT <- parentRef.performMitosis(epCost: epCost) 
            ?? panic("No se pudo realizar mitosis. Verifica que la criatura esté viva, tenga suficientes EP y que el costo sea adecuado.")
        
        // Depositar el nuevo NFT en la colección
        self.collectionRef.deposit(token: <-childNFT)
        
        log("Mitosis exitosa! Se ha creado una nueva criatura V6")
    }
} 