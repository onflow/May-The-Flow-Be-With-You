import "NonFungibleToken"
import "MetadataViews"
import "CreatureNFTV3"

// Esta transacción crea un nuevo NFT de criatura y lo deposita en la colección del usuario
// La criatura se crea sin nombre ni descripción definidos, el usuario puede actualizarlos después

transaction(
    thumbnail: String,
    initialGenesVisibles: {String: UFix64},
    initialGenesOcultos: {String: UFix64},
    initialPuntosEvolucion: UFix64,
    lifespanDays: UFix64
) {
    // Referencia al recurso Minter
    let minterRef: &CreatureNFTV3.NFTMinter
    // Referencia a la colección de NFTs del receptor
    let recipientCollectionRef: &CreatureNFTV3.Collection
    
    prepare(signer: auth(Storage) &Account) {
        // Verificar que el receptor tiene una colección
        if signer.storage.borrow<&CreatureNFTV3.Collection>(from: CreatureNFTV3.CollectionStoragePath) == nil {
            // Crear una colección vacía
            signer.storage.save(<-CreatureNFTV3.createEmptyCollection(nftType: Type<@CreatureNFTV3.NFT>()), to: CreatureNFTV3.CollectionStoragePath)
            
            // Crear enlace público
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic, CreatureNFTV3.CollectionPublic}>(CreatureNFTV3.CollectionStoragePath),
                at: CreatureNFTV3.CollectionPublicPath
            )
        }
        
        // Obtener referencia al Minter
        self.minterRef = signer.storage.borrow<&CreatureNFTV3.NFTMinter>(from: CreatureNFTV3.MinterStoragePath)
            ?? panic("El firmante no tiene acceso al recurso NFTMinter")
        
        // Obtener referencia a la colección del receptor
        self.recipientCollectionRef = signer.storage.borrow<&CreatureNFTV3.Collection>(from: CreatureNFTV3.CollectionStoragePath)
            ?? panic("No se pudo obtener referencia a la colección de NFTs")
    }
    
    execute {
        // Verificar que no se excede el límite de criaturas vivas
        if self.recipientCollectionRef.getActiveCreatureCount() >= CreatureNFTV3.MAX_ACTIVE_CREATURES {
            panic("No se puede crear más criaturas: se ha alcanzado el límite máximo de criaturas vivas (".concat(CreatureNFTV3.MAX_ACTIVE_CREATURES.toString()).concat(")"))
        }
        
        // Verificar valores de tiempo de vida
        if lifespanDays <= 0.0 || lifespanDays > 14.0 {
            panic("El tiempo de vida debe estar entre 0.1 y 14.0 días")
        }
        
        // Obtener bloque actual para timestamp
        let currentBlock = getCurrentBlock()
        
        // Crear un nuevo NFT
        let nft <- self.minterRef.createNFT(
            name: "", // Sin nombre predefinido
            description: "", // Sin descripción predefinida
            thumbnail: thumbnail,
            birthBlockHeight: currentBlock.height,
            initialGenesVisibles: initialGenesVisibles,
            initialGenesOcultos: initialGenesOcultos,
            initialPuntosEvolucion: initialPuntosEvolucion,
            lifespanDays: lifespanDays,
            initialEdadDiasCompletos: 0.0,
            initialEstaViva: true,
            initialHomeostasisTargets: {}
        )
        
        // Depositar el NFT en la colección del receptor
        self.recipientCollectionRef.deposit(token: <-nft)
        
        log("NFT de criatura creado y depositado en la colección")
    }
} 