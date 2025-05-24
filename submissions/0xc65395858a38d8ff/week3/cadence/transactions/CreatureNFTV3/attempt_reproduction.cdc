import "NonFungibleToken"
import "CreatureNFTV3"

// Esta transacción intenta una reproducción sexual entre criaturas aleatorias en la colección
// La reproducción sexual tiene una probabilidad de éxito del 25%
// Requiere al menos 2 criaturas vivas y no haber alcanzado el límite máximo de criaturas

transaction {
    // Referencia a la colección de NFTs del usuario
    let collectionRef: &CreatureNFTV3.Collection
    
    prepare(signer: auth(Storage) &Account) {
        // Obtener referencia a la colección
        self.collectionRef = signer.storage.borrow<auth(Storage) &CreatureNFTV3.Collection>(
            from: CreatureNFTV3.CollectionStoragePath
        ) ?? panic("No se pudo obtener referencia a la colección de criaturas")
    }
    
    execute {
        // Verificar que hay al menos 2 criaturas vivas
        if self.collectionRef.getActiveCreatureCount() < 2 {
            panic("Se requieren al menos 2 criaturas vivas para intentar reproducción sexual")
        }
        
        // Verificar que no se ha alcanzado el límite máximo
        if self.collectionRef.getActiveCreatureCount() >= CreatureNFTV3.MAX_ACTIVE_CREATURES {
            panic("No se puede intentar reproducción: se ha alcanzado el límite máximo de criaturas vivas")
        }
        
        // Intentar reproducción
        let childNFT <- self.collectionRef.attemptSexualReproduction()
        
        if childNFT == nil {
            panic("La reproducción no tuvo éxito en este intento. Puedes volver a intentarlo más tarde.")
        } else {
            // Depositar el nuevo NFT en la colección
            self.collectionRef.deposit(token: <-childNFT!)
            log("¡Reproducción exitosa! Se ha creado una nueva criatura")
        }
    }
} 