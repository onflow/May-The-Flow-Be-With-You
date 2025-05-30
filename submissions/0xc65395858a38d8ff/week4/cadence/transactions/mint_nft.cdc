// Mint NFT Transaction with Modules
import "EvolvingCreatureNFT"
import "NonFungibleToken"

transaction(recipient: Address) {
    prepare(acct: auth(Storage, Capabilities) &Account) {
        // Get minter capability
        let minterCap = acct.capabilities.get<&EvolvingCreatureNFT.NFTMinter>(EvolvingCreatureNFT.MinterPublicPath)
        
        if minterCap.check() {
            let minter = minterCap.borrow()!
            
            // Get recipient's collection reference
            let recipientAccount = getAccount(recipient)
            let recipientCap = recipientAccount.capabilities.get<&EvolvingCreatureNFT.Collection>(EvolvingCreatureNFT.CollectionPublicPath)
            
            if recipientCap.check() {
                let collection = recipientCap.borrow()!
                
                // Mint new NFT with all trait modules
                let nft <- minter.mintNFTWithTraits(
                    name: "Evolving Creature",
                    description: "A unique evolving digital creature",
                    thumbnail: "https://example.com/creature.png"
                )
                
                collection.deposit(token: <-nft)
                log("NFT minted and deposited successfully!")
            } else {
                panic("Recipient's collection not found or not accessible")
            }
        } else {
            panic("No minter capability found")
        }
    }
} 