import "NonFungibleToken"
import "EvolvingCreatureNFT"

// Esta transacción configura una cuenta para usar EvolvingCreatureNFT
// Crea una colección vacía y la guarda en el storage de la cuenta
// También establece links públicos para que otros puedan depositar criaturas

transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Verificar si la colección ya existe
        if signer.storage.borrow<&EvolvingCreatureNFT.Collection>(from: EvolvingCreatureNFT.CollectionStoragePath) == nil {
            // Crear una colección vacía
            let collection <- EvolvingCreatureNFT.createEmptyCollection(nftType: Type<@EvolvingCreatureNFT.NFT>())
            
            // Guardar la colección en el storage
            signer.storage.save(<-collection, to: EvolvingCreatureNFT.CollectionStoragePath)

            // Crear un link público para la colección
            let cap = signer.capabilities.storage.issue<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionStoragePath)
            signer.capabilities.publish(cap, at: EvolvingCreatureNFT.CollectionPublicPath)
            
            log("Cuenta configurada para usar EvolvingCreatureNFT")
        } else {
            log("La cuenta ya está configurada para usar EvolvingCreatureNFT")
        }
    }
} 