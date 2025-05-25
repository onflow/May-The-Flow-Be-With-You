import "FungibleToken"
import "FlowToken"
import "NonFungibleToken"
import "MetadataViews"
import "CreatureNFTV5"

// Esta transacción permite crear una nueva criatura pagando 0.1 Flow
// El pago va a la cuenta que tiene el Minter
// Los genes y atributos se generan aleatoriamente como en mint_creature.cdc

transaction() {
    // Referencia a la colección del usuario
    let collectionRef: &CreatureNFTV5.Collection
    
    // Referencia a la billetera del usuario para pagar
    let paymentVault: @{FungibleToken.Vault}
    
    // Referencia al Minter
    let minterRef: &CreatureNFTV5.NFTMinter
    
    // Referencia a la billetera del propietario del contrato para recibir el pago
    let recipientRef: &{FungibleToken.Receiver}

    // Variables para almacenar los atributos generados aleatoriamente (from mint_creature.cdc)
    let genesVisibles: {String: UFix64}
    let genesOcultos: {String: UFix64}
    let initialPuntosEvolucion: UFix64
    let lifespanDays: UFix64
    
    prepare(signer: auth(Storage, FungibleToken.Withdraw, PublishCapability, IssueStorageCapabilityController) &Account) {
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
        if signer.storage.borrow<&CreatureNFTV5.Collection>(from: CreatureNFTV5.CollectionStoragePath) == nil {
            signer.storage.save(<-CreatureNFTV5.createEmptyCollection(nftType: Type<@CreatureNFTV5.NFT>()), to: CreatureNFTV5.CollectionStoragePath)
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic, CreatureNFTV5.CollectionPublic}>(CreatureNFTV5.CollectionStoragePath),
                at: CreatureNFTV5.CollectionPublicPath
            )
            log("Colección de CreatureNFTV5 creada para el signer.")
        }
        
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
        self.minterRef = signer.storage.borrow<&CreatureNFTV5.NFTMinter>(from: CreatureNFTV5.MinterStoragePath)
            ?? panic("No se pudo obtener referencia al Minter del firmante. Asegúrate de que el Minter esté en CreatureNFTV5.MinterStoragePath.")
            
        // Obtener referencia a la billetera del propietario del contrato
        self.recipientRef = getAccount(0x2444e6b4d9327f09)
            .capabilities
            .borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
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
    }
    
    execute {
        // Depositar el pago en la cuenta del propietario del contrato
        self.recipientRef.deposit(from: <-self.paymentVault)
        
        // Usar el thumbnail fijo de mint_creature.cdc
        let thumbnailURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzEyMzQ1NiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIj5FbGVtZW50YWwgU3RyaWtlcjwvdGV4dD48L3N2Zz4="

        // Crear la nueva criatura usando el minter con valores generados
        let newCreature <- self.minterRef.createNFT(
            name: "", // Nombre vacío como en mint_creature.cdc
            description: "", // Descripción vacía como en mint_creature.cdc
            thumbnail: thumbnailURL, // Thumbnail fijo
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