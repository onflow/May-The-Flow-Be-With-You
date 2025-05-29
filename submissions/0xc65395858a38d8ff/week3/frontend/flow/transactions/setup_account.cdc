import "NonFungibleToken"
import "CreatureNFTV6"

// Esta transacción configura una cuenta para usar CreatureNFTV6
// Crea una colección vacía y la guarda en el storage de la cuenta
// También establece links públicos para que otros puedan depositar criaturas

transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Verificar si la colección ya existe
        if signer.storage.borrow<auth(Storage) &CreatureNFTV6.Collection>(from: CreatureNFTV6.CollectionStoragePath) == nil {
            // Crear una colección vacía
            let collection <- CreatureNFTV6.createEmptyCollection(nftType: Type<@CreatureNFTV6.NFT>())
            
            // Guardar la colección en el storage
            signer.storage.save(<-collection, to: CreatureNFTV6.CollectionStoragePath)

            // Crear un link público para la colección
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic, CreatureNFTV6.CollectionPublic}>(
                    CreatureNFTV6.CollectionStoragePath
                ),
                at: CreatureNFTV6.CollectionPublicPath
            )
            
            log("Cuenta configurada para usar CreatureNFTV6")
        } else {
            log("La cuenta ya está configurada para usar CreatureNFTV6")
        }
    }
} 