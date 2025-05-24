import "FungibleToken"
import "FlowToken"
import "NonFungibleToken"
import "CreatureNFTV5"

// Esta transacción permite crear una nueva criatura pagando 0.1 Flow
// El pago va a la cuenta que tiene el Minter

transaction(
    name: String,
    description: String,
    thumbnail: String
) {
    // Referencia a la colección del usuario
    let collectionRef: &CreatureNFTV5.Collection
    
    // Referencia a la billetera del usuario para pagar
    let paymentVault: @FungibleToken.Vault
    
    // Referencia al Minter
    let minterRef: &CreatureNFTV5.NFTMinter
    
    // Referencia a la billetera del propietario del contrato para recibir el pago
    let recipientRef: &{FungibleToken.Receiver}
    
    prepare(signer: auth(Storage, FungibleToken.Withdraw) &Account) {
        // Obtener la colección del usuario
        self.collectionRef = signer.storage.borrow<auth(Storage) &CreatureNFTV5.Collection>(
            from: CreatureNFTV5.CollectionStoragePath
        ) ?? panic("No se pudo obtener referencia a la colección. Asegúrate de que la cuenta esté configurada correctamente.")
        
        // Verificar si hay espacio para otra criatura
        if self.collectionRef.getActiveCreatureCount() >= CreatureNFTV5.MAX_ACTIVE_CREATURES {
            panic("Límite máximo de criaturas vivas alcanzado (".concat(CreatureNFTV5.MAX_ACTIVE_CREATURES.toString()).concat("). No se puede crear más criaturas."))
        }
        
        // Obtener referencia a la billetera de Flow del usuario
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("No se pudo obtener referencia a la billetera de Flow")
        
        // Crear un pago de 0.1 Flow
        self.paymentVault <- vaultRef.withdraw(amount: 0.1)
        
        // Obtener referencia al minter del contrato
        self.minterRef = getAccount(0x2444e6b4d9327f09)
            .storage
            .borrow<&CreatureNFTV5.NFTMinter>(from: CreatureNFTV5.MinterStoragePath)
            ?? panic("No se pudo obtener referencia al Minter. Es posible que no tengas permisos para usar el Minter.")
            
        // Obtener referencia a la billetera del propietario del contrato
        self.recipientRef = getAccount(0x2444e6b4d9327f09)
            .capabilities
            .borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("No se pudo obtener referencia a la billetera del propietario del contrato. Asegúrate de que esté configurada.")
    }
    
    execute {
        // Depositar el pago en la cuenta del propietario del contrato
        self.recipientRef.deposit(from: <-self.paymentVault)
        
        // Obtener el bloque actual para registrar el nacimiento
        let currentBlock = getCurrentBlock()
        
        // Valores iniciales para los genes visibles y ocultos (algo equilibrado)
        let genesVisibles: {String: UFix64} = {
            "colorR": 0.5,
            "colorG": 0.5,
            "colorB": 0.5,
            "tamanoBase": 1.0,
            "formaPrincipal": 2.0, // Valor medio
            "numApendices": 4.0,   // Valor medio
            "patronMovimiento": 2.0 // Valor medio
        }
        
        let genesOcultos: {String: UFix64} = {
            "tasaMetabolica": 1.0,
            "fertilidad": 0.5,
            "potencialEvolutivo": 1.0,
            "max_lifespan_dias_base": 5.0, // Vida media
            "puntosSaludMax": 100.0,
            "ataqueBase": 15.0,
            "defensaBase": 15.0,
            "agilidadCombate": 1.0
        }
        
        // Crear la nueva criatura usando el minter
        let newCreature <- self.minterRef.createNFT(
            name: name,
            description: description,
            thumbnail: thumbnail,
            birthBlockHeight: currentBlock.height,
            initialGenesVisibles: genesVisibles,
            initialGenesOcultos: genesOcultos,
            initialPuntosEvolucion: 10.0,
            lifespanDays: 5.0,
            initialEdadDiasCompletos: 0.0,
            initialEstaViva: true,
            initialHomeostasisTargets: {}
        )
        
        // Depositar la nueva criatura en la colección del usuario
        self.collectionRef.deposit(token: <-newCreature)
        
        log("¡Nueva criatura creada exitosamente!")
    }
} 