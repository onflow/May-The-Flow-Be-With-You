// Mint NFT Transaction with Seed-based Traits
import "EvolvingCreatureNFT"
import "NonFungibleToken"
import "TraitModule"
import "VisualTraitsModule"
import "CombatStatsModule"
import "EvolutionPotentialModule"
import "MetabolismModule"

transaction(recipient: Address, customSeed: UInt64?) {
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
                
                // Generate seed for traits (use custom or block-based)
                let currentBlock = getCurrentBlock()
                let baseSeed = customSeed ?? (currentBlock.height ^ UInt64(currentBlock.timestamp))
                
                // Create initial traits using seed-based generation
                let initialTraits: @{String: {TraitModule.Trait}} <- {}
                
                // Create visual traits with seed
                initialTraits["visual"] <-! VisualTraitsModule.createTraitWithSeed(seed: baseSeed)
                
                // Create combat stats with different seed derivation
                initialTraits["combat"] <-! CombatStatsModule.createTraitWithSeed(seed: baseSeed ^ 0x1111)
                
                // Create evolution potential with different seed derivation  
                initialTraits["evolution"] <-! EvolutionPotentialModule.createTraitWithSeed(seed: baseSeed ^ 0x2222)
                
                // Create metabolism with different seed derivation
                initialTraits["metabolism"] <-! MetabolismModule.createTraitWithSeed(seed: baseSeed ^ 0x3333)
                
                // Mint new NFT with seed-based traits
                let nft <- minter.mintNFT(
                    name: "Evolving Creature",
                    description: "A unique evolving digital creature with seed-based genetics",
                    thumbnail: "https://example.com/creature.png",
                    lifespanDays: 5.0,
                    initialTraits: <- initialTraits
                )
                
                collection.deposit(token: <-nft)
                log("NFT minted with seed-based traits! Seed: ".concat(baseSeed.toString()))
            } else {
                panic("Recipient's collection not found or not accessible")
            }
        } else {
            panic("No minter capability found")
        }
    }
} 