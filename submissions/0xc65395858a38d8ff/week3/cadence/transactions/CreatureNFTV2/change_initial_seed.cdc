import "NonFungibleToken"
import "CreatureNFTV2"

// Esta transacción permite al propietario cambiar la semilla inicial de su criatura.
// Solo se permite un máximo de 3 cambios durante la vida de la criatura y cada cambio cuesta 10 puntos de evolución.
// Esta funcionalidad permite al usuario influir en la trayectoria evolutiva de su criatura al cambiar la semilla
// que determina cómo evolucionarán sus genes con el tiempo.

transaction(nftID: UInt64, newSeedBase: UInt64) {
    // Referencia al NFT que se va a actualizar
    let nftRef: &CreatureNFTV2.NFT
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Obtener referencia a la colección del firmante
        let collectionRef = signer.storage.borrow<&CreatureNFTV2.Collection>(from: CreatureNFTV2.CollectionStoragePath)
            ?? panic("No se pudo obtener referencia a la colección. Asegúrate de que la cuenta esté configurada correctamente.")
            
        // Obtener referencia a la criatura específica
        self.nftRef = collectionRef.borrowCreatureNFT(id: nftID)
            ?? panic("No se pudo obtener referencia a la criatura con ID ".concat(nftID.toString()))
    }
    
    execute {
        // Verificar si la criatura está viva
        if !self.nftRef.estaViva {
            panic("No se puede cambiar la semilla de una criatura que no está viva.")
        }
        
        // Intentar cambiar la semilla
        let success = self.nftRef.changeInitialSeed(newSeedBase: newSeedBase)
        
        if !success {
            // Obtener contador de cambios actual
            let seedChangeCount = self.nftRef.homeostasisTargets["_seedChangeCount"] ?? 0.0
            
            if seedChangeCount >= 3.0 {
                panic("Esta criatura ya ha alcanzado el límite máximo de 3 cambios de semilla.")
            } else {
                panic("No hay suficientes puntos de evolución. Se requieren 10 EP para cambiar la semilla.")
            }
        }
        
        // Obtener contador actualizado
        let currentChangeCount = self.nftRef.homeostasisTargets["_seedChangeCount"] ?? 0.0
        
        log("Semilla inicial cambiada con éxito para la criatura ".concat(self.nftRef.id.toString()))
        log("Nueva semilla base: ".concat(self.nftRef.initialSeed.toString()))
        log("Cambios de semilla realizados: ".concat(UInt64(currentChangeCount).toString()).concat("/3"))
        log("Puntos de evolución restantes: ".concat(self.nftRef.puntosEvolucion.toString()))
    }
} 