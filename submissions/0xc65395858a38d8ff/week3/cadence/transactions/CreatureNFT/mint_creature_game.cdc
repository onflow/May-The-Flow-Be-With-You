import "NonFungibleToken"
import "CreatureNFT"
import "MetadataViews"

// Esta transacción mintea una nueva criatura para el juego ElementalStrikers
// usando valores derivados de la blockchain para generar atributos pseudo-aleatorios
// La criatura tendrá un lifespan máximo de 7 días

transaction(
    recipient: Address, 
    name: String,
    description: String
) {
    // Referencia al NFTMinter resource
    let minter: &CreatureNFT.NFTMinter

    // Referencia a la colección del destinatario
    let recipientCollection: &{NonFungibleToken.Receiver}
    
    // Variables para almacenar los atributos generados aleatoriamente
    let genesVisibles: {String: UFix64}
    let genesOcultos: {String: UFix64}
    let homeostasisTargets: {String: UFix64}
    let initialPuntosEvolucion: UFix64

    prepare(signer: auth(BorrowValue) &Account) {
        // Obtener información del bloque actual para generar aleatoriedad
        let currentBlock = getCurrentBlock()
        let blockHeight = currentBlock.height
        let timestamp = currentBlock.timestamp
        
        // Conversiones para evitar errores de tipo
        let blockHeightInt = Int(blockHeight)
        let timestampInt = Int(timestamp)
        
        // Borrow a reference to the NFTMinter resource from the signer's account storage
        self.minter = signer.storage.borrow<&CreatureNFT.NFTMinter>(from: CreatureNFT.MinterStoragePath)
            ?? panic("Signer does not have a CreatureNFT.NFTMinter resource.")

        // Borrow a reference to the recipient's public Collection capability
        self.recipientCollection = getAccount(recipient)
            .capabilities.borrow<&{NonFungibleToken.Receiver}>(CreatureNFT.CollectionPublicPath)
            ?? panic("Could not borrow Receiver capability from recipient's account. Make sure the account is set up to receive CreatureNFTs.")
            
        // Generar genes visibles aleatorios basados en el bloque
        self.genesVisibles = {
            "colorR": UFix64(blockHeightInt % 1000) / 1000.0,
            "colorG": UFix64((blockHeightInt + 123) % 1000) / 1000.0,
            "colorB": UFix64((blockHeightInt + 456) % 1000) / 1000.0,
            "tamañoBase": 0.5 + (UFix64((blockHeightInt + 789) % 500) / 250.0), // 0.5-2.5
            "formaPrincipal": 1.0 + UFix64((blockHeightInt + 111) % 3), // 1-3
            "numApendices": UFix64((blockHeightInt + 222) % 9), // 0-8
            "patronMovimiento": 1.0 + UFix64((blockHeightInt + 333) % 4) // 1-4
        }
        
        // Generar genes ocultos aleatorios
        self.genesOcultos = {
            "tasaMetabolica": 0.5 + (UFix64(timestampInt % 1000) / 1000.0), // 0.5-1.5
            "fertilidad": 0.1 + (UFix64((timestampInt + 100) % 800) / 1000.0), // 0.1-0.9
            "potencialEvolutivo": 0.5 + (UFix64((timestampInt + 200) % 1000) / 1000.0), // 0.5-1.5
            "max_lifespan_dias_base": 3.0 + (UFix64((timestampInt + 300) % 400) / 100.0), // 3.0-7.0 días
            "puntosSaludMax": 50.0 + (UFix64((timestampInt + 400) % 15000) / 100.0), // 50-200
            "ataqueBase": 5.0 + (UFix64((timestampInt + 500) % 2000) / 100.0), // 5-25
            "defensaBase": 5.0 + (UFix64((timestampInt + 600) % 2000) / 100.0), // 5-25
            "agilidadCombate": 0.5 + (UFix64((timestampInt + 700) % 150) / 100.0) // 0.5-2.0
        }
        
        // Homeostasis targets inicialmente vacío para ser establecido por interacción con LLM
        self.homeostasisTargets = {}
        
        // Puntos de evolución iniciales aleatorios entre 10 y 25
        self.initialPuntosEvolucion = 10.0 + (UFix64(blockHeightInt % 1500) / 100.0)
    }

    execute {
        // Generar un placeholder para thumbnail - será generado con p5.js
        let thumbnailPlaceholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzEyMzQ1NiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIj5FbGVtZW50YWwgU3RyaWtlcjwvdGV4dD48L3N2Zz4="
        
        // Mint the new NFT with all creature-specific attributes
        let newNFT <- self.minter.createNFT(
            name: name, 
            description: description, 
            thumbnail: thumbnailPlaceholder,
            birthBlockHeight: getCurrentBlock().height,
            initialGenesVisibles: self.genesVisibles,
            initialGenesOcultos: self.genesOcultos,
            initialPuntosEvolucion: self.initialPuntosEvolucion,
            lifespanDays: 7.0, // Vida máxima fija de 7 días para todas las criaturas
            initialEdadDiasCompletos: 0.0, // Comienza con edad 0
            initialEstaViva: true, // Comienza viva
            initialHomeostasisTargets: self.homeostasisTargets
        )

        // Deposit the new NFT into the recipient's Collection
        self.recipientCollection.deposit(token: <-newNFT)

        log("ElementalStriker criatura minteada y depositada al jugador con genes aleatorios (bloque #".concat(getCurrentBlock().height.toString()).concat(")"))
    }
} 