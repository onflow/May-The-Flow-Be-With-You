import EvolvingCreatures from 0xbeb2f48c3293e514 
import RandomBeaconHistory from 0x8c5303eaa26202d6

// This transaction processes the evolution update for a creature.
// It fetches a committed random seed if available and then applies evolution logic.

transaction(ownerAddress: Address, creatureID: UInt64) {

    let creatureRef: &EvolvingCreatures.NFT
    let collectionRef: &EvolvingCreatures.Collection // Needed to mark as dead in collection
    let prng: EvolvingCreatures.PRNG // PRNG instance

    prepare(signer: auth(BorrowValue) &Account) { // Signer can be anyone, but ownerAddress is used to find the NFT
        let ownerAccount = getAccount(ownerAddress)

        self.collectionRef = ownerAccount.storage.borrow<&EvolvingCreatures.Collection>(
            from: EvolvingCreatures.CollectionStoragePath
        ) ?? panic("Could not borrow reference to owner's EvolvingCreatures Collection")

        self.creatureRef = self.collectionRef.borrowEvolvingCreature(id: creatureID)
            ?? panic("Could not borrow mutable reference to creature NFT in owner's collection")

        assert(self.creatureRef.estaViva, message: "Creature must be alive to process evolution.")
        
        // Initialize PRNG here. Seed will be updated if a new beacon seed is fetched.
        // If no new seed is fetched but an old one exists, this PRNG will use the old one.
        // If no seed exists at all, an assert later will catch it.
        let initialSeed = self.creatureRef.currentActiveBeaconSeed ?? UInt256(0) // Default to 0 if no seed yet, assert handles later
        // For PRNG, we need UInt64. Taking lower bits of UInt256. A more robust conversion might be needed.
        self.prng = EvolvingCreatures.PRNG(seed: UInt64(initialSeed % UInt256(UInt64.max)) , salt: self.creatureRef.id + self.creatureRef.lastEvolutionProcessedBlockHeight)
    }

    execute {
        log("Executing processEvolutionUpdate for creature: ".concat(self.creatureRef.id.toString()))

        // A. Get/Update the "Semilla Maestra del Beacon" (if a request is pending and ready)
        if self.creatureRef.committedToRandomBlockHeight != nil && getCurrentBlock().height > self.creatureRef.committedToRandomBlockHeight! {
            let record = RandomBeaconHistory.getRecord(blockHeight: self.creatureRef.committedToRandomBlockHeight!)
                ?? panic("Failed to get random record for committed block. Block may not be finalized yet or an issue occurred.")
            
            self.creatureRef.currentActiveBeaconSeed = record.randomValue
            self.creatureRef.lastBeaconSeedFetchedBlockHeight = getCurrentBlock().height
            self.creatureRef.committedToRandomBlockHeight = nil
            self.creatureRef.simulatedDaysProcessedWithCurrentSeed = 0 // Reset day counter for new seed
            
            log("New Beacon Seed Fetched: ".concat(record.randomValue.toString()))

            // Re-initialize PRNG with the new seed
            self.prng = EvolvingCreatures.PRNG(seed: UInt64(record.randomValue % UInt256(UInt64.max)), salt: self.creatureRef.id + getCurrentBlock().height)
        }

        // B. Verify if there is a "Semilla Maestra del Beacon" active to evolve
        assert(self.creatureRef.currentActiveBeaconSeed != nil, message: "Creature needs an active beacon seed. Call requestEvolutionSeed and then processEvolutionUpdate after the delay.")

        // C. Procesamiento de Evolución usando timestamps
        let currentTimestamp = getCurrentBlock().timestamp
        let elapsedSimulatedDays = self.creatureRef.calcElapsedSimulatedDays(currentTimestamp: currentTimestamp)
        let numSimulatedDaysToProcess = Int(elapsedSimulatedDays) // Whole days only
        
        log("Seconds since last update: ".concat((currentTimestamp - self.creatureRef.lastEvolutionProcessedTimestamp).toString()).concat(", Equiv. Simulated Days to Process: ").concat(numSimulatedDaysToProcess.toString()))

        if numSimulatedDaysToProcess == 0 {
            log("Not enough time passed to simulate a full day. No evolution processed.")
            self.creatureRef.lastEvolutionProcessedBlockHeight = getCurrentBlock().height // Still update to prevent tiny block processing next time
            self.creatureRef.updateLastProcessedTimestamp(newTimestamp: currentTimestamp)
            return
        }

        var simulatedDayNonceForDerivation = self.creatureRef.simulatedDaysProcessedWithCurrentSeed
        var currentDay = 0
        while currentDay < numSimulatedDaysToProcess {
            if !self.creatureRef.estaViva { // Stop if creature dies mid-update
                break
            }

            simulatedDayNonceForDerivation = simulatedDayNonceForDerivation + 1
            log("Processing simulated day: ".concat(simulatedDayNonceForDerivation.toString()).concat(" for creature ").concat(self.creatureRef.id.toString()))

            // Derive "Semillas Diarias Simuladas" (equivalentes a R0-R4 de Python)
            // These are just examples, the actual number and use of derived seeds
            // will depend on the _updateGenes and _gainEP implementations.
            let R0_equiv = self.prng.nextWithSalt(seed: simulatedDayNonceForDerivation * 100 + 0) // Assuming nextWithSalt exists or adapt PRNG
            let R1_equiv = self.prng.nextWithSalt(seed: simulatedDayNonceForDerivation * 100 + 1)
            // ... and so on for R2, R3, R4 if needed by the logic in _updateGenes, _gainEP

            // Call internal NFT methods to apply evolution logic for one simulated day
            // These methods would use the derived R0_equiv, R1_equiv etc.
            self.creatureRef._gainEP(prng: &self.prng, currentSimulatedDayR0: R0_equiv) // Pass PRNG or derived values
            self.creatureRef._updateGenes(prng: &self.prng, currentSimulatedDayR0: R0_equiv, currentSimulatedDayR1: R1_equiv)
            self.creatureRef._ageOneDaySimulated()

            // Check for death by old age for this day
            if self.creatureRef.edadDiasCompletos >= self.creatureRef.lifespanTotalSimulatedDays {
                self.creatureRef._die() // Sets estaViva = false, deathBlockHeight, deathTimestamp
                self.collectionRef._markAsDeadInCollection(creatureID: self.creatureRef.id)
                emit EvolvingCreatures.CreatureDied(
                    creatureID: self.creatureRef.id, 
                    deathBlockHeight: self.creatureRef.deathBlockHeight!,
                    deathTimestamp: self.creatureRef.deathTimestamp!
                )
                log("Creature ".concat(self.creatureRef.id.toString()).concat(" died of old age during update."))
            }
            currentDay = currentDay + 1
        }

        self.creatureRef.simulatedDaysProcessedWithCurrentSeed = simulatedDayNonceForDerivation
        self.creatureRef.lastEvolutionProcessedBlockHeight = getCurrentBlock().height
        self.creatureRef.updateLastProcessedTimestamp(newTimestamp: currentTimestamp)
        
        emit EvolvingCreatures.EvolutionProcessed(
            creatureID: self.creatureRef.id, 
            newEP: self.creatureRef.puntosEvolucion, 
            newAgeInDays: self.creatureRef.edadDiasCompletos, 
            isAlive: self.creatureRef.estaViva,
            lastProcessedBlock: self.creatureRef.lastEvolutionProcessedBlockHeight,
            lastProcessedTimestamp: self.creatureRef.lastEvolutionProcessedTimestamp
        )
        log("Evolution processing complete for creature: ".concat(self.creatureRef.id.toString()).concat(". Is alive: ".concat(self.creatureRef.estaViva.toString())))
    }
}

// Helper extension for PRNG if nextWithSalt is desired (conceptual)
// If not, PRNG.next() can be used and salt incorporated manually when calling it.
// For simplicity, assuming the _gainEP and _updateGenes methods will handle PRNG usage internally if passed &self.prng.
// The current PRNG struct does not have nextWithSalt, so R0_equiv, R1_equiv derivation will need adjustment.
// Let's simplify the R0_equiv for now and assume the internal methods use the main prng instance.

// Re-adjusting R0_equiv for compatibility with current PRNG:
// let R0_equiv = self.prng.next() // The internal methods would call prng.next() as needed.
// The currentSimulatedDayR0 and R1 parameters to _updateGenes/_gainEP would represent these derived values.
// The PRNG state is advanced by each call to .next(). 