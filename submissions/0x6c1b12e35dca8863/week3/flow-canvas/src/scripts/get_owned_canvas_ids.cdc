// get_owned_canvas_ids.cdc
import FlowCanvas from 0x01 // Replace with your actual contract address when deployed

pub struct CanvasInfo {
    pub let id: UInt64
    pub let x: Int
    pub let y: Int
    
    init(id: UInt64, x: Int, y: Int) {
        self.id = id
        self.x = x
        self.y = y
    }
}

pub fun main(address: Address): [CanvasInfo] {
    let canvasInfos: [CanvasInfo] = []
    
    // Get the public collection capability
    let collectionCap = getAccount(address).getCapability<&{FlowCanvas.FlowCanvasCollectionPublic}>(
        FlowCanvas.CollectionPublicPath
    )
    
    // Borrow the collection reference
    if let collection = collectionCap.borrow() {
        // Get all canvas IDs owned by this account
        let ids = collection.getIDs()
        
        // For each ID, get the canvas information
        for id in ids {
            if let canvas = collection.borrowFlowCanvas(id: id) {
                canvasInfos.append(CanvasInfo(
                    id: id,
                    x: canvas.x,
                    y: canvas.y
                ))
            }
        }
    }
    
    return canvasInfos
}