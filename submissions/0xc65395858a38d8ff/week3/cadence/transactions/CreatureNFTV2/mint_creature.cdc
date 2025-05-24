import "NonFungibleToken"
import "CreatureNFTV2"

// Esta transacción crea una nueva criatura NFT V2 y la deposita en la colección
// del firmante. Verifica que el usuario no haya alcanzado el límite de 5 criaturas vivas.

transaction(
    name: String,
    description: String,
    thumbnail: String,
    initialGenesVisibles: {String: UFix64},
    initialGenesOcultos: {String: UFix64},
    initialPuntosEvolucion: UFix64,
    lifespanDays: UFix64
) {
    // Referencia al recurso que permite crear criaturas
    let minterRef: &CreatureNFTV2.NFTMinter
    
    // Referencia a la colección del firmante
    let collectionRef: &CreatureNFTV2.Collection
    
    prepare(signer: auth(Storage) &Account) {
        // Obtener referencia al minter
        self.minterRef = signer.storage.borrow<&CreatureNFTV2.NFTMinter>(from: CreatureNFTV2.MinterStoragePath)
            ?? panic("No se pudo obtener referencia al minter. Asegúrate de que la cuenta tenga permisos para crear criaturas.")
        
        // Obtener referencia a la colección del firmante
        self.collectionRef = signer.storage.borrow<&CreatureNFTV2.Collection>(from: CreatureNFTV2.CollectionStoragePath)
            ?? panic("No se pudo obtener referencia a la colección. Asegúrate de que la cuenta esté configurada correctamente.")
        
        // Verificar que no se haya alcanzado el límite de criaturas vivas
        if self.collectionRef.getActiveCreatureCount() >= CreatureNFTV2.MAX_ACTIVE_CREATURES {
            panic("No se puede crear más criaturas. Ya has alcanzado el límite de 5 criaturas vivas.")
        }
    }
    
    execute {
        // Obtener bloque actual para nacimiento
        let currentBlock = getCurrentBlock()
        
        // Crear nueva criatura
        let newCreature <- self.minterRef.createNFT(
            name: name,
            description: description,
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
        
        // Depositar criatura en la colección del firmante
        self.collectionRef.deposit(token: <-newCreature)
        
        log("Nueva criatura ".concat(name).concat(" creada y depositada en la colección."))
    }
} 