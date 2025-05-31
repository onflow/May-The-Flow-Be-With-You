// Mint NFT Transaction with Destiny-based Traits
import "EvolvingCreatureNFT"
import "NonFungibleToken"
import "TraitModule"

transaction(recipient: Address) {
    prepare(acct: auth(Storage, Capabilities) &Account) {
        // Get minter capability (using correct public path)
        let minterCap = acct.capabilities.get<&EvolvingCreatureNFT.NFTMinter>(/public/EvolvingCreatureNFTMinter)
        
        if minterCap.check() {
            let minter = minterCap.borrow()!
            
            // Get recipient's collection reference
            let recipientAccount = getAccount(recipient)
            let recipientCap = recipientAccount.capabilities.get<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionPublicPath)
            
            if recipientCap.check() {
                let collection = recipientCap.borrow()!
                
                // Create NFT with empty traits first (will generate initialSeed automatically)
                let emptyTraits: @{String: {TraitModule.Trait}} <- {}
                
                let nft <- minter.mintNFT(
                    name: "Destiny Creature",
                    description: "A creature with traits determined by its unique destiny seed",
                    thumbnail: "https://example.com/destiny-creature.png",
                    lifespanDays: 5.0,
                    initialTraits: <- emptyTraits
                )
                
                // NOW initialize traits using the NFT's destiny (initialSeed + generateDailySeeds)
                nft.initializeTraitsWithDestiny()
                
                // Log the creature's destiny seed
                log("NFT created with destiny seed: ".concat(nft.initialSeed.toString()))
                
                collection.deposit(token: <-nft)
                log("Destiny creature minted successfully!")
            } else {
                panic("Recipient's collection not found or not accessible")
            }
        } else {
            panic("No minter capability found")
        }
    }
} 