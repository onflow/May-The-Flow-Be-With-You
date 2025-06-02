import "NonFungibleToken"
import "CreatureNFTV6"

// Esta transacción permite a un usuario realizar mitosis en una de sus criaturas
// La mitosis crea una nueva criatura a partir de una existente, con vida reducida
// Cuesta puntos de evolución (EP) al padre

transaction(parentID: UInt64, epCost: UFix64) {
    // Referencia a la colección de NFTs del usuario
    let collectionRef: &CreatureNFTV6.Collection
    let newCreature: @CreatureNFTV6.NFT?
    
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Obtener referencia a la colección
        self.collectionRef = signer.storage.borrow<auth(Storage) &CreatureNFTV6.Collection>(
            from: CreatureNFTV6.CollectionStoragePath
        ) ?? panic("No se pudo obtener la colección del signer. Asegúrate de que la cuenta esté configurada.")
        
        // Verificar límite de criaturas activas antes de intentar la mitosis
        // Esto evita gastar EP si no se puede depositar el hijo.
        if self.collectionRef.getActiveCreatureCount() >= CreatureNFTV6.MAX_ACTIVE_CREATURES {
            panic("Límite máximo de criaturas vivas alcanzado. No se puede realizar mitosis si no hay espacio para el hijo.")
        }
        
        // Verificar que el costo de EP es razonable
        if epCost < 10.0 {
            panic("El costo mínimo de EP para mitosis es 10.0")
        }
    }
    
    execute {
        // Obtener referencia a la criatura padre
        let parentRef = self.collectionRef.borrowCreatureNFTForUpdate(id: parentID) 
            ?? panic("No se pudo encontrar la criatura padre con ID: ".concat(parentID.toString()))
        
        // Realizar mitosis
        self.newCreature <- parentRef.performMitosis(epCost: epCost)
        
        if self.newCreature == nil {
            log("Mitosis falló. La criatura podría no estar viva o no tener suficientes EP.")
        } else {
            log("Mitosis exitosa. Nueva criatura creada con ID: ".concat(self.newCreature!.id.toString()))
        }
    }

    post {
        if let child <- self.newCreature {
            self.collectionRef.deposit(token: <-child)
            log("Nueva criatura depositada en la colección.")
        } else {
            log("No se creó ninguna criatura nueva, no se depositó nada.")
        }
    }
} 