// FlowCanvas.cdc
import NonFungibleToken from 0x631e88ae7f1d7c20 // Testnet address
import MetadataViews from 0x631e88ae7f1d7c20 // Testnet address
import RandomBeacon from 0x8c5303eaa26202d6 // Testnet RandomBeacon address

pub contract FlowCanvas: NonFungibleToken {

    // Events
    pub event ContractInitialized()
    pub event CanvasMinted(id: UInt64, creator: Address, x: Int, y: Int)
    pub event CanvasUpdated(id: UInt64, x: Int, y: Int)
    pub event CanvasEvolved(id: UInt64, x: Int, y: Int, triggerType: String)
    pub event Deposit(id: UInt64, to: Address?)
    pub event Withdraw(id: UInt64, from: Address?)
    
    // Named Paths
    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath
    pub let MinterStoragePath: StoragePath

    // Canvas dimensions
    pub let canvasWidth: Int
    pub let canvasHeight: Int
    
    // Evolution trigger types
    pub enum EvolutionTrigger: UInt8 {
        pub case Time
        pub case Neighbor
        pub case Transaction
        pub case Random
    }
    
    // Total number of minted CanvasNFTs
    pub var totalSupply: UInt64
    
    // Stored mapping of canvas pixels
    access(contract) let canvasGrid: {String: Bool}

    // Canvas Cell Resource
    pub resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
        pub let id: UInt64
        
        // Canvas cell position
        pub let x: Int
        pub let y: Int
        
        // Creator address
        pub let creator: Address
        
        // Timestamp when the canvas was minted
        pub let mintTime: UFix64
        
        // Last evolution timestamp
        pub var lastEvolutionTime: UFix64
        
        // Number of evolutions
        pub var evolutionCount: UInt64
        
        // Canvas data - color values for each pixel in the cell
        // For simplicity, we'll use a flattened array where each group of 3 values
        // represents RGB values for a pixel
        pub var pixelData: [UInt8]
        
        // Canvas metadata - can include additional information
        pub var metadata: {String: String}
        
        // Evolution rules - defines how this canvas evolves over time
        pub var evolutionRules: {String: String}
        
        init(
            id: UInt64,
            x: Int,
            y: Int,
            creator: Address,
            pixelData: [UInt8],
            metadata: {String: String},
            evolutionRules: {String: String}
        ) {
            pre {
                x >= 0 && x < FlowCanvas.canvasWidth: "X coordinate out of bounds"
                y >= 0 && y < FlowCanvas.canvasHeight: "Y coordinate out of bounds"
                pixelData.length > 0: "Pixel data cannot be empty"
            }
            
            self.id = id
            self.x = x
            self.y = y
            self.creator = creator
            self.mintTime = getCurrentBlock().timestamp
            self.lastEvolutionTime = self.mintTime
            self.evolutionCount = 0
            self.pixelData = pixelData
            self.metadata = metadata
            self.evolutionRules = evolutionRules
        }
        
        // Update the pixel data
        pub fun updatePixelData(newPixelData: [UInt8]) {
            pre {
                newPixelData.length > 0: "Pixel data cannot be empty"
            }
            
            self.pixelData = newPixelData
            self.lastEvolutionTime = getCurrentBlock().timestamp
            
            emit CanvasUpdated(id: self.id, x: self.x, y: self.y)
        }
        
        // Evolve the canvas based on a trigger type
        pub fun evolve(triggerType: EvolutionTrigger) {
            // Apply evolution rules based on trigger type
            // In a real implementation, this would contain complex logic to evolve the pixel data
            // based on the rules defined in evolutionRules
            
            // For demonstration purposes, we'll make a simple change to the first pixel
            if self.pixelData.length >= 3 {
                let randomValue = RandomBeacon.getRandomField()
                let r = UInt8(randomValue % 256)
                let g = UInt8((randomValue / 256) % 256)
                let b = UInt8((randomValue / 65536) % 256)
                
                self.pixelData[0] = r
                self.pixelData[1] = g
                self.pixelData[2] = b
            }
            
            self.lastEvolutionTime = getCurrentBlock().timestamp
            self.evolutionCount = self.evolutionCount + 1
            
            emit CanvasEvolved(
                id: self.id, 
                x: self.x, 
                y: self.y, 
                triggerType: triggerType.rawValue.toString()
            )
        }
        
        // Get neighboring cell coordinates
        pub fun getNeighborCoordinates(): [String] {
            let neighbors: [String] = []
            
            // Check all 8 surrounding cells
            for dx in [-1, 0, 1] {
                for dy in [-1, 0, 1] {
                    // Skip the cell itself
                    if dx == 0 && dy == 0 {
                        continue
                    }
                    
                    let neighborX = self.x + dx
                    let neighborY = self.y + dy
                    
                    // Ensure coordinates are within bounds
                    if neighborX >= 0 && neighborX < FlowCanvas.canvasWidth &&
                       neighborY >= 0 && neighborY < FlowCanvas.canvasHeight {
                        let key = neighborX.toString().concat(",").concat(neighborY.toString())
                        neighbors.append(key)
                    }
                }
            }
            
            return neighbors
        }
        
        // Implement required functions from MetadataViews.Resolver
        pub fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Royalties>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>(),
                Type<MetadataViews.Serial>()
            ]
        }
        
        pub fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: "FlowCanvas #".concat(self.id.toString()),
                        description: "A generative art canvas section at position (".concat(self.x.toString()).concat(",").concat(self.y.toString()).concat(")"),
                        thumbnail: MetadataViews.HTTPFile(
                            url: "https://flowcanvas.example/thumbnail/".concat(self.id.toString())
                        )
                    )
                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(
                        self.id
                    )
                case Type<MetadataViews.Royalties>():
                    // No royalties for simplicity
                    return MetadataViews.Royalties([])
                case Type<MetadataViews.ExternalURL>():
                    return MetadataViews.ExternalURL("https://flowcanvas.example/view/".concat(self.id.toString()))
                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: FlowCanvas.CollectionStoragePath,
                        publicPath: FlowCanvas.CollectionPublicPath,
                        providerPath: /private/FlowCanvasCollection,
                        publicCollection: Type<&FlowCanvas.Collection{FlowCanvas.FlowCanvasCollectionPublic}>(),
                        publicLinkedType: Type<&FlowCanvas.Collection{FlowCanvas.FlowCanvasCollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Receiver,MetadataViews.ResolverCollection}>(),
                        providerLinkedType: Type<&FlowCanvas.Collection{FlowCanvas.FlowCanvasCollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Provider,MetadataViews.ResolverCollection}>(),
                        createEmptyCollectionFunction: (fun (): @NonFungibleToken.Collection {
                            return <-FlowCanvas.createEmptyCollection()
                        })
                    )
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return MetadataViews.NFTCollectionDisplay(
                        name: "FlowCanvas Collection",
                        description: "A collection of generative art canvas sections that evolve over time",
                        externalURL: MetadataViews.ExternalURL("https://flowcanvas.example"),
                        squareImage: MetadataViews.Media(
                            file: MetadataViews.HTTPFile(
                                url: "https://flowcanvas.example/logo.png"
                            ),
                            mediaType: "image/png"
                        ),
                        bannerImage: MetadataViews.Media(
                            file: MetadataViews.HTTPFile(
                                url: "https://flowcanvas.example/banner.png"
                            ),
                            mediaType: "image/png"
                        ),
                        socials: {
                            "twitter": MetadataViews.ExternalURL("https://twitter.com/flowcanvas")
                        }
                    )
            }
            
            return nil
        }
    }

    // Collection resource interface and implementation
    pub resource interface FlowCanvasCollectionPublic {
        pub fun deposit(token: @NonFungibleToken.NFT)
        pub fun getIDs(): [UInt64]
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT
        pub fun borrowFlowCanvas(id: UInt64): &FlowCanvas.NFT? {
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow FlowCanvas reference: the ID of the returned reference is incorrect"
            }
        }
    }

    pub resource Collection: FlowCanvasCollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, MetadataViews.ResolverCollection {
        // Dictionary of NFT conforming tokens
        // NFT is a resource type with an `UInt64` ID field
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        init () {
            self.ownedNFTs <- {}
        }

        // Withdraw removes an NFT from the collection and moves it to the caller
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("Missing NFT")

            emit Withdraw(id: token.id, from: self.owner?.address)

            return <-token
        }

        // Deposit takes a NFT and adds it to the collections dictionary
        // and adds the ID to the id array
        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @FlowCanvas.NFT

            let id: UInt64 = token.id

            // Add the new token to the dictionary
            let oldToken <- self.ownedNFTs[id] <- token

            emit Deposit(id: id, to: self.owner?.address)

            destroy oldToken
        }

        // GetIDs returns an array of the IDs that are in the collection
        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        // BorrowNFT gets a reference to an NFT in the collection
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return (&self.ownedNFTs[id] as &NonFungibleToken.NFT?)!
        }
        
        // BorrowFlowCanvas gets a reference to a FlowCanvas NFT in the collection
        pub fun borrowFlowCanvas(id: UInt64): &FlowCanvas.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = (&self.ownedNFTs[id] as auth &NonFungibleToken.NFT?)!
                return ref as! &FlowCanvas.NFT
            }
            
            return nil
        }

        // Implement resolver functions from MetadataViews.ResolverCollection
        pub fun borrowViewResolver(id: UInt64): &AnyResource{MetadataViews.Resolver} {
            let nft = (&self.ownedNFTs[id] as auth &NonFungibleToken.NFT?)!
            let flowCanvas = nft as! &FlowCanvas.NFT
            return flowCanvas
        }

        destroy() {
            destroy self.ownedNFTs
        }
    }

    // Resource that allows creation of FlowCanvas NFTs
    pub resource NFTMinter {
        // Mint a new FlowCanvas NFT
        pub fun mintNFT(
            recipient: &{NonFungibleToken.CollectionPublic},
            x: Int,
            y: Int,
            pixelData: [UInt8],
            metadata: {String: String},
            evolutionRules: {String: String}
        ) {
            pre {
                x >= 0 && x < FlowCanvas.canvasWidth: "X coordinate out of bounds"
                y >= 0 && y < FlowCanvas.canvasHeight: "Y coordinate out of bounds"
                pixelData.length > 0: "Pixel data cannot be empty"
                
                // Check if the position is already taken
                !FlowCanvas.isPositionClaimed(x: x, y: y): "This canvas position is already claimed"
            }
            
            // Create the NFT
            let nft <- create NFT(
                id: FlowCanvas.totalSupply,
                x: x,
                y: y,
                creator: recipient.owner!.address,
                pixelData: pixelData,
                metadata: metadata,
                evolutionRules: evolutionRules
            )
            
            // Update the grid to mark this position as claimed
            let key = x.toString().concat(",").concat(y.toString())
            FlowCanvas.canvasGrid[key] = true
            
            // Deposit it in the recipient's account
            recipient.deposit(token: <-nft)
            
            // Increment the ID counter
            FlowCanvas.totalSupply = FlowCanvas.totalSupply + 1
            
            emit CanvasMinted(
                id: FlowCanvas.totalSupply - 1,
                creator: recipient.owner!.address,
                x: x,
                y: y
            )
        }
        
        // Generate random pixel data for a canvas section
        pub fun generateRandomPixelData(
            width: UInt64,
            height: UInt64,
            seed: String
        ): [UInt8] {
            pre {
                width > 0 && height > 0: "Width and height must be positive"
            }
            
            // Get random value from Flow's randomness beacon
            let randomValue = RandomBeacon.getRandomField()
            
            // Create a pixel array with 3 bytes (RGB) per pixel
            let totalPixels = width * height
            let pixelData: [UInt8] = []
            
            // Generate pixel data using randomness and various algorithms
            var currentRandom = randomValue
            
            var i: UInt64 = 0
            while i < totalPixels {
                // Generate RGB values for each pixel
                // Using different parts of the random value for each component
                let r = UInt8(currentRandom % 256)
                currentRandom = currentRandom / 256
                
                let g = UInt8(currentRandom % 256)
                currentRandom = currentRandom / 256
                
                let b = UInt8(currentRandom % 256)
                currentRandom = currentRandom / 256
                
                // If we've used up our random bits, get a new random value
                if currentRandom == 0 {
                    currentRandom = RandomBeacon.getRandomField()
                }
                
                // Add RGB values to pixel data
                pixelData.append(r)
                pixelData.append(g)
                pixelData.append(b)
                
                i = i + 1
            }
            
            return pixelData
        }
        
        // Generate pixelData using a pattern algorithm
        pub fun generatePatternData(
            width: UInt64,
            height: UInt64,
            patternType: String,
            seed: String,
            params: {String: AnyStruct}
        ): [UInt8] {
            pre {
                width > 0 && height > 0: "Width and height must be positive"
            }
            
            let pixelData: [UInt8] = []
            
            // Different patterns based on patternType
            if patternType == "gradient" {
                // Create a gradient pattern
                // Get color1 and color2 from params, or use defaults
                let color1 = params["color1"] as? [UInt8] ?? [255, 0, 0]  // Default to red
                let color2 = params["color2"] as? [UInt8] ?? [0, 0, 255]  // Default to blue
                
                var i: UInt64 = 0
                while i < width * height {
                    // Calculate position within the grid (row, col)
                    let row = i / width
                    let col = i % width
                    
                    // Calculate interpolation factor based on position
                    let factor = UFix64(col) / UFix64(width - 1)
                    
                    // Interpolate between color1 and color2
                    let r = UInt8(UFix64(color1[0]) * (1.0 - factor) + UFix64(color2[0]) * factor)
                    let g = UInt8(UFix64(color1[1]) * (1.0 - factor) + UFix64(color2[1]) * factor)
                    let b = UInt8(UFix64(color1[2]) * (1.0 - factor) + UFix64(color2[2]) * factor)
                    
                    pixelData.append(r)
                    pixelData.append(g)
                    pixelData.append(b)
                    
                    i = i + 1
                }
            } else if patternType == "cellular" {
                // Create a cellular automaton pattern (simple version)
                // Get random value from Flow's randomness beacon
                let randomValue = RandomBeacon.getRandomField()
                
                // First, initialize random cells
                var grid: [[Bool]] = []
                
                // Fill grid with random initial state
                var currentRandom = randomValue
                var rowIdx: UInt64 = 0
                while rowIdx < height {
                    var row: [Bool] = []
                    var colIdx: UInt64 = 0
                    while colIdx < width {
                        let isAlive = (currentRandom % 2) == 1
                        row.append(isAlive)
                        
                        currentRandom = currentRandom / 2
                        if currentRandom == 0 {
                            currentRandom = RandomBeacon.getRandomField()
                        }
                        
                        colIdx = colIdx + 1
                    }
                    grid.append(row)
                    rowIdx = rowIdx + 1
                }
                
                // Now evolve the grid a few times
                let iterations = params["iterations"] as? UInt64 ?? 3
                
                var iter: UInt64 = 0
                while iter < iterations {
                    grid = self.evolveGrid(grid: grid, width: width, height: height)
                    iter = iter + 1
                }
                
                // Convert final grid to pixel data
                let aliveColor = params["aliveColor"] as? [UInt8] ?? [0, 0, 0]     // Default to black
                let deadColor = params["deadColor"] as? [UInt8] ?? [255, 255, 255] // Default to white
                
                rowIdx = 0
                while rowIdx < height {
                    var colIdx: UInt64 = 0
                    while colIdx < width {
                        let isAlive = grid[rowIdx][colIdx]
                        
                        if isAlive {
                            pixelData.append(aliveColor[0])
                            pixelData.append(aliveColor[1])
                            pixelData.append(aliveColor[2])
                        } else {
                            pixelData.append(deadColor[0])
                            pixelData.append(deadColor[1])
                            pixelData.append(deadColor[2])
                        }
                        
                        colIdx = colIdx + 1
                    }
                    rowIdx = rowIdx + 1
                }
            } else {
                // Default to random data if pattern type not recognized
                return self.generateRandomPixelData(width: width, height: height, seed: seed)
            }
            
            return pixelData
        }
        
        // Helper function for cellular automaton pattern
        // Applies Conway's Game of Life rules to evolve the grid
        access(self) fun evolveGrid(grid: [[Bool]], width: UInt64, height: UInt64): [[Bool]] {
            var newGrid: [[Bool]] = []
            
            var rowIdx: UInt64 = 0
            while rowIdx < height {
                var newRow: [Bool] = []
                var colIdx: UInt64 = 0
                while colIdx < width {
                    let neighbors = self.countNeighbors(grid: grid, row: rowIdx, col: colIdx, width: width, height: height)
                    let isAlive = grid[rowIdx][colIdx]
                    
                    // Apply Conway's Game of Life rules
                    var willBeAlive = false
                    if isAlive {
                        // A live cell survives if it has 2 or 3 live neighbors
                        willBeAlive = neighbors == 2 || neighbors == 3
                    } else {
                        // A dead cell becomes alive if it has exactly 3 live neighbors
                        willBeAlive = neighbors == 3
                    }
                    
                    newRow.append(willBeAlive)
                    colIdx = colIdx + 1
                }
                newGrid.append(newRow)
                rowIdx = rowIdx + 1
            }
            
            return newGrid
        }
        
        // Count live neighbors for cellular automaton
        access(self) fun countNeighbors(grid: [[Bool]], row: UInt64, col: UInt64, width: UInt64, height: UInt64): UInt64 {
            var count: UInt64 = 0
            
            // Check all 8 surrounding cells
            for dr in [-1, 0, 1] {
                for dc in [-1, 0, 1] {
                    // Skip the cell itself
                    if dr == 0 && dc == 0 {
                        continue
                    }
                    
                    // Calculate neighbor position with wrapping
                    let newRow = (Int(row) + dr + Int(height)) % Int(height)
                    let newCol = (Int(col) + dc + Int(width)) % Int(width)
                    
                    // Check if the neighbor is alive
                    if grid[newRow][newCol] {
                        count = count + 1
                    }
                }
            }
            
            return count
        }
    }

    // Check if a canvas position is already claimed
    pub fun isPositionClaimed(x: Int, y: Int): Bool {
        let key = x.toString().concat(",").concat(y.toString())
        return self.canvasGrid[key] ?? false
    }
    
    // Get IDs of all canvas cells at specified positions
    pub fun getCanvasAtPositions(positions: [String]): {String: UInt64?} {
        let result: {String: UInt64?} = {}
        
        // In a real implementation, there would be a way to look up
        // which NFT ID corresponds to which position
        // For now, we'll just return nil for all positions
        for position in positions {
            result[position] = nil
        }
        
        return result
    }
    
    // Creates an empty Collection resource and returns it
    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }

    // Create a new Minter resource
    pub fun createNFTMinter(): @NFTMinter {
        return <- create NFTMinter()
    }

    init() {
        // Set the named paths
        self.CollectionStoragePath = /storage/FlowCanvasCollection
        self.CollectionPublicPath = /public/FlowCanvasCollection
        self.MinterStoragePath = /storage/FlowCanvasMinter
        
        // Set canvas dimensions
        self.canvasWidth = 32
        self.canvasHeight = 32
        
        // Initialize the ID counter
        self.totalSupply = 0
        
        // Initialize canvas grid
        self.canvasGrid = {}
        
        // Create a Collection for the deployer
        self.account.save(<- self.createEmptyCollection(), to: self.CollectionStoragePath)
        
        // Create a public capability for the Collection
        self.account.link<&{NonFungibleToken.CollectionPublic, FlowCanvas.FlowCanvasCollectionPublic, MetadataViews.ResolverCollection}>(
            self.CollectionPublicPath,
            target: self.CollectionStoragePath
        )
        
        // Create a Minter resource and save it
        self.account.save(<- self.createNFTMinter(), to: self.MinterStoragePath)
        
        emit ContractInitialized()
    }
}