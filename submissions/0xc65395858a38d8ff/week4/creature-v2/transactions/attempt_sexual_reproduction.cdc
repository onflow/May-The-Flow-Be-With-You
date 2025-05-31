import EvolvingCreatureNFT from 0x2444e6b4d9327f09
import ReproductionModule from 0x2444e6b4d9327f09

// Esta transacción permite al usuario decidir si proceder con la reproducción sexual
// entre dos criaturas que tienen oportunidades reproductivas activas.

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
        // Obtener referencias a ambas criaturas
        let parent1Ref = self.collectionRef.borrowEvolvingCreatureNFTForUpdate(id: parent1ID)!
        let parent2Ref = self.collectionRef.borrowEvolvingCreatureNFTForUpdate(id: parent2ID)!
        
        // Verificar que ambas criaturas están vivas
        if !parent1Ref.estaViva {
            panic("La criatura padre #".concat(parent1ID.toString()).concat(" no está viva"))
        }
        if !parent2Ref.estaViva {
            panic("La criatura padre #".concat(parent2ID.toString()).concat(" no está viva"))
        }
        
        if allowReproduction {
            // === INTENTAR REPRODUCCIÓN SEXUAL ===
            
            // Verificar compatibilidad reproductiva
            let compatible = self.verifyReproductiveCompatibility(parent1Ref, parent2Ref)
            if !compatible {
                panic("Las criaturas no son compatibles para reproducción en este momento")
            }
            
            // Verificar límite de criaturas activas
            if UInt64(self.collectionRef.getActiveCreatureIDs().length) >= EvolvingCreatureNFT.MAX_ACTIVE_CREATURES {
                panic("Se ha alcanzado el límite máximo de criaturas activas")
            }
            
            // Realizar reproducción sexual
            let success = self.performSexualReproduction(parent1Ref, parent2Ref)
            
            if success {
                log("¡Reproducción sexual exitosa entre criaturas #".concat(parent1ID.toString()).concat(" y #").concat(parent2ID.toString()).concat("!"))
            } else {
                log("La reproducción no fue exitosa. Intenta de nuevo más tarde.")
            }
            
        } else {
            // === RECHAZAR REPRODUCCIÓN ===
            
            // Limpiar candidatos reproductivos y aplicar cooldown
            self.clearReproductionCandidates(parent1Ref, "user_declined")
            self.clearReproductionCandidates(parent2Ref, "user_declined")
            
            log("Reproducción rechazada. Las criaturas entrarán en período de cooldown.")
        }
    }
    
    // === HELPER FUNCTIONS ===
    
    access(self) fun verifyReproductiveCompatibility(
        _ parent1: &EvolvingCreatureNFT.NFT, 
        _ parent2: &EvolvingCreatureNFT.NFT
    ): Bool {
        // Verificar que ambas criaturas tienen el módulo reproductivo
        if !parent1.traits.containsKey("reproduction") {
            return false
        }
        if !parent2.traits.containsKey("reproduction") {
            return false
        }
        
        // Obtener referencias a los módulos reproductivos
        let repro1 = &parent1.traits["reproduction"] as! &ReproductionModule.ReproductionStatus
        let repro2 = &parent2.traits["reproduction"] as! &ReproductionModule.ReproductionStatus
        
        // Verificar que ambas pueden reproducirse
        if !repro1.isReproductionReady() || !repro2.isReproductionReady() {
            return false
        }
        
        // Verificar compatibilidad mutua
        if !repro1.canReproduceWith(partnerID: parent2.id) {
            return false
        }
        if !repro2.canReproduceWith(partnerID: parent1.id) {
            return false
        }
        
        return true
    }
    
    access(self) fun performSexualReproduction(
        _ parent1: &EvolvingCreatureNFT.NFT, 
        _ parent2: &EvolvingCreatureNFT.NFT
    ): Bool {
        // Obtener módulos reproductivos
        let repro1 = &parent1.traits["reproduction"] as! &ReproductionModule.ReproductionStatus
        let repro2 = &parent2.traits["reproduction"] as! &ReproductionModule.ReproductionStatus
        
        // Calcular probabilidad de éxito
        let compatibility = repro1.calculateReproductiveCompatibility(partner: repro2)
        let hybridVigor = repro1.calculateHybridVigor(partner: repro2)
        let successChance = compatibility * 0.8 // Max 80% success rate
        
        // Generar número aleatorio para determinar éxito
        let currentBlock = getCurrentBlock()
        let randomSeed = UInt64(currentBlock.timestamp) ^ currentBlock.height ^ parent1.id ^ parent2.id
        let randomValue = UFix64(randomSeed % 1000) / 999.0
        
        if randomValue > successChance {
            // Reproducción falló, pero aplica cooldown
            self.clearReproductionCandidates(parent1, "reproduction_failed")
            self.clearReproductionCandidates(parent2, "reproduction_failed")
            return false
        }
        
        // === CREAR DESCENDENCIA ===
        
        // Generar seed único para el hijo
        let childSeed = randomSeed ^ UInt64(currentBlock.timestamp * 1000.0)
        
        // Crear traits del hijo usando reproducción sexual de cada módulo
        let childTraits: @{String: {EvolvingCreatureNFT.TraitModule.Trait}} <- {}
        let registeredModules = EvolvingCreatureNFT.getRegisteredModules()
        
        for i, moduleType in registeredModules {
            if let factory = EvolvingCreatureNFT.getModuleFactory(moduleType: moduleType) {
                if let parent1Trait = &parent1.traits[moduleType] as &{EvolvingCreatureNFT.TraitModule.Trait}? {
                    if let parent2Trait = &parent2.traits[moduleType] as &{EvolvingCreatureNFT.TraitModule.Trait}? {
                        // Usar semilla específica para cada módulo
                        let moduleSeed = childSeed ^ UInt64(i * 1000)
                        let childTrait <- factory.createChildTrait(
                            parent1: parent1Trait, 
                            parent2: parent2Trait, 
                            seed: moduleSeed
                        )
                        childTraits[moduleType] <-! childTrait
                    }
                }
            }
        }
        
        // Calcular esperanza de vida del hijo (promedio de padres + hybrid vigor)
        let avgLifespan = (parent1.lifespanTotalSimulatedDays + parent2.lifespanTotalSimulatedDays) / 2.0
        let childLifespan = avgLifespan * hybridVigor
        
        // Crear nueva criatura
        EvolvingCreatureNFT.totalSupply = EvolvingCreatureNFT.totalSupply + 1
        let newID = EvolvingCreatureNFT.totalSupply
        
        let newCreature <- EvolvingCreatureNFT.NFT(
            id: newID,
            name: "Hybrid of ".concat(parent1.name).concat(" & ").concat(parent2.name),
            description: "Born from sexual reproduction between creatures #".concat(parent1.id.toString()).concat(" and #").concat(parent2.id.toString()),
            thumbnail: parent1.thumbnail, // Could be mixed or generated
            birthBlockHeight: currentBlock.height,
            lifespanDays: childLifespan,
            initialTraits: <- childTraits
        )
        
        // Depositar el nuevo NFT en la colección
        self.collectionRef.deposit(token: <-newCreature)
        
        // Registrar reproducción exitosa en ambos padres
        repro1.recordSuccessfulReproduction()
        repro2.recordSuccessfulReproduction()
        
        // Emitir evento
        // emit SexualReproductionOccurred(
        //     parent1ID: parent1.id,
        //     parent2ID: parent2.id,
        //     childID: newID
        // )
        
        return true
    }
    
    access(self) fun clearReproductionCandidates(_ creature: &EvolvingCreatureNFT.NFT, _ reason: String) {
        if let reproRef = &creature.traits["reproduction"] as &ReproductionModule.ReproductionStatus? {
            reproRef.clearCandidates(reason: reason)
        }
    }
} 