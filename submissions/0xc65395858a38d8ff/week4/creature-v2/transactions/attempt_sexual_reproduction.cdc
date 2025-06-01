import EvolvingCreatureNFT from 0x2444e6b4d9327f09
import ReproductionModuleV2 from 0x2444e6b4d9327f09

// Esta transacción permite al usuario decidir si proceder con la reproducción sexual
// entre dos criaturas que tienen oportunidades reproductivas activas detectadas automáticamente.

transaction(parent1ID: UInt64, parent2ID: UInt64, allowReproduction: Bool) {
    // Referencia a la colección de NFTs del usuario
    let collectionRef: auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.Collection
    
    prepare(signer: auth(Storage) &Account) {
        // Obtener referencia a la colección
        self.collectionRef = signer.storage.borrow<auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.Collection>(
            from: EvolvingCreatureNFT.CollectionStoragePath
        ) ?? panic("No se pudo obtener referencia a la colección de criaturas modulares")
        
        // Verificar que el usuario posee ambas criaturas
        if !self.collectionRef.getIDs().contains(parent1ID) {
            panic("No posees la criatura padre #".concat(parent1ID.toString()))
        }
        if !self.collectionRef.getIDs().contains(parent2ID) {
            panic("No posees la criatura padre #".concat(parent2ID.toString()))
        }
        
        // Verificar que las criaturas son diferentes
        if parent1ID == parent2ID {
            panic("No se puede reproducir una criatura consigo misma")
        }
    }
    
    execute {
        if allowReproduction {
            // === INTENTAR REPRODUCCIÓN SEXUAL ===
            
            // Simplemente llamar al método del contrato (como mitosis)
            let success = self.collectionRef.performSexualReproduction(parent1ID: parent1ID, parent2ID: parent2ID)
            
            if success {
                log("¡Reproducción sexual exitosa entre criaturas #".concat(parent1ID.toString()).concat(" y #").concat(parent2ID.toString()).concat("! Nueva criatura creada."))
            } else {
                log("La reproducción no fue exitosa. Las criaturas pueden no ser compatibles o faltó espacio para nueva criatura.")
            }
            
        } else {
            // === RECHAZAR REPRODUCCIÓN ===
            
            // Obtener referencias a las criaturas para limpiar candidatos
            let parent1Ref = self.collectionRef.borrowEvolvingCreatureNFTForUpdate(id: parent1ID)!
            let parent2Ref = self.collectionRef.borrowEvolvingCreatureNFTForUpdate(id: parent2ID)!
            
            // Obtener módulos reproductivos y limpiar candidatos
            let repro1 = parent1Ref.traits["reproduction"] as! &ReproductionModuleV2.ReproductionStatus
            let repro2 = parent2Ref.traits["reproduction"] as! &ReproductionModuleV2.ReproductionStatus
            
            repro1.clearCandidates(reason: "user_declined")
            repro2.clearCandidates(reason: "user_declined")
            
            log("Reproducción rechazada. Las criaturas entrarán en período de cooldown.")
        }
    }
} 