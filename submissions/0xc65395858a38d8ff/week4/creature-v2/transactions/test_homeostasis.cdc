// test_homeostasis.cdc
// Test homeostasis mechanics

import "EvolvingCreatureNFT"
import "NonFungibleToken"

transaction(nftID: UInt64, targetGene: String, targetValue: UFix64) {
    let collectionRef: &EvolvingCreatureNFT.Collection
    
    prepare(signer: AuthAccount) {
        self.collectionRef = signer.borrow<&EvolvingCreatureNFT.Collection>(
            from: EvolvingCreatureNFT.CollectionStoragePath
        ) ?? panic("Could not borrow collection reference")
    }
    
    execute {
        // Get NFT reference
        let nftRef = self.collectionRef.borrowNFT(id: nftID) as! &EvolvingCreatureNFT.NFT
        
        // Log current homeostasis targets
        log("=== BEFORE SETTING HOMEOSTASIS ===")
        let currentTargets = nftRef.homeostasisTargets
        log("Current homeostasis targets: ".concat(currentTargets.toString()))
        
        // Set new homeostasis target
        nftRef.setHomeostasisTarget(geneName: targetGene, targetValue: targetValue)
        
        // Log new targets
        log("=== AFTER SETTING HOMEOSTASIS ===")
        let newTargets = nftRef.homeostasisTargets
        log("New homeostasis targets: ".concat(newTargets.toString()))
        
        // Test current trait values
        log("=== CURRENT TRAIT VALUES ===")
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
        
        // Evolution points and constants
        log("Evolution Points: ".concat(nftRef.puntosEvolucion.toString()))
        log("Homeostasis Learning Rate: ".concat(EvolvingCreatureNFT.TASA_APRENDIZAJE_HOMEOSTASIS_BASE.toString()))
        
        // Now evolve to see homeostasis effects
        log("=== TRIGGERING EVOLUTION WITH HOMEOSTASIS ===")
        nftRef.evolve(steps: 1)
        
        // Log after evolution
        log("=== AFTER HOMEOSTATIC EVOLUTION ===")
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
        
        log("Homeostasis test completed!")
    }
} 