// Mint NFT Transaction with Modules
import "EvolvingCreatureNFT"
import "NonFungibleToken"
import "VisualTraitsModule"
import "CombatStatsModule"
import "EvolutionPotentialModule"
import "MetabolismModule"

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
                
                // Create initial traits manually
                let initialTraits: @{String: {TraitModule.Trait}} <- {}
                
                // Create visual traits
                initialTraits["visual"] <-! VisualTraitsModule.createDefaultTrait()
                
                // Create combat stats
                initialTraits["combat"] <-! CombatStatsModule.createDefaultTrait()
                
                // Create evolution potential
                initialTraits["evolution"] <-! EvolutionPotentialModule.createDefaultTrait()
                
                // Create metabolism
                initialTraits["metabolism"] <-! MetabolismModule.createDefaultTrait()
                
                // Mint new NFT with traits
                let nft <- minter.mintNFT(
                    name: "Evolving Creature",
                    description: "A unique evolving digital creature",
                    thumbnail: "https://example.com/creature.png",
                    lifespanDays: 5.0,
                    initialTraits: <- initialTraits
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