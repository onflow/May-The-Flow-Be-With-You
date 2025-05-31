// Evolve NFT Transaction
import "EvolvingCreatureNFT"

transaction(nftID: UInt64) {
    prepare(acct: auth(Storage, Capabilities) &Account) {
        // Get collection reference
        let collection = acct.storage.borrow<auth(NonFungibleToken.Withdraw, NonFungibleToken.Update) &EvolvingCreatureNFT.Collection>(
            from: EvolvingCreatureNFT.CollectionStoragePath
        ) ?? panic("Collection not found")
        
        // Get NFT reference
        let nftRef = collection.borrowEvolvingCreatureNFT(id: nftID) 
            ?? panic("NFT not found")
        
        // Generate random seeds for evolution (using block data)
        let currentBlock = getCurrentBlock()
        let baseSeeds: [UInt64] = [
            currentBlock.height,
            UInt64(currentBlock.timestamp),
            currentBlock.height ^ UInt64(currentBlock.timestamp),
            (currentBlock.height * 123) % 9999,
            (UInt64(currentBlock.timestamp) * 456) % 9999,
            (currentBlock.height + UInt64(currentBlock.timestamp)) % 9999,
            (currentBlock.height * 789) % 9999,
            (UInt64(currentBlock.timestamp) * 321) % 9999,
            (currentBlock.height ^ 654) % 9999,
            (UInt64(currentBlock.timestamp) ^ 987) % 9999
        ]
        
        // Evolve the NFT
        nftRef.evolve(seeds: baseSeeds)
        
        log("NFT evolved successfully!")
        log("New traits: ".concat(nftRef.getTraitsDisplay()))
    }
} 