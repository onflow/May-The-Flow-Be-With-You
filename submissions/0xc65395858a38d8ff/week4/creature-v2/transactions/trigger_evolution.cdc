// trigger_evolution.cdc
// Trigger evolution on a creature NFT to test all mechanics

import "EvolvingCreatureNFT"
import "NonFungibleToken"

transaction(nftID: UInt64, steps: UInt64) {
    let collectionRef: &EvolvingCreatureNFT.Collection
    
    prepare(signer: AuthAccount) {
        self.collectionRef = signer.borrow<&EvolvingCreatureNFT.Collection>(
            from: EvolvingCreatureNFT.CollectionStoragePath
        ) ?? panic("Could not borrow collection reference")
    }
    
    execute {
        // Get NFT reference
        let nftRef = self.collectionRef.borrowNFT(id: nftID) as! &EvolvingCreatureNFT.NFT
        
        // Log before state
        log("=== BEFORE EVOLUTION ===")
        log("Age: ".concat(nftRef.edadDiasCompletos.toString()))
        log("EP: ".concat(nftRef.puntosEvolucion.toString()))
        log("Alive: ".concat(nftRef.estaViva.toString()))
        
        if let visualValue = nftRef.getTraitValue("visual") {
            log("Visual: ".concat(visualValue))
        }
        if let combatValue = nftRef.getTraitValue("combat") {
            log("Combat: ".concat(combatValue))
        }
        if let evolutionValue = nftRef.getTraitValue("evolution") {
            log("Evolution: ".concat(evolutionValue))
        }
        if let metabolismValue = nftRef.getTraitValue("metabolism") {
            log("Metabolism: ".concat(metabolismValue))
        }
        
        // Generate current seeds
        let currentSeeds = nftRef.generateDailySeeds(UInt64(nftRef.edadDiasCompletos))
        log("Current seeds: ".concat(currentSeeds.toString()))
        
        // === TRIGGER EVOLUTION ===
        nftRef.evolve(steps: steps)
        
        // Log after state
        log("=== AFTER EVOLUTION ===")
        log("Age: ".concat(nftRef.edadDiasCompletos.toString()))
        log("EP: ".concat(nftRef.puntosEvolucion.toString()))
        log("Alive: ".concat(nftRef.estaViva.toString()))
        
        if let visualValue = nftRef.getTraitValue("visual") {
            log("Visual: ".concat(visualValue))
        }
        if let combatValue = nftRef.getTraitValue("combat") {
            log("Combat: ".concat(combatValue))
        }
        if let evolutionValue = nftRef.getTraitValue("evolution") {
            log("Evolution: ".concat(evolutionValue))
        }
        if let metabolismValue = nftRef.getTraitValue("metabolism") {
            log("Metabolism: ".concat(metabolismValue))
        }
        
        log("Evolution completed successfully!")
    }
} 