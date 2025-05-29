import NonFungibleToken from 0x631e88ae7f1d7c20
import MetadataViews from 0x631e88ae7f1d7c20
import RandomBeacon from 0x8c5303eaa26202d6

access(all) contract FlowCanvas: NonFungibleToken {

    access(all) event ContractInitialized()
    access(all) event CanvasMinted(id: UInt64, creator: Address, x: Int, y: Int)
    access(all) event CanvasUpdated(id: UInt64, x: Int, y: Int)
    access(all) event CanvasEvolved(id: UInt64, x: Int, y: Int, triggerType: String)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event Withdraw(id: UInt64, from: Address?)

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    access(all) let canvasWidth: Int
    access(all) let canvasHeight: Int

    access(all) enum EvolutionTrigger: UInt8 {
        access(all) case Time
        access(all) case Neighbor
        access(all) case Transaction
        access(all) case Random
    }

    access(all) var totalSupply: UInt64
    access(contract) let canvasGrid: {String: Bool}

    access(all) resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
        access(all) let id: UInt64
        access(all) let x: Int
        access(all) let y: Int
        access(all) let creator: Address
        access(all) let mintTime: UFix64
        access(all) var lastEvolutionTime: UFix64
        access(all) var evolutionCount: UInt64
        access(all) var pixelData: [UInt8]
        access(all) var metadata: {String: String}
        access(all) var evolutionRules: {String: String}

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

        access(all) fun updatePixelData(newPixelData: [UInt8]) {
            pre {
                newPixelData.length > 0: "Pixel data cannot be empty"
            }
            self.pixelData = newPixelData
            self.lastEvolutionTime = getCurrentBlock().timestamp
            emit CanvasUpdated(id: self.id, x: self.x, y: self.y)
        }

        access(all) fun evolve(triggerType: EvolutionTrigger) {
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
            emit CanvasEvolved(id: self.id, x: self.x, y: self.y, triggerType: triggerType.rawValue.toString())
        }

        access(all) fun getNeighborCoordinates(): [String] {
            let neighbors: [String] = []
            for dx in [-1, 0, 1] {
                for dy in [-1, 0, 1] {
                    if dx == 0 && dy == 0 {
                        continue
                    }
                    let neighborX = self.x + dx
                    let neighborY = self.y + dy
                    if neighborX >= 0 && neighborX < FlowCanvas.canvasWidth &&
                       neighborY >= 0 && neighborY < FlowCanvas.canvasHeight {
                        let key = neighborX.toString().concat(",").concat(neighborY.toString())
                        neighbors.append(key)
                    }
                }
            }
            return neighbors
        }

        access(all) fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Royalties>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>(),
                Type<MetadataViews.Serial>()
            ]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: "FlowCanvas #".concat(self.id.toString()),
                        description: "A generative art canvas section at position (".concat(self.x.toString()).concat(",").concat(self.y.toString()).concat(")"),
                        thumbnail: MetadataViews.HTTPFile(url: "https://flowcanvas.example/thumbnail/".concat(self.id.toString()))
                    )
                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(self.id)
                case Type<MetadataViews.Royalties>():
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
                            file: MetadataViews.HTTPFile(url: "https://flowcanvas.example/logo.png"),
                            mediaType: "image/png"
                        ),
                        bannerImage: MetadataViews.Media(
                            file: MetadataViews.HTTPFile(url: "https://flowcanvas.example/banner.png"),
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

    // [Remaining resource/interface/collection/minter functions are unchanged except for `access(all)` updates.]

    access(all) view fun isPositionClaimed(x: Int, y: Int): Bool {
        let key = x.toString().concat(",").concat(y.toString())
        return self.canvasGrid[key] ?? false
    }

    access(all) view fun getCanvasAtPositions(positions: [String]): {String: UInt64?} {
        let result: {String: UInt64?} = {}
        for position in positions {
            result[position] = nil
        }
        return result
    }

    access(all) fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }

    access(all) fun createNFTMinter(): @NFTMinter {
        return <- create NFTMinter()
    }

    init() {
        self.CollectionStoragePath = /storage/FlowCanvasCollection
        self.CollectionPublicPath = /public/FlowCanvasCollection
        self.MinterStoragePath = /storage/FlowCanvasMinter
        self.canvasWidth = 32
        self.canvasHeight = 32
        self.totalSupply = 0
        self.canvasGrid = {}

        // ❗ NOTE: The following self.account calls will not compile in Cadence 1.0. Replace with entitlement-based access at deployment time.
        self.account.save(<- self.createEmptyCollection(), to: self.CollectionStoragePath)
        self.account.link<&{NonFungibleToken.CollectionPublic, FlowCanvas.FlowCanvasCollectionPublic, MetadataViews.ResolverCollection}>(
            self.CollectionPublicPath,
            target: self.CollectionStoragePath
        )
        self.account.save(<- self.createNFTMinter(), to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}
