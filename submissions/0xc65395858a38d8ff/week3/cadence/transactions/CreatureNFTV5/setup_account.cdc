import "NonFungibleToken"
import "CreatureNFTV5"

// Esta transacción configura una cuenta para usar CreatureNFTV5
// Crea una colección vacía y la guarda en el storage de la cuenta
// También establece links públicos para que otros puedan depositar criaturas

transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Verificar si la colección ya existe
        if signer.storage.borrow<auth(Storage) &CreatureNFTV5.Collection>(from: CreatureNFTV5.CollectionStoragePath) == nil {
            // Crear una colección vacía
            let collection <- CreatureNFTV5.createEmptyCollection(nftType: Type<@CreatureNFTV5.NFT>())
            
            // Guardar la colección en el storage
            signer.storage.save(<-collection, to: CreatureNFTV5.CollectionStoragePath)

            // Crear un link público para la colección
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic, CreatureNFTV5.CollectionPublic}>(
                    CreatureNFTV5.CollectionStoragePath
                ),
                at: CreatureNFTV5.CollectionPublicPath
            )
            
            log("Cuenta configurada para usar CreatureNFTV5")
        } else {
            log("La cuenta ya está configurada para usar CreatureNFTV5")
        }
    }
} 