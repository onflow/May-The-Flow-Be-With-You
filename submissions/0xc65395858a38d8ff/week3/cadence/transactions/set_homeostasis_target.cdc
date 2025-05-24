import EvolvingCreatures from 0x2444e6b4d9327f09 // Deployed EvolvingCreatures contract address

// This transaction allows a creature owner to set a homeostasis target for a specific gene.

transaction(creatureID: UInt64, geneName: String, targetValue: UFix64) {

    let creatureRef: &EvolvingCreatures.NFT

    prepare(signer: auth(BorrowValue) &Account) {
        // Borrow a reference to the signer's EvolvingCreatures Collection
        let collectionRef = signer.storage.borrow<&EvolvingCreatures.Collection>(
            from: EvolvingCreatures.CollectionStoragePath
        ) ?? panic("Could not borrow reference to EvolvingCreatures Collection")

        // Borrow a mutable reference to the specific creature NFT
        self.creatureRef = collectionRef.borrowEvolvingCreature(id: creatureID)
            ?? panic("Could not borrow mutable reference to creature NFT")

        // Pre-conditions
        assert(self.creatureRef.estaViva, message: "Creature must be alive to set a homeostasis target.")
        // Add other assertions if needed, e.g., geneName must be a valid visible gene.
        // For now, assuming the contract's internal logic (when _updateGenes is implemented)
        // will handle invalid gene names or clamp values if necessary.
    }

    execute {
        // Update the homeostasis target for the specified gene
        // The actual cost in PuntosEvolucion and application of this target
        // will be handled by the evolution logic within _updateGenes in the NFT resource.
        self.creatureRef.homeostasisTargets[geneName] = targetValue

        log("Homeostasis target for creature ".concat(creatureID.toString()).concat(", gene '").concat(geneName).concat("' set to ").concat(targetValue.toString()))
        
        emit EvolvingCreatures.HomeostasisTargetSet(creatureID: creatureID, gene: geneName, target: targetValue)
    }
} 