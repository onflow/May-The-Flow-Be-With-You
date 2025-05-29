import "NonFungibleToken"
import "CreatureNFTV3"

// Esta transacción configura una cuenta para poder recibir NFTs de criaturas evolutivas V3
// Crea una Collection vacía y la guarda en el storage de la cuenta
// También crea un enlace público para que otros puedan depositar NFTs en esta colección

transaction {
    prepare(signer: auth(Storage) &Account) {
        // Verificar si ya existe una colección
        if signer.storage.borrow<&CreatureNFTV3.Collection>(from: CreatureNFTV3.CollectionStoragePath) != nil {
            log("La colección ya existe. No se requiere configuración adicional.")
            return
        }
        
        // Crear una nueva colección vacía
        let collection <- CreatureNFTV3.createEmptyCollection(nftType: Type<@CreatureNFTV3.NFT>())
        
        // Guardar la colección en el almacenamiento
        signer.storage.save(<-collection, to: CreatureNFTV3.CollectionStoragePath)
        
        // Crear un enlace público a la colección con capacidad de Receiver
        signer.capabilities.publish(
            signer.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic, CreatureNFTV3.CollectionPublic}>(CreatureNFTV3.CollectionStoragePath),
            at: CreatureNFTV3.CollectionPublicPath
        )
        
        log("Cuenta configurada para recibir criaturas evolutivas NFT V3")
    }
} 