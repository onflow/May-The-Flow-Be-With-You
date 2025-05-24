import "NonFungibleToken"
import "CreatureNFT"

// Esta transacción establece un objetivo de homeostasis para una criatura
// basado en la interacción del usuario con un LLM.
// El LLM analiza la conversación y determina qué genes modificar y con qué objetivos.

transaction(
    nftID: UInt64, 
    geneName: String, 
    targetValue: UFix64,
    conversationSummary: String
) {
    // Referencia al NFT resource que será actualizado
    let nftRef: &CreatureNFT.NFT

    prepare(signer: auth(BorrowValue) &Account) {
        // Borrow a reference to the signer's Collection
        let collectionRef = signer.storage.borrow<&CreatureNFT.Collection>(from: CreatureNFT.CollectionStoragePath)
            ?? panic("Could not borrow a reference to the owner's Collection. Make sure the account is set up and owns NFTs.")

        // Borrow a reference to the NFT to be updated
        let borrowedNFT = collectionRef.borrowCreatureNFT(id: nftID)
            ?? panic("Could not borrow CreatureNFT with ID ".concat(nftID.toString()).concat(" from collection."))

        self.nftRef = borrowedNFT
    }

    execute {
        // Verificar que el gen sea válido para homeostasis (solo genes visibles)
        let genesVisibles = self.nftRef.genesVisibles

        if genesVisibles[geneName] == nil {
            panic("El gen ".concat(geneName).concat(" no existe en los genes visibles de esta criatura."))
        }

        // Simular costo EP para establecer objetivo homeostasis
        let epCost: UFix64 = 5.0
        if self.nftRef.puntosEvolucion < epCost {
            panic("No hay suficientes puntos de evolución. Necesita al menos ".concat(epCost.toString()).concat(" EP."))
        }

        // Establecer el objetivo de homeostasis
        self.nftRef.homeostasisTargets[geneName] = targetValue
        
        // Restar el costo de EP
        self.nftRef.updatePuntosEvolucion(newEP: self.nftRef.puntosEvolucion - epCost)
        
        // Actualizar la descripción para incluir el resumen de la conversación
        // Esto permite rastrear la "historia evolutiva" de la criatura
        let newDescription = self.nftRef.description.concat("\n\nObjetivo evolutivo: ").concat(geneName)
            .concat(" => ").concat(targetValue.toString())
            .concat("\nContexto: ").concat(conversationSummary)
        
        self.nftRef.updateDescription(newDescription: newDescription)
        
        log("Objetivo de homeostasis establecido para el gen ".concat(geneName).concat(" con valor ").concat(targetValue.toString()).concat(". Costo: ").concat(epCost.toString()).concat(" EP."))
    }
} 