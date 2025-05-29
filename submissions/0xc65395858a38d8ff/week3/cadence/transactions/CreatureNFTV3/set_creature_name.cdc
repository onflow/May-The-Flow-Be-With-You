import "NonFungibleToken"
import "CreatureNFTV3"

// Esta transacción permite al usuario establecer o cambiar el nombre de una criatura
// Útil para nombrar criaturas recién nacidas por reproducción

transaction(creatureID: UInt64, newName: String) {
    // Referencia a la colección de NFTs del usuario
    let collectionRef: &CreatureNFTV3.Collection
    
    prepare(signer: auth(Storage) &Account) {
        // Obtener referencia a la colección
        self.collectionRef = signer.storage.borrow<auth(Storage) &CreatureNFTV3.Collection>(
            from: CreatureNFTV3.CollectionStoragePath
        ) ?? panic("No se pudo obtener referencia a la colección de criaturas")
        
        // Verificar que el nombre no está vacío
        if newName.length == 0 {
            panic("El nombre de la criatura no puede estar vacío")
        }
        
        // Verificar que el nombre no es demasiado largo
        if newName.length > 30 {
            panic("El nombre de la criatura es demasiado largo (máximo 30 caracteres)")
        }
    }
    
    execute {
        // Obtener referencia a la criatura
        let creatureRef = self.collectionRef.borrowCreatureNFTForUpdate(id: creatureID) 
            ?? panic("No se encontró la criatura con ID ".concat(creatureID.toString()))
        
        // Establecer el nuevo nombre (añadiendo al NFT la capacidad de cambiar nombre)
        creatureRef.updateDescription(newDescription: newName)
        
        log("Nombre de la criatura actualizado a: ".concat(newName))
    }
} 