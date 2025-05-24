// evolve_canvas.cdc
import FlowCanvas from 0x01 // Replace with your actual contract address when deployed

transaction(id: UInt64, triggerType: UInt8) {
    // Reference to the owner's collection
    let ownerCollection: &FlowCanvas.Collection
    
    prepare(signer: AuthAccount) {
        // Borrow a reference to the owner's collection
        self.ownerCollection = signer.borrow<&FlowCanvas.Collection>(from: FlowCanvas.CollectionStoragePath)
            ?? panic("Could not borrow a reference to the owner's collection")
    }
    
    execute {
        // Borrow a reference to the specific NFT to be evolved
        let canvasRef = self.ownerCollection.borrowFlowCanvas(id: id)
            ?? panic("Could not borrow a reference to the specified canvas NFT")
        
        // Convert UInt8 trigger type to EvolutionTrigger enum
        let evolutionTrigger: FlowCanvas.EvolutionTrigger
        
        switch triggerType {
            case 0:
                evolutionTrigger = FlowCanvas.EvolutionTrigger.Time
            case 1:
                evolutionTrigger = FlowCanvas.EvolutionTrigger.Neighbor
            case 2:
                evolutionTrigger = FlowCanvas.EvolutionTrigger.Transaction
            case 3:
                evolutionTrigger = FlowCanvas.EvolutionTrigger.Random
            default:
                evolutionTrigger = FlowCanvas.EvolutionTrigger.Random
        }
        
        // Evolve the canvas
        canvasRef.evolve(triggerType: evolutionTrigger)
        
        log("FlowCanvas section ".concat(id.toString()).concat(" evolved successfully"))
    }
}