import FungibleToken from "0xFungibleToken"
import FlowToken from "0xFlowToken"
import NonFungibleToken from "0xNonFungibleToken"
import CreatureNFTV6 from "0xCreatureNFTV6"

// Esta transacción permite crear una nueva criatura pagando 0.1 Flow
// El pago va a la cuenta que tiene el Minter
// Los genes y atributos se generan aleatoriamente como en mint_creature.cdc

transaction() {
    // Referencia a la colección del usuario
    let collectionRef: &CreatureNFTV6.Collection
    
    // Referencia a la billetera del usuario para pagar
    let paymentVault: @{FungibleToken.Vault}
    
    // Referencia al Minter
    let minterRef: &CreatureNFTV6.NFTMinter
    
    // Referencia a la billetera del propietario del contrato para recibir el pago
    let recipientRef: &{FungibleToken.Receiver}

    // Variables para almacenar los atributos generados aleatoriamente (from mint_creature.cdc)
    let genesVisibles: {String: UFix64}
    let genesOcultos: {String: UFix64}
    let initialPuntosEvolucion: UFix64
    let lifespanDays: UFix64
    let thumbnailURL: String
    let contractOwnerAddress: Address // Dirección del dueño del contrato que tiene el Minter
    
    prepare(signer: auth(Storage, Capabilities) &Account) {
        self.contractOwnerAddress = 0x2444e6b4d9327f09 // Dirección del deployer (dueño del contrato)

        // Obtener información del bloque actual para generar aleatoriedad (from mint_creature.cdc)
        let currentBlock = getCurrentBlock()
        let blockHeight = currentBlock.height
        let timestamp = currentBlock.timestamp
        
        let blockHeightInt = Int(blockHeight)
        let timestampIntegerPart = UInt64(timestamp)
        let timestampFractionalPart = timestamp - UFix64(timestampIntegerPart)
        let timestampFractionalAsUInt64 = UInt64(timestampFractionalPart * 1000000.0)
        let timestampInt = Int(timestampIntegerPart) + Int(timestampFractionalAsUInt64)

        // Verificar que el receptor tiene una colección (from mint_creature.cdc)
        if signer.storage.borrow<&CreatureNFTV6.Collection>(from: CreatureNFTV6.CollectionStoragePath) == nil {
            signer.storage.save(<-CreatureNFTV6.createEmptyCollection(nftType: Type<@CreatureNFTV6.NFT>()), to: CreatureNFTV6.CollectionStoragePath)
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic, CreatureNFTV6.CollectionPublic}>(CreatureNFTV6.CollectionStoragePath),
                at: CreatureNFTV6.CollectionPublicPath
            )
            log("Colección de CreatureNFTV6 creada para el signer.")
        }
        
        // Obtener la colección del usuario
        self.collectionRef = signer.storage.borrow<auth(Storage) &CreatureNFTV6.Collection>(
            from: CreatureNFTV6.CollectionStoragePath
        ) ?? panic("No se pudo obtener referencia a la colección. Asegúrate de que la cuenta esté configurada correctamente.")
        
        // Verificar si hay espacio para otra criatura
        if self.collectionRef.getActiveCreatureCount() >= CreatureNFTV6.MAX_ACTIVE_CREATURES {
            panic("Límite máximo de criaturas vivas alcanzado (".concat(CreatureNFTV6.MAX_ACTIVE_CREATURES.toString()).concat("). No se puede crear más criaturas."))
        }
        
        // Obtener referencia a la billetera de Flow del usuario
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("No se pudo obtener referencia a la billetera de Flow")
        
        // Crear un pago de 0.1 Flow
        self.paymentVault <- vaultRef.withdraw(amount: 0.1)
        
        // Tomar prestada la capacidad pública del Minter de la cuenta del dueño del contrato
        self.minterRef = getAccount(self.contractOwnerAddress)
            .capabilities.borrow<&CreatureNFTV6.NFTMinter>(/public/CreatureNFTV6Minter)
            ?? panic("No se pudo obtener referencia al Minter desde la capacidad pública del dueño del contrato. Asegúrate de que la capacidad esté publicada en /public/CreatureNFTV6Minter en la cuenta ".concat(self.contractOwnerAddress.toString()))
            
        // Obtener referencia a la billetera del propietario del contrato
        self.recipientRef = getAccount(self.contractOwnerAddress)
            .capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("No se pudo obtener referencia a la billetera del propietario del contrato. Asegúrate de que esté configurada.")

        // Generar genes visibles aleatorios (from mint_creature.cdc)
        self.genesVisibles = {
            "colorR": UFix64( (timestampInt + blockHeightInt) % 256) / 255.0,
            "colorG": UFix64( (timestampInt / 2 + blockHeightInt * 2) % 256) / 255.0,
            "colorB": UFix64( (timestampInt * 2 + blockHeightInt / 2) % 256) / 255.0,
            "tamanoBase": 0.5 + (UFix64( (blockHeightInt + timestampInt) % 501) / 1000.0),
            "formaPrincipal": 1.0 + UFix64( (timestampInt + 77) % 5),
            "numApendices": UFix64( (blockHeightInt + 123) % 6),
            "patronMovimiento": 1.0 + UFix64( (timestampInt + blockHeightInt + 234) % 4)
        }
        
        // Calcular valores de genes ocultos (from mint_creature.cdc)
        let normTamanoBase = (self.genesVisibles["tamanoBase"]! - 0.5) * 2.0 
        let tendenciaTamanoPositiva = normTamanoBase > 0.5 ? (normTamanoBase - 0.5) * 2.0 : 0.0
        let tendenciaTamanoNegativa = normTamanoBase < 0.5 ? (0.5 - normTamanoBase) * 2.0 : 0.0
        let formaActual = self.genesVisibles["formaPrincipal"]! 
        let numApendicesActual = self.genesVisibles["numApendices"]! 
        let normNumApendices = numApendicesActual / 5.0
        
        self.genesOcultos = {
            "tasaMetabolica": 0.1 + (UFix64( (timestampInt + 300) % 900) / 1000.0),
            "fertilidad": 0.1 + (UFix64( (timestampInt + 450) % 900) / 1000.0),
            "potencialEvolutivo": 0.1 + (UFix64( (timestampInt + 600) % 900) / 1000.0),
            "max_lifespan_dias_base": 7.0,
            "puntosSaludMax": 50.0 + (tendenciaTamanoPositiva * 50.0) + (formaActual == 2.0 ? 25.0 : (formaActual == 4.0 ? 15.0 : 0.0)),
            "ataqueBase": 10.0 + (formaActual == 3.0 ? 15.0 : (formaActual == 5.0 ? 20.0 : 0.0)) + (normNumApendices * 20.0) + (tendenciaTamanoPositiva * 10.0),
            "defensaBase": 10.0 + (formaActual == 2.0 ? 15.0 : (formaActual == 4.0 ? 20.0 : 0.0)) + (tendenciaTamanoPositiva * 15.0),
            "agilidadCombate": 0.2 + (formaActual == 1.0 ? 0.3 : (formaActual == 5.0 ? 0.1 : 0.0)) + (tendenciaTamanoNegativa * 0.3)
        }
        
        self.initialPuntosEvolucion = 5.0 + (UFix64( (blockHeightInt + timestampInt) % 151) / 10.0)
        self.lifespanDays = 7.0 // Fijo como en mint_creature.cdc

        // Generar URL de miniatura aleatoria (ejemplo)
        let thumbnailOptions = [
            "https://i.imgur.com/0F0Z3pZ.png", // Placeholder 1
            "https://i.imgur.com/R3jYmPZ.png", // Placeholder 2
            "https://i.imgur.com/g6z4gYm.png"  // Placeholder 3
        ]
        self.thumbnailURL = thumbnailOptions[Int(nextRandom(seed: &randomSeed) % UInt64(thumbnailOptions.length))]
    }
    
    execute {
        // Depositar el pago en la cuenta del propietario del contrato
        self.recipientRef.deposit(from: <-self.paymentVault)
        
        // Crear la nueva criatura usando el minter con valores generados
        let newCreature <- self.minterRef.createNFT(
            name: "", // Nombre vacío como en mint_creature.cdc
            description: "", // Descripción vacía como en mint_creature.cdc
            thumbnail: self.thumbnailURL, // Thumbnail aleatorio
            birthBlockHeight: getCurrentBlock().height, // Usar currentBlock de prepare o aquí? mejor el de prepare
            initialGenesVisibles: self.genesVisibles,
            initialGenesOcultos: self.genesOcultos,
            initialPuntosEvolucion: self.initialPuntosEvolucion,
            lifespanDays: self.lifespanDays,
            initialEdadDiasCompletos: 0.0,
            initialEstaViva: true,
            initialHomeostasisTargets: {}
        )
        
        // Depositar la nueva criatura en la colección del usuario
        self.collectionRef.deposit(token: <-newCreature)
        
        log("¡Nueva criatura creada exitosamente con pago y genes aleatorios!")
        log("Puntos de Evolución iniciales: ".concat(self.initialPuntosEvolucion.toString()))
        log("Lifespan (días): ".concat(self.lifespanDays.toString()))
        log("Gen 'tamanoBase': ".concat(self.genesVisibles["tamanoBase"]!.toString()))
        log("Gen 'potencialEvolutivo': ".concat(self.genesOcultos["potencialEvolutivo"]!.toString()))
    }
} 