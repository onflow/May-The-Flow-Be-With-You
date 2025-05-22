// mint_canvas.cdc
import FlowCanvas from 0x01 // Replace with your actual contract address when deployed
import NonFungibleToken from 0x631e88ae7f1d7c20 // Testnet address

transaction(
    x: Int,
    y: Int,
    patternType: String,
    seed: String,
    colorParam1: String,
    colorParam2: String
) {
    // Reference to the FlowCanvas minter
    let minter: &FlowCanvas.NFTMinter
    
    // Reference to the receiver's collection
    let recipientCollection: &{NonFungibleToken.CollectionPublic}
    
    prepare(signer: AuthAccount) {
        // Borrow a reference to the NFTMinter resource
        self.minter = signer.borrow<&FlowCanvas.NFTMinter>(from: FlowCanvas.MinterStoragePath)
            ?? panic("Could not borrow a reference to the NFT minter")
        
        // Get the recipient's public collection capability
        let recipientCollectionCap = signer.getCapability<&{NonFungibleToken.CollectionPublic}>(
            FlowCanvas.CollectionPublicPath
        )
        
        // Borrow a reference from the capability
        self.recipientCollection = recipientCollectionCap.borrow()
            ?? panic("Could not borrow receiver collection reference")
    }
    
    execute {
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
        
        // Define some basic evolution rules
        let evolutionRules: {String: String} = {
            "timeInterval": "86400.0", // Evolve once per day (in seconds)
            "neighborInfluence": "0.2", // 20% influence from neighbors
            "randomFactor": "0.1"       // 10% random variation
        }
        
        // Metadata about the canvas section
        let metadata: {String: String} = {
            "patternType": patternType,
            "seed": seed,
            "creationDate": getCurrentBlock().timestamp.toString(),
            "cellSize": cellSize.toString()
        }
        
        // Mint the NFT
        self.minter.mintNFT(
            recipient: self.recipientCollection,
            x: x,
            y: y,
            pixelData: pixelData,
            metadata: metadata,
            evolutionRules: evolutionRules
        )
        
        log("FlowCanvas section minted at position (".concat(x.toString()).concat(",").concat(y.toString()).concat(")"))
    }
}