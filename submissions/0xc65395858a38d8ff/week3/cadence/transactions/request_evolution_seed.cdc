import EvolvingCreatures from 0xbeb2f48c3293e514 // Assuming EvolvingCreatures will be deployed here
import RandomBeaconHistory from 0x8c5303eaa26202d6

// This transaction allows a creature owner to request/commit to a new random seed
// from the Flow RandomBeaconHistory for their creature's next evolution period.

transaction(creatureID: UInt64) {

    let creatureRef: &EvolvingCreatures.NFT
    let signerAddress: Address

    prepare(signer: auth(BorrowValue) &Account) {
        self.signerAddress = signer.address

        // Borrow a reference to the signer's EvolvingCreatures Collection
        let collectionRef = signer.storage.borrow<&EvolvingCreatures.Collection>(
            from: EvolvingCreatures.CollectionStoragePath
        ) ?? panic("Could not borrow reference to EvolvingCreatures Collection")

        // Borrow a mutable reference to the specific creature NFT
        self.creatureRef = collectionRef.borrowEvolvingCreature(id: creatureID)
            ?? panic("Could not borrow mutable reference to creature NFT")

        // Pre-conditions
        assert(self.creatureRef.estaViva, message: "Creature must be alive to request an evolution seed.")
        assert(self.creatureRef.committedToRandomBlockHeight == nil, message: "Already committed to a random block. Process evolution first or wait.")
    }

    execute {
        // Define the commit delay (e.g., 25-50 blocks, typically around 30 seconds to a minute)
        // This value might need tuning based on desired user experience and network conditions.
        let commitDelay: UInt64 = 30 // Number of blocks to wait for the reveal
        let targetRevealBlock = getCurrentBlock().height + commitDelay

        // Commit to the RandomBeaconHistory for a future block
        RandomBeaconHistory.commit(self.signerAddress, blockHeight: targetRevealBlock)

        // Update the creature's state to reflect this commitment
        self.creatureRef.committedToRandomBlockHeight = targetRevealBlock

        log("Creature ".concat(creatureID.toString()).concat(" committed to random seed reveal at block ").concat(targetRevealBlock.toString()))
        // The contract should emit EvolutionSeedCommitted event upon this state change if desired,
        // or this log serves as confirmation.
        // For consistency, if other state changes in NFT emit events from NFT methods,
        // consider adding a method like `creatureRef.setCommitment(targetRevealBlock)` that emits.
        // For now, direct state update is fine as per plan.
        EvolvingCreatures.log("Transaction: Creature ".concat(creatureID.toString()).concat(" committed to random seed reveal at block ").concat(targetRevealBlock.toString()))

    }
} 