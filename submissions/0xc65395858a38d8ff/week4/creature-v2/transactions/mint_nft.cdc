// Mint NFT Transaction with ALL Registered Modules (Dynamic)
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
                
                // Create initial traits dynamically from ALL registered modules
                let initialTraits: @{String: {TraitModule.Trait}} <- {}
                let registeredModules = EvolvingCreatureNFT.getRegisteredModules()
                
                var modulesList = ""
                var i = 0
                while i < registeredModules.length {
                    if i > 0 { modulesList = modulesList.concat(", ") }
                    modulesList = modulesList.concat(registeredModules[i])
                    i = i + 1
                }
                log("Creating traits for modules: [".concat(modulesList).concat("]"))
                
                // Create default trait for each registered module
                for moduleType in registeredModules {
                    if let factory = EvolvingCreatureNFT.getModuleFactory(moduleType: moduleType) {
                        let defaultTrait <- factory.createDefaultTrait()
                        initialTraits[moduleType] <-! defaultTrait
                        log("Created default trait for module: ".concat(moduleType))
                    } else {
                        log("WARNING: No factory found for module: ".concat(moduleType))
                    }
                }
                
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