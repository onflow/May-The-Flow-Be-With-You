import EvolvingCreatureNFT from 0x2444e6b4d9327f09

transaction(creatureID: UInt64, simulatedSecondsPerDay: UFix64) {
    
    prepare(acct: auth(Storage) &Account) {
        // Get reference to the collection with proper permissions for mutation
        let collectionRef = acct.storage.borrow<auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.Collection>(
            from: EvolvingCreatureNFT.CollectionStoragePath
        ) ?? panic("Could not borrow collection reference")
        
        // Evolve the specific creature based on elapsed time (step-by-step processing)
        // 250 steps per simulated day
        collectionRef.evolveCreature(id: creatureID, simulatedSecondsPerDay: simulatedSecondsPerDay)
        
        log("Creature ".concat(creatureID.toString()).concat(" evolved with ").concat(simulatedSecondsPerDay.toString()).concat(" seconds per simulated day (250 steps/day)"))
    }
} 