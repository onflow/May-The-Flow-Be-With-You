// update_canvas.cdc
import FlowCanvas from 0x01 // Replace with your actual contract address when deployed
import NonFungibleToken from 0x631e88ae7f1d7c20 // Testnet address

transaction(
    id: UInt64,
    patternType: String,
    seed: String,
    colorParam1: String,
    colorParam2: String
) {
    // Reference to the FlowCanvas minter for generating patterns
    let minter: &FlowCanvas.NFTMinter
    
    // Reference to the owner's collection
    let ownerCollection: &FlowCanvas.Collection
    
    prepare(signer: AuthAccount) {
        // Borrow a reference to the NFTMinter resource
        self.minter = signer.borrow<&FlowCanvas.NFTMinter>(from: FlowCanvas.MinterStoragePath)
            ?? panic("Could not borrow a reference to the NFT minter")
        
        // Borrow a reference to the owner's collection
        self.ownerCollection = signer.borrow<&FlowCanvas.Collection>(from: FlowCanvas.CollectionStoragePath)
            ?? panic("Could not borrow a reference to the owner's collection")
    }
    
    execute {
        // Borrow a reference to the specific NFT to be updated
        let canvasRef = self.ownerCollection.borrowFlowCanvas(id: id)
            ?? panic("Could not borrow a reference to the specified canvas NFT")
        
        // Parse color parameters from strings (format: "255,0,0" for red)
        let color1Components = colorParam1.split(separator: ",")
        let color2Components = colorParam2.split(separator: ",")
        
        let color1: [UInt8] = [
            UInt8.fromString(color1Components[0]) ?? 0,
            UInt8.fromString(color1Components[1]) ?? 0,
            UInt8.fromString(color1Components[2]) ?? 0
        ]
        
        let color2: [UInt8] = [
            UInt8.fromString(color2Components[0]) ?? 0,
            UInt8.fromString(color2Components[1]) ?? 0,
            UInt8.fromString(color2Components[2]) ?? 0
        ]
        
        // Create parameters for the pattern generator
        let params: {String: AnyStruct} = {
            "color1": color1,
            "color2": color2,
            "iterations": 5 as UInt64
        }
        
        // Generate pixel data using the specified pattern
        let cellSize: UInt64 = 16 // 16x16 pixel cells
        let pixelData = self.minter.generatePatternData(
            width: cellSize,
            height: cellSize,
            patternType: patternType,
            seed: seed,
            params: params
        )
        
        // Update the canvas NFT with the new pixel data
        canvasRef.updatePixelData(newPixelData: pixelData)
        
        // Update metadata
        canvasRef.metadata["patternType"] = patternType
        canvasRef.metadata["seed"] = seed
        canvasRef.metadata["lastUpdateDate"] = getCurrentBlock().timestamp.toString()
        
        log("FlowCanvas section ".concat(id.toString()).concat(" updated successfully"))
    }
}