// get_canvas_details.cdc
import FlowCanvas from 0x01 // Replace with your actual contract address when deployed
import MetadataViews from 0x631e88ae7f1d7c20 // Testnet address

pub struct CanvasDetails {
    pub let id: UInt64
    pub let owner: Address
    pub let x: Int
    pub let y: Int
    pub let creator: Address
    pub let mintTime: UFix64
    pub let lastEvolutionTime: UFix64
    pub let evolutionCount: UInt64
    pub let metadata: {String: String}
    pub let pixelData: [UInt8]
    
    init(
        id: UInt64,
        owner: Address,
        x: Int,
        y: Int,
        creator: Address,
        mintTime: UFix64,
        lastEvolutionTime: UFix64,
        evolutionCount: UInt64,
        metadata: {String: String},
        pixelData: [UInt8]
    ) {
        self.id = id
        self.owner = owner
        self.x = x
        self.y = y
        self.creator = creator
        self.mintTime = mintTime
        self.lastEvolutionTime = lastEvolutionTime
        self.evolutionCount = evolutionCount
        self.metadata = metadata
        self.pixelData = pixelData
    }
}

pub fun main(address: Address, id: UInt64): CanvasDetails? {
    // Get the public collection capability
    let collectionCap = getAccount(address).getCapability<&{FlowCanvas.FlowCanvasCollectionPublic}>(
        FlowCanvas.CollectionPublicPath
    )
    
    // Borrow the collection reference
    if let collection = collectionCap.borrow() {
        // Borrow the NFT reference
        if let canvas = collection.borrowFlowCanvas(id: id) {
            return CanvasDetails(
                id: canvas.id,
                owner: address,
                x: canvas.x,
                y: canvas.y,
                creator: canvas.creator,
                mintTime: canvas.mintTime,
                lastEvolutionTime: canvas.lastEvolutionTime,
                evolutionCount: canvas.evolutionCount,
                metadata: canvas.metadata,
                pixelData: canvas.pixelData
            )
        }
    }
    
    return nil
}