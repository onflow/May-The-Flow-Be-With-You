import EvolvingCreatureNFT from 0x2444e6b4d9327f09

// Enhanced mitosis transaction with variable EP spending for benefits
// Min 10 EP: basic mitosis
// 15 EP: +10% better mutations  
// 20 EP: +20% better mutations + 5% more lifespan
// 25+ EP: +30% better mutations + 10% more lifespan + possible trait bonus

transaction(creatureID: UInt64, epToSpend: UFix64) {
    // Reference to the collection containing the NFTs
    let collectionRef: auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.Collection
    
    prepare(signer: auth(Storage) &Account) {
        // Get reference to the NFT collection
        self.collectionRef = signer.storage.borrow<auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.Collection>(
            from: EvolvingCreatureNFT.CollectionStoragePath
        ) ?? panic("Could not borrow reference to the NFT collection")
    }
    
    execute {
        // Get reference to the creature
        let creatureRef = self.collectionRef.borrowEvolvingCreatureNFT(id: creatureID)
            ?? panic("Could not borrow reference to the creature")
        
        // Verify minimum EP cost
        if epToSpend < 10.0 {
            panic("Minimum 10.0 EP required for mitosis")
        }
        
        // Check if creature has enough EP
        let currentEP = creatureRef.getCurrentEvolutionPotential()
        if currentEP < epToSpend {
            panic("Creature doesn't have enough Evolution Potential. Current: ".concat(currentEP.toString()).concat(", Required: ").concat(epToSpend.toString()))
        }
        
        // Determine enhancement level based on EP spent
        var enhancementLevel: UInt8 = 0
        var lifespanBonus: UFix64 = 0.0
        var mutationQuality: UFix64 = 1.0 // 1.0 = normal, >1.0 = better
        
        if epToSpend >= 25.0 {
            enhancementLevel = 3
            mutationQuality = 1.3 // 30% better mutations
            lifespanBonus = 0.1 // 10% more lifespan
        } else if epToSpend >= 20.0 {
            enhancementLevel = 2
            mutationQuality = 1.2 // 20% better mutations
            lifespanBonus = 0.05 // 5% more lifespan
        } else if epToSpend >= 15.0 {
            enhancementLevel = 1
            mutationQuality = 1.1 // 10% better mutations
            lifespanBonus = 0.0
        }
        
        // Perform enhanced mitosis
        let newCreatureID = creatureRef.performEnhancedMitosis(
            epCost: epToSpend,
            enhancementLevel: enhancementLevel,
            mutationQuality: mutationQuality,
            lifespanBonus: lifespanBonus
        )
        
        log("Enhanced mitosis successful!")
        log("Parent creature: ".concat(creatureID.toString()))
        log("New creature: ".concat(newCreatureID.toString()))
        log("EP spent: ".concat(epToSpend.toString()))
        log("Enhancement level: ".concat(enhancementLevel.toString()))
        log("Mutation quality: ".concat(mutationQuality.toString()))
        log("Lifespan bonus: ".concat(lifespanBonus.toString()))
    }
} 