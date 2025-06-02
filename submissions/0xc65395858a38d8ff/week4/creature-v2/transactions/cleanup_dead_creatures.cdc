import "EvolvingCreatureNFT"

transaction() {
    let collectionRef: auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.Collection

    prepare(signer: auth(Storage) &Account) {
        // Get collection reference
        self.collectionRef = signer.storage.borrow<auth(Mutate, Insert, Remove) &EvolvingCreatureNFT.Collection>(
            from: EvolvingCreatureNFT.CollectionStoragePath
        ) ?? panic("Could not borrow creature collection")
    }

    execute {
        // Cleanup dead creatures and get count of removed creatures
        let removedCount = self.collectionRef.cleanupDeadCreatures()
        
        log("Cleanup completed: removed ".concat(removedCount.toString()).concat(" dead creatures from active list"))
        log("Active creatures now: ".concat(self.collectionRef.getActiveCreatureCount().toString()))
        log("Slots available: ".concat((5 - Int(self.collectionRef.getActiveCreatureCount())).toString()))
    }
} 