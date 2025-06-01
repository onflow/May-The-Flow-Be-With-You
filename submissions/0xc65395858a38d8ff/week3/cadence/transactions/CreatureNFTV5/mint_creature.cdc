import "NonFungibleToken"
import "MetadataViews"
import "CreatureNFTV5"

// Esta transacción crea un nuevo NFT de criatura con genes aleatorios y lo deposita en la colección del usuario
// Genera automáticamente genes visibles y ocultos basados en la información del bloque actual
// La criatura se crea sin nombre ni descripción definidos, el usuario puede actualizarlos después

transaction {
    // Referencia al recurso Minter
    let minterRef: &CreatureNFTV5.NFTMinter
    // Referencia a la colección de NFTs del receptor
    let recipientCollectionRef: &CreatureNFTV5.Collection
    
    // Variables para almacenar los atributos generados aleatoriamente
    let genesVisibles: {String: UFix64}
    let genesOcultos: {String: UFix64}
    let initialPuntosEvolucion: UFix64
    let lifespanDays: UFix64
    
    prepare(signer: auth(BorrowValue, Storage, SaveValue, PublishCapability, StorageCapabilities, IssueStorageCapabilityController) &Account) {
        // Obtener información del bloque actual para generar aleatoriedad
        let currentBlock = getCurrentBlock()
        let blockHeight = currentBlock.height
        let timestamp = currentBlock.timestamp
        
        // Conversiones para evitar errores de tipo y generar rangos más amplios
        let blockHeightInt = Int(blockHeight)
        
        // Generar un entero a partir del timestamp, incorporando partes fraccionarias de forma segura
        let timestampIntegerPart = UInt64(timestamp) // Trunca los decimales (e.g., 123.456 -> 123)
        let timestampFractionalPart = timestamp - UFix64(timestampIntegerPart) // Obtiene la parte fraccionaria (e.g., 0.456)
        // Multiplicar la parte fraccionaria para convertirla en un entero significativo (e.g., 0.456 * 1000000.0 -> 456000.0)
        // El resultado de (fractionalPart * 1_000_000.0) será un UFix64 < 1_000_000.0, que es seguro para UInt64()
        let timestampFractionalAsUInt64 = UInt64(timestampFractionalPart * 1000000.0) 
        
        // Combinar las partes. Sumar como Int para asegurar que el resultado final sea Int.
        // `Int(timestampIntegerPart)` es seguro ya que timestamps actuales caben en Int.
        // `Int(timestampFractionalAsUInt64)` es seguro ya que es < 1_000_000.
        let timestampInt = Int(timestampIntegerPart) + Int(timestampFractionalAsUInt64)
        
        // Verificar que el receptor tiene una colección
        if signer.storage.borrow<&CreatureNFTV5.Collection>(from: CreatureNFTV5.CollectionStoragePath) == nil {
            // Crear una colección vacía
            signer.storage.save(<-CreatureNFTV5.createEmptyCollection(nftType: Type<@CreatureNFTV5.NFT>()), to: CreatureNFTV5.CollectionStoragePath)
            
            // Crear enlace público
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic, CreatureNFTV5.CollectionPublic}>(CreatureNFTV5.CollectionStoragePath),
                at: CreatureNFTV5.CollectionPublicPath
            )
        }
        
        // Obtener referencia al Minter
        self.minterRef = signer.storage.borrow<&CreatureNFTV5.NFTMinter>(from: CreatureNFTV5.MinterStoragePath)
            ?? panic("El firmante no tiene acceso al recurso NFTMinter")
        
        // Obtener referencia a la colección del receptor
        self.recipientCollectionRef = signer.storage.borrow<&CreatureNFTV5.Collection>(from: CreatureNFTV5.CollectionStoragePath)
            ?? panic("No se pudo obtener referencia a la colección de NFTs")
            
        // Generar genes visibles aleatorios basados en el bloque - rangos más amplios
        self.genesVisibles = {
            "colorR": UFix64( (timestampInt + blockHeightInt) % 256) / 255.0,         // [0.0, 1.0]
            "colorG": UFix64( (timestampInt / 2 + blockHeightInt * 2) % 256) / 255.0, // [0.0, 1.0]
            "colorB": UFix64( (timestampInt * 2 + blockHeightInt / 2) % 256) / 255.0, // [0.0, 1.0]
            "tamanoBase": 0.5 + (UFix64( (blockHeightInt + timestampInt) % 501) / 1000.0), // [0.5, 1.0]
            "formaPrincipal": 1.0 + UFix64( (timestampInt + 77) % 5),                   // [1.0, 5.0]
            "numApendices": UFix64( (blockHeightInt + 123) % 6),                         // [0.0, 5.0]
            "patronMovimiento": 1.0 + UFix64( (timestampInt + blockHeightInt + 234) % 4) // [1.0, 4.0]
        }
        
        // Calcular valores de genes ocultos basados en atributos visibles
        // Normalizar tamanoBase al rango [0.0, 1.0]
        // Si tamanoBase está en [0.5, 1.0], (tamanoBase - 0.5) está en [0.0, 0.5]. Multiplicar por 2 lo lleva a [0.0, 1.0]
        let normTamanoBase = (self.genesVisibles["tamanoBase"]! - 0.5) * 2.0 
        
        // tendenciaTamanoPositiva: si normTamanoBase > 0.5 (es decir, tamanoBase > 0.75), entonces será > 0
        // tendenciaTamanoNegativa: si normTamanoBase < 0.5 (es decir, tamanoBase < 0.75), entonces será > 0
        let tendenciaTamanoPositiva = normTamanoBase > 0.5 ? (normTamanoBase - 0.5) * 2.0 : 0.0 // Rango [0.0, 1.0]
        let tendenciaTamanoNegativa = normTamanoBase < 0.5 ? (0.5 - normTamanoBase) * 2.0 : 0.0 // Rango [0.0, 1.0]
        
        let formaActual = self.genesVisibles["formaPrincipal"]! 
        let numApendicesActual = self.genesVisibles["numApendices"]! 
        let normNumApendices = numApendicesActual / 5.0 // Normalizado de [0.0, 1.0] (ya que numApendices es 0-5)
        
        // Generar genes ocultos con rangos más significativos
        self.genesOcultos = {
            "tasaMetabolica": 0.1 + (UFix64( (timestampInt + 300) % 900) / 1000.0),     // [0.1, 0.999]
            "fertilidad": 0.1 + (UFix64( (timestampInt + 450) % 900) / 1000.0),       // [0.1, 0.999]
            "potencialEvolutivo": 0.1 + (UFix64( (timestampInt + 600) % 900) / 1000.0),// [0.1, 0.999]
            "max_lifespan_dias_base": 7.0, // Fijo como solicitado
            
            "puntosSaludMax": 50.0 + (tendenciaTamanoPositiva * 50.0) + (formaActual == 2.0 ? 25.0 : (formaActual == 4.0 ? 15.0 : 0.0)), // Base 50-100, + bonos
            
            "ataqueBase": 10.0 + 
                (formaActual == 3.0 ? 15.0 : (formaActual == 5.0 ? 20.0 : 0.0)) + 
                (normNumApendices * 20.0) + // Contribución de apéndices (0-20)
                (tendenciaTamanoPositiva * 10.0), // Contribución de tamaño (0-10)
            
            "defensaBase": 10.0 +
                (formaActual == 2.0 ? 15.0 : (formaActual == 4.0 ? 20.0 : 0.0)) + 
                (tendenciaTamanoPositiva * 15.0), // Contribución de tamaño (0-15)
            
            "agilidadCombate": 0.2 + // Base de agilidad
                (formaActual == 1.0 ? 0.3 : (formaActual == 5.0 ? 0.1 : 0.0)) + 
                (tendenciaTamanoNegativa * 0.3) // Más pequeño, más ágil (0-0.3)
        }
        
        self.initialPuntosEvolucion = 5.0 + (UFix64( (blockHeightInt + timestampInt) % 151) / 10.0) // [5.0, 20.0]
        self.lifespanDays = 7.0 // Fijo como solicitado
    }
    
    execute {
        // Verificar que no se excede el límite de criaturas vivas
        if self.recipientCollectionRef.getActiveCreatureCount() >= CreatureNFTV5.MAX_ACTIVE_CREATURES {
            panic("No se puede crear más criaturas: se ha alcanzado el límite máximo de criaturas vivas (".concat(CreatureNFTV5.MAX_ACTIVE_CREATURES.toString()).concat(")"))
        }
        
        let thumbnailURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzEyMzQ1NiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIj5FbGVtZW50YWwgU3RyaWtlcjwvdGV4dD48L3N2Zz4="
        
        // Crear un nuevo NFT
        let nft <- self.minterRef.createNFT(
            name: "", // Sin nombre predefinido
            description: "", // Sin descripción predefinida
            thumbnail: thumbnailURL,
            birthBlockHeight: getCurrentBlock().height,
            initialGenesVisibles: self.genesVisibles,
            initialGenesOcultos: self.genesOcultos,
            initialPuntosEvolucion: self.initialPuntosEvolucion,
            lifespanDays: self.lifespanDays,
            initialEdadDiasCompletos: 0.0,
            initialEstaViva: true,
            initialHomeostasisTargets: {}
        )
        
        self.recipientCollectionRef.deposit(token: <-nft)
        
        log("¡Criatura NFT creada con genes aleatorios (rangos restaurados) y depositada!")
        log("Puntos de Evolución iniciales: ".concat(self.initialPuntosEvolucion.toString()))
        log("Lifespan (días): ".concat(self.lifespanDays.toString()))
        log("Gen 'tamanoBase': ".concat(self.genesVisibles["tamanoBase"]!.toString()))
        log("Gen 'potencialEvolutivo': ".concat(self.genesOcultos["potencialEvolutivo"]!.toString()))
    }
} 