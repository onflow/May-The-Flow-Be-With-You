// mint_full_creature.cdc
// Mint a creature with all trait modules initialized

import "EvolvingCreatureNFT"
import "VisualTraitsModule"
import "CombatStatsModule"
import "EvolutionPotentialModule"
import "MetabolismModule"
import "NonFungibleToken"

transaction(
    name: String,
    description: String,
    thumbnail: String,
    contractAddress: Address
) {
    let minterRef: &EvolvingCreatureNFT.NFTMinter
    let collectionRef: &EvolvingCreatureNFT.Collection
    
    prepare(signer: AuthAccount) {
        // Get reference to the public minter
        self.minterRef = getAccount(contractAddress)
            .getCapability(/public/EvolvingCreatureNFTMinter)
            .borrow<&EvolvingCreatureNFT.NFTMinter>()
            ?? panic("Could not borrow minter reference")
        
        // Check if collection exists, if not create it
        if signer.borrow<&EvolvingCreatureNFT.Collection>(from: EvolvingCreatureNFT.CollectionStoragePath) == nil {
            let collection <- EvolvingCreatureNFT.createEmptyCollection()
            signer.save(<-collection, to: EvolvingCreatureNFT.CollectionStoragePath)
            
            signer.link<&EvolvingCreatureNFT.Collection>(
                EvolvingCreatureNFT.CollectionPublicPath,
                target: EvolvingCreatureNFT.CollectionStoragePath
            )
        }
        
        self.collectionRef = signer.borrow<&EvolvingCreatureNFT.Collection>(
            from: EvolvingCreatureNFT.CollectionStoragePath
        )!
    }
    
    execute {
        // Create initial traits for the creature
        let initialTraits: @{String: {EvolvingCreatureNFT.TraitModule.Trait}} <- {}
        
        // 1. Visual Traits
        let visualTrait <- VisualTraitsModule.createDefaultTrait()
        initialTraits["visual"] <-! visualTrait
        
        // 2. Combat Stats  
        let combatTrait <- CombatStatsModule.createDefaultTrait()
        initialTraits["combat"] <-! combatTrait
        
        // 3. Evolution Potential
        let evolutionTrait <- EvolutionPotentialModule.createDefaultTrait()
        initialTraits["evolution"] <-! evolutionTrait
        
        // 4. Metabolism
        let metabolismTrait <- MetabolismModule.createDefaultTrait()
        initialTraits["metabolism"] <-! metabolismTrait
        
        // Mint the NFT with all traits
        let newNFT <- self.minterRef.mintNFT(
            name: name,
            description: description,
            thumbnail: thumbnail,
            lifespanDays: 5.0, // Default lifespan
            initialTraits: <- initialTraits
        )
        
        // Deposit into collection
        self.collectionRef.deposit(token: <- newNFT)
        
        log("Full creature minted successfully with all trait modules!")
    }
} 