import EvolvingCreatureNFT from 0x2444e6b4d9327f09

// Esta transacción permite a un usuario realizar mitosis en una de sus criaturas modulares.
// La mitosis crea una nueva criatura a partir de una existente.
// Cuesta puntos de evolución (EP) al padre.

transaction(creatureID: UInt64, epCost: UFix64) {
    // Referencia a la colección de NFTs del usuario
    let collectionRef: auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.Collection
    
    prepare(signer: auth(Storage) &Account) {
        // Obtener referencia a la colección
        self.collectionRef = signer.storage.borrow<auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.Collection>(
            from: EvolvingCreatureNFT.CollectionStoragePath
        ) ?? panic("No se pudo obtener referencia a la colección de criaturas modulares")
        
        // Verificar que el costo de EP es razonable
        if epCost < 10.0 {
            panic("El costo mínimo de EP para mitosis es 10.0")
        }
    }
    
    execute {
        // Realizar mitosis
        let success = self.collectionRef.performMitosis(creatureID: creatureID, epCost: epCost)
        
        if !success {
            panic("No se pudo realizar mitosis. Verifica que la criatura esté viva, tenga suficientes EP, y que no se haya alcanzado el límite de criaturas")
        }
        
        log("¡Mitosis exitosa! Se ha creado una nueva criatura modular")
    }
} 