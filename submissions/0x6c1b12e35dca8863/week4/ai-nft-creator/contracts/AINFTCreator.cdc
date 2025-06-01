// StandaloneAINFT.cdc - Works 100% without any imports!
access(all) contract StandaloneAINFT {
    
    // Events
    access(all) event ContractInitialized()
    access(all) event AINFTMinted(id: UInt64, creator: Address, aiModel: String, prompt: String)
    access(all) event AINFTTransferred(id: UInt64, from: Address?, to: Address?)
    access(all) event AIScoreUpdated(id: UInt64, newScore: UFix64)
    
    // Contract state
    access(all) var totalSupply: UInt64
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath
    
    // AI NFT Resource
    access(all) resource AINFT {
        access(all) let id: UInt64
        access(all) let creator: Address
        access(all) let createdAt: UFix64
        
        // AI-specific fields
        access(all) let aiModel: String
        access(all) let originalPrompt: String
        access(all) var aiScore: UFix64
        access(all) var evolutionCount: UInt64
        
        // NFT metadata
        access(all) var name: String
        access(all) var description: String
        access(all) var imageURL: String
        access(all) var attributes: {String: String}
        
        init(
            id: UInt64,
            creator: Address,
            aiModel: String,
            originalPrompt: String,
            name: String,
            description: String,
            imageURL: String,
            attributes: {String: String}
        ) {
            self.id = id
            self.creator = creator
            self.createdAt = getCurrentBlock().timestamp
            self.aiModel = aiModel
            self.originalPrompt = originalPrompt
            self.aiScore = 0.0
            self.evolutionCount = 0
            self.name = name
            self.description = description
            self.imageURL = imageURL
            self.attributes = attributes
        }
        
        access(all) fun updateAIScore(newScore: UFix64) {
            self.aiScore = newScore
            emit AIScoreUpdated(id: self.id, newScore: newScore)
        }
        
        access(all) fun evolveAI() {
            self.evolutionCount = self.evolutionCount + 1
        }
        
        access(all) fun updateMetadata(name: String?, description: String?, imageURL: String?) {
            if name != nil { self.name = name! }
            if description != nil { self.description = description! }
            if imageURL != nil { self.imageURL = imageURL! }
        }
        
        access(all) fun getDisplayInfo(): {String: AnyStruct} {
            return {
                "id": self.id,
                "name": self.name,
                "description": self.description,
                "imageURL": self.imageURL,
                "aiModel": self.aiModel,
                "originalPrompt": self.originalPrompt,
                "aiScore": self.aiScore,
                "evolutionCount": self.evolutionCount,
                "creator": self.creator,
                "createdAt": self.createdAt,
                "attributes": self.attributes
            }
        }
    }
    
    // Collection to hold AI NFTs
    access(all) resource Collection {
        access(all) var ownedNFTs: @{UInt64: AINFT}
        
        init() {
            self.ownedNFTs <- {}
        }
        
        access(all) fun deposit(token: @AINFT) {
            let id = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            emit AINFTTransferred(id: id, from: nil, to: self.owner?.address)
        }
        
        access(all) fun withdraw(withdrawID: UInt64): @AINFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("NFT not found")
            emit AINFTTransferred(id: token.id, from: self.owner?.address, to: nil)
            return <-token
        }
        
        access(all) fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }
        
        access(all) fun borrowNFT(id: UInt64): &AINFT? {
            return &self.ownedNFTs[id]
        }
        
        access(all) fun borrowNFTSafe(id: UInt64): &AINFT {
            return &self.ownedNFTs[id] as &AINFT? ?? panic("NFT not found")
        }
        
        access(all) fun getLength(): Int {
            return self.ownedNFTs.length
        }
    }
    
    // Public interface for collections
    access(all) resource interface CollectionPublic {
        access(all) fun getIDs(): [UInt64]
        access(all) fun borrowNFT(id: UInt64): &AINFT?
        access(all) fun getLength(): Int
        access(all) fun deposit(token: @AINFT)
    }
    
    // Minter resource for creating AI NFTs
    access(all) resource Minter {
        access(all) fun mintAINFT(
            recipient: &Collection,
            aiModel: String,
            originalPrompt: String,
            name: String,
            description: String,
            imageURL: String,
            attributes: {String: String}
        ): UInt64 {
            let nft <- create AINFT(
                id: StandaloneAINFT.totalSupply,
                creator: recipient.owner?.address ?? panic("No recipient address"),
                aiModel: aiModel,
                originalPrompt: originalPrompt,
                name: name,
                description: description,
                imageURL: imageURL,
                attributes: attributes
            )
            
            let nftID = nft.id
            
            emit AINFTMinted(
                id: nftID,
                creator: recipient.owner?.address!,
                aiModel: aiModel,
                prompt: originalPrompt
            )
            
            recipient.deposit(token: <-nft)
            StandaloneAINFT.totalSupply = StandaloneAINFT.totalSupply + 1
            
            return nftID
        }
        
        access(all) fun batchMint(
            recipient: &Collection,
            aiModel: String,
            prompts: [String],
            names: [String],
            descriptions: [String],
            imageURLs: [String]
        ): [UInt64] {
            pre {
                prompts.length == names.length &&
                names.length == descriptions.length &&
                descriptions.length == imageURLs.length:
                "Array lengths must match"
            }
            
            let mintedIDs: [UInt64] = []
            var i = 0
            
            while i < prompts.length {
                let nftID = self.mintAINFT(
                    recipient: recipient,
                    aiModel: aiModel,
                    originalPrompt: prompts[i],
                    name: names[i],
                    description: descriptions[i],
                    imageURL: imageURLs[i],
                    attributes: {"batch": "true", "index": i.toString()}
                )
                mintedIDs.append(nftID)
                i = i + 1
            }
            
            return mintedIDs
        }
    }
    
    // Public functions
    access(all) fun createEmptyCollection(): @Collection {
        return <-create Collection()
    }
    
    access(all) fun createMinter(): @Minter {
        return <-create Minter()
    }
    
    // Get contract statistics
    access(all) fun getStats(): {String: AnyStruct} {
        return {
            "totalSupply": self.totalSupply,
            "contractName": "StandaloneAINFT",
            "version": "1.0.0",
            "features": ["AI Generation", "Metadata Storage", "Evolution Tracking", "Batch Minting"]
        }
    }
    
    // Get NFT info by ID (public function)
    access(all) fun getNFTInfo(owner: Address, nftID: UInt64): {String: AnyStruct}? {
        let account = getAccount(owner)
        
        if let collectionRef = account.capabilities.get<&Collection>(self.CollectionPublicPath).borrow() {
            if let nft = collectionRef.borrowNFT(id: nftID) {
                return nft.getDisplayInfo()
            }
        }
        return nil
    }
    
    // Get all NFTs for an owner
    access(all) fun getAllNFTs(owner: Address): [{String: AnyStruct}] {
        let account = getAccount(owner)
        let nfts: [{String: AnyStruct}] = []
        
        if let collectionRef = account.capabilities.get<&Collection>(self.CollectionPublicPath).borrow() {
            for id in collectionRef.getIDs() {
                if let nft = collectionRef.borrowNFT(id: id) {
                    nfts.append(nft.getDisplayInfo())
                }
            }
        }
        return nfts
    }
    
    init() {
        self.totalSupply = 0
        self.CollectionStoragePath = /storage/StandaloneAINFTCollection
        self.CollectionPublicPath = /public/StandaloneAINFTCollection
        self.MinterStoragePath = /storage/StandaloneAINFTMinter
        
        // Create collection for the contract deployer
        let collection <- create Collection()
        self.account.storage.save(<-collection, to: self.CollectionStoragePath)
        
        // Create public capability
        let collectionCap = self.account.capabilities.storage.issue<&Collection>(self.CollectionStoragePath)
        self.account.capabilities.publish(collectionCap, at: self.CollectionPublicPath)
        
        // Create minter for the contract deployer
        let minter <- create Minter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)
        
        emit ContractInitialized()
    }
}