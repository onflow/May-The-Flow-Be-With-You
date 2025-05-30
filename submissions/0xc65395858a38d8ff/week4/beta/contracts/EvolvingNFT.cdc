// EvolvingNFT.cdc
// Core contract for modular evolving NFTs

import "NonFungibleToken"
import "MetadataViews"
import "ViewResolver"
import "TraitModule"

access(all) contract EvolvingNFT: NonFungibleToken {
    
    // === CORE STATE ===
    access(all) var totalSupply: UInt64
    
    // === MODULE REGISTRY ===
    access(self) var registeredModules: {String: Address} // moduleType -> contract address
    access(self) var moduleContracts: {String: String}    // moduleType -> contract name
    
    // === EVENTS ===
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event NFTMinted(id: UInt64, name: String)
    access(all) event TraitEvolved(nftID: UInt64, traitType: String, oldValue: String, newValue: String)
    access(all) event ModuleRegistered(moduleType: String, contractAddress: Address, contractName: String)
    access(all) event ChildCreated(parentID: UInt64, childID: UInt64)
    
    // === STORAGE PATHS ===
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath
    
    // === CORE NFT RESOURCE ===
    access(all) resource NFT: NonFungibleToken.NFT, ViewResolver.Resolver {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) var description: String
        access(all) let birthBlock: UInt64
        
        // === MODULAR TRAITS ===
        access(all) var traits: @{String: {TraitModule.Trait}}
        
        init(id: UInt64, name: String, description: String, initialTraits: @{String: {TraitModule.Trait}}) {
            self.id = id
            self.name = name
            self.description = description
            self.birthBlock = getCurrentBlock().height
            self.traits <- initialTraits
        }
        
        // === TRAIT MANAGEMENT ===
        access(all) view fun getTraitValue(traitType: String): String? {
            // Check if trait already exists
            if let traitRef = &self.traits[traitType] as &{TraitModule.Trait}? {
                return traitRef.getValue()
            }
            
            // 🚀 LAZY INITIALIZATION: If trait doesn't exist but module is registered
            if EvolvingNFT.registeredModules.containsKey(traitType) {
                // This is a view function, so we can't modify state here
                // We'll need to modify this approach for non-view operations
                return nil  // For now, return nil in view context
            }
            
            return nil
        }
        
        // NEW: Non-view version that can do lazy initialization
        access(all) fun ensureTraitExists(traitType: String): Bool {
            // If trait already exists, nothing to do
            if self.traits.containsKey(traitType) {
                return true
            }
            
            // 🚀 LAZY INITIALIZATION: Create default trait if module exists
            if let factory = EvolvingNFT.getModuleFactory(moduleType: traitType) {
                let defaultTrait <- factory.createDefaultTrait()
                self.addTrait(traitType: traitType, trait: <- defaultTrait)
                return true
            }
            
            return false
        }
        
        // Modified to use lazy initialization
        access(all) fun getTraitValueWithInit(traitType: String): String? {
            // Ensure trait exists (lazy init if needed)
            if self.ensureTraitExists(traitType: traitType) {
                if let traitRef = &self.traits[traitType] as &{TraitModule.Trait}? {
                    return traitRef.getValue()
                }
            }
            return nil
        }
        
        access(all) view fun getTraitDisplay(traitType: String): String? {
            if let traitRef = &self.traits[traitType] as &{TraitModule.Trait}? {
                return traitRef.getDisplayName()
            }
            return nil
        }
        
        access(all) fun setTraitValue(traitType: String, newValue: String) {
            if let traitRef = &self.traits[traitType] as &{TraitModule.Trait}? {
                traitRef.setValue(newValue: newValue)
            }
        }
        
        access(all) fun addTrait(traitType: String, trait: @{TraitModule.Trait}) {
            let oldTrait <- self.traits[traitType] <- trait
            destroy oldTrait
        }
        
        access(all) fun removeTrait(traitType: String): @{TraitModule.Trait}? {
            return <- self.traits.remove(key: traitType)
        }
        
        // === EVOLUTION ===
        access(all) fun evolve(seed: UInt64) {
            for traitType in self.traits.keys {
                if let traitRef = &self.traits[traitType] as &{TraitModule.Trait}? {
                    let oldValue = traitRef.getValue()
                    let traitSeed = seed ^ UInt64(traitType.length)
                    let newValue = traitRef.evolve(seed: traitSeed)
                    
                    emit TraitEvolved(
                        nftID: self.id,
                        traitType: traitType,
                        oldValue: oldValue,
                        newValue: newValue
                    )
                }
            }
        }
        
        // === REPRODUCTION ===
        access(all) fun reproduce(otherParent: &NFT, childSeed: UInt64): @{String: {TraitModule.Trait}} {
            let childTraits: @{String: {TraitModule.Trait}} <- {}
            
            // Process traits that exist in both parents
            for traitType in self.traits.keys {
                if otherParent.traits.containsKey(traitType) {
                    if let factory = EvolvingNFT.getModuleFactory(moduleType: traitType) {
                        // Get trait references for this parent
                        if let trait1Ref = &self.traits[traitType] as &{TraitModule.Trait}? {
                            // Get trait value from other parent (avoiding nested references)
                            let parent2TraitValue = otherParent.getTraitValue(traitType: traitType)
                            
                            if parent2TraitValue != nil {
                                // Create a temporary trait for parent2 to use in reproduction
                                let parent2TempTrait <- factory.createTraitWithValue(value: parent2TraitValue!)
                                
                                // Now we can do reproduction with both trait references
                                let childTrait <- factory.createChildTrait(
                                    parent1: trait1Ref,
                                    parent2: &parent2TempTrait as &{TraitModule.Trait},
                                    seed: childSeed
                                )
                                
                                // Clean up temp trait and store child trait
                                destroy parent2TempTrait
                                let oldTrait <- childTraits[traitType] <- childTrait
                                destroy oldTrait
                            }
                        }
                    }
                }
            }
            
            return <- childTraits
        }
        
        // === METADATA VIEWS ===
        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Serial>()
            ]
        }
        
        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    var displayDescription = self.description
                    for traitType in self.traits.keys {
                        if let display = self.getTraitDisplay(traitType: traitType) {
                            displayDescription = displayDescription.concat("\n").concat(display)
                        }
                    }
                    
                    return MetadataViews.Display(
                        name: self.name,
                        description: displayDescription,
                        thumbnail: MetadataViews.HTTPFile(url: "https://example.com/nft/".concat(self.id.toString()))
                    )
                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(self.id)
            }
            return nil
        }
        
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-EvolvingNFT.createEmptyCollection(nftType: Type<@EvolvingNFT.NFT>())
        }
    }
    
    // === COLLECTION RESOURCE ===
    access(all) resource Collection: NonFungibleToken.Collection {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}
        
        init() {
            self.ownedNFTs <- {}
        }
        
        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }
        
        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @EvolvingNFT.NFT
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }
        
        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }
        
        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
        }
        
        access(all) view fun borrowEvolvingNFT(id: UInt64): &EvolvingNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
                return ref as! &EvolvingNFT.NFT
            }
            return nil
        }
        
        // === COLLECTION OPERATIONS ===
        access(all) fun evolveNFT(id: UInt64, seed: UInt64) {
            if let nft = self.borrowEvolvingNFT(id: id) {
                nft.evolve(seed: seed)
            }
        }
        
        access(all) fun reproduceNFTs(parent1ID: UInt64, parent2ID: UInt64): @EvolvingNFT.NFT? {
            let parent1 = self.borrowEvolvingNFT(id: parent1ID) ?? panic("Parent 1 not found")
            let parent2 = self.borrowEvolvingNFT(id: parent2ID) ?? panic("Parent 2 not found")
            
            let currentBlock = getCurrentBlock()
            let childSeed = UInt64(currentBlock.timestamp) ^ currentBlock.height ^ parent1ID ^ parent2ID
            
            let childTraits <- parent1.reproduce(otherParent: parent2, childSeed: childSeed)
            
            EvolvingNFT.totalSupply = EvolvingNFT.totalSupply + 1
            let newID = EvolvingNFT.totalSupply
            
            let child <- create NFT(
                id: newID,
                name: "Child of #".concat(parent1ID.toString()).concat(" & #").concat(parent2ID.toString()),
                description: "A new generation",
                initialTraits: <- childTraits
            )
            
            emit ChildCreated(parentID: parent1ID, childID: newID)
            return <- child
        }
        
        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@EvolvingNFT.NFT>()] = true
            return supportedTypes
        }
        
        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@EvolvingNFT.NFT>()
        }
        
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-EvolvingNFT.createEmptyCollection(nftType: Type<@EvolvingNFT.NFT>())
        }
    }
    
    // === MINTER RESOURCE ===
    access(all) resource NFTMinter {
        access(all) fun mintNFT(name: String, description: String, traits: @{String: {TraitModule.Trait}}): @NFT {
            EvolvingNFT.totalSupply = EvolvingNFT.totalSupply + 1
            let newID = EvolvingNFT.totalSupply
            
            let nft <- create NFT(
                id: newID,
                name: name,
                description: description,
                initialTraits: <- traits
            )
            
            emit NFTMinted(id: newID, name: name)
            return <- nft
        }
    }
    
    // === PUBLIC FUNCTIONS ===
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }
    
    // === MODULE REGISTRY FUNCTIONS ===
    access(all) fun registerModule(moduleType: String, contractAddress: Address, contractName: String) {
        self.registeredModules[moduleType] = contractAddress
        self.moduleContracts[moduleType] = contractName
        emit ModuleRegistered(moduleType: moduleType, contractAddress: contractAddress, contractName: contractName)
    }
    
    access(all) view fun getRegisteredModules(): [String] {
        return self.registeredModules.keys
    }
    
    access(all) view fun getModuleFactory(moduleType: String): &{TraitModule}? {
        if let contractAddress = self.registeredModules[moduleType] {
            if let contractName = self.moduleContracts[moduleType] {
                return getAccount(contractAddress).contracts.borrow<&{TraitModule}>(name: contractName)
            }
        }
        return nil
    }
    
    // === REQUIRED NFT CONTRACT METHODS ===
    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return [
            Type<MetadataViews.NFTCollectionData>(),
            Type<MetadataViews.NFTCollectionDisplay>()
        ]
    }
    
    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<MetadataViews.NFTCollectionData>():
                return MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&EvolvingNFT.Collection>(),
                    publicLinkedType: Type<&EvolvingNFT.Collection>(),
                    createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                        return <-EvolvingNFT.createEmptyCollection(nftType: Type<@EvolvingNFT.NFT>())
                    })
                )
            case Type<MetadataViews.NFTCollectionDisplay>():
                let media = MetadataViews.Media(
                    file: MetadataViews.HTTPFile(url: "https://example.com/logo.png"),
                    mediaType: "image/png"
                )
                return MetadataViews.NFTCollectionDisplay(
                    name: "Evolving NFT Collection",
                    description: "A collection of modular, evolving NFTs",
                    externalURL: MetadataViews.ExternalURL("https://example.com"),
                    squareImage: media,
                    bannerImage: media,
                    socials: {
                        "twitter": MetadataViews.ExternalURL("https://twitter.com/example")
                    }
                )
        }
        return nil
    }
    
    init() {
        self.totalSupply = 0
        self.registeredModules = {}
        self.moduleContracts = {}
        
        // Set paths
        self.CollectionStoragePath = /storage/EvolvingNFTCollection
        self.CollectionPublicPath = /public/EvolvingNFTCollection
        self.MinterStoragePath = /storage/EvolvingNFTMinter
        
        // Create and save minter
        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)
        
        emit ContractInitialized()
    }
} 