import "NonFungibleToken"
import "CreatureNFTV5"

// Esta transacción fuerza una prueba de reproducción sexual entre dos criaturas aleatorias
// Solo para propósitos de prueba

transaction() {
    // Referencia a la colección de NFTs del usuario
    let collectionRef: &CreatureNFTV5.Collection
    
    prepare(signer: auth(Storage) &Account) {
        // Obtener referencia a la colección
        self.collectionRef = signer.storage.borrow<auth(Storage) &CreatureNFTV5.Collection>(
            from: CreatureNFTV5.CollectionStoragePath
        ) ?? panic("No se pudo obtener referencia a la colección de criaturas")
    }
    
    execute {
        // Verificar que haya al menos 2 criaturas vivas
        if self.collectionRef.getActiveCreatureCount() < 2 {
            panic("Se necesitan al menos 2 criaturas vivas para la reproducción sexual")
        }
        
        // Verificar que no se exceda el límite máximo
        if self.collectionRef.getActiveCreatureCount() >= CreatureNFTV5.MAX_ACTIVE_CREATURES {
            panic("Ya se ha alcanzado el límite máximo de criaturas vivas (".concat(CreatureNFTV5.MAX_ACTIVE_CREATURES.toString()).concat(")"))
        }
        
        // Intentar reproducción sexual directamente
        let potentialChildNFT <- self.collectionRef.attemptSexualReproduction()
        
        if potentialChildNFT != nil {
            let actualChildNFT <- potentialChildNFT!
            let childID = actualChildNFT.id
            self.collectionRef.deposit(token: <-actualChildNFT)
            log("¡Reproducción sexual exitosa! Se ha creado la criatura #".concat(childID.toString()))
        } else {
            destroy potentialChildNFT
            log("La reproducción sexual falló. Intenta nuevamente.")
        }
    }
} 