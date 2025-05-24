import "NonFungibleToken"
import "MetadataViews"
import "ViewResolver" // Added for explicit conformance if needed by NFT resource

access(all) contract CreatureNFT: NonFungibleToken {

    /// Total supply of CreatureNFTs in existence
    access(all) var totalSupply: UInt64

    /// The event that is emitted when the contract is created
    access(all) event ContractInitialized()

    /// The event that is emitted when an NFT is withdrawn from a Collection
    access(all) event Withdraw(id: UInt64, from: Address?)

    /// The event that is emitted when an NFT is deposited to a Collection
    access(all) event Deposit(id: UInt64, to: Address?)

    /// The event that is emitted when an NFT is minted
    access(all) event NFTMinted(
        id: UInt64, 
        name: String, 
        birthTimestamp: UFix64,
        birthBlockHeight: UInt64,
        lifespanTotalSimulatedDays: UFix64
    )
    
    /// The event that is emitted when an NFT's description is updated
    access(all) event DescriptionUpdated(id: UInt64, newDescription: String)

    /// Storage and Public Paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    /// The core resource that represents a Non Fungible Token.
    /// New instances will be created using the NFTMinter resource
    /// and stored in the Collection resource
    access(all) resource NFT: NonFungibleToken.NFT, ViewResolver.Resolver {
        access(all) let id: UInt64
        access(all) let birthTimestamp: UFix64
        access(all) let birthBlockHeight: UInt64
        
        access(all) let name: String
        access(all) var description: String
        access(all) let thumbnail: String // URL to an image

        // Attributes from EvolvingCreaturesV2
        access(all) let genesVisibles: {String: UFix64}
        access(all) let genesOcultos: {String: UFix64}
        access(all) var puntosEvolucion: UFix64 // Mutable by game logic contract
        access(all) let lifespanTotalSimulatedDays: UFix64
        access(all) var edadDiasCompletos: UFix64 // Mutable by game logic contract
        access(all) var estaViva: Bool             // Mutable by game logic contract
        access(all) var deathBlockHeight: UInt64?    // Mutable by game logic contract
        access(all) var deathTimestamp: UFix64?      // Mutable by game logic contract

        // Evolution tracking placeholders - managed by game logic contract
        access(all) var lastEvolutionProcessedBlockHeight: UInt64
        access(all) var lastEvolutionProcessedTimestamp: UFix64
        access(all) var committedToRandomBlockHeight: UInt64?
        access(all) var currentActiveBeaconSeed: String? // UInt256 might need custom handling/lib, using String for simplicity for now
        access(all) var lastBeaconSeedFetchedBlockHeight: UInt64?
        access(all) var simulatedDaysProcessedWithCurrentSeed: UInt64
        
        // Homeostasis targets - Explicitly allow modification of this dictionary
        access(all) var homeostasisTargets: {String: UFix64}

        init(
            id: UInt64,
            name: String,
            description: String,
            thumbnail: String,
            birthBlockHeight: UInt64, 
            initialGenesVisibles: {String: UFix64},
            initialGenesOcultos: {String: UFix64},
            initialPuntosEvolucion: UFix64,
            lifespanDays: UFix64,
            initialEdadDiasCompletos: UFix64,
            initialEstaViva: Bool,
            initialHomeostasisTargets: {String: UFix64}
        ) {
            self.id = id
            self.birthTimestamp = getCurrentBlock().timestamp
            self.birthBlockHeight = birthBlockHeight
            self.name = name
            self.description = description
            self.thumbnail = thumbnail

            self.genesVisibles = initialGenesVisibles
            self.genesOcultos = initialGenesOcultos
            self.puntosEvolucion = initialPuntosEvolucion
            self.lifespanTotalSimulatedDays = lifespanDays
            self.edadDiasCompletos = initialEdadDiasCompletos
            self.estaViva = initialEstaViva
            self.deathBlockHeight = nil
            self.deathTimestamp = nil

            self.lastEvolutionProcessedBlockHeight = birthBlockHeight // Initialize with birth block
            self.lastEvolutionProcessedTimestamp = self.birthTimestamp // Initialize with birth time
            self.committedToRandomBlockHeight = nil
            self.currentActiveBeaconSeed = nil
            self.lastBeaconSeedFetchedBlockHeight = nil
            self.simulatedDaysProcessedWithCurrentSeed = 0
            self.homeostasisTargets = initialHomeostasisTargets

            emit NFTMinted(
                id: self.id, 
                name: self.name, 
                birthTimestamp: self.birthTimestamp,
                birthBlockHeight: self.birthBlockHeight,
                lifespanTotalSimulatedDays: self.lifespanTotalSimulatedDays
            )
        }

        access(all) fun updateDescription(newDescription: String) {
            self.description = newDescription
            emit DescriptionUpdated(id: self.id, newDescription: newDescription)
        }
        
        // --- Functions to be called by the Game Logic Contract ---
        // These functions would have stricter access control (e.g., access(contract) or capability-based)
        // once the game logic contract is defined and interacting.
        // For now, they are access(all) for easier initial testing if called directly via NFT reference.

        access(all) fun updatePuntosEvolucion(newEP: UFix64) {
            self.puntosEvolucion = newEP
        }

        access(all) fun updateEdad(newEdad: UFix64) {
            self.edadDiasCompletos = newEdad
        }

        access(all) fun updateVitalStatus(newEstaViva: Bool, newDeathBlock: UInt64?, newDeathTimestamp: UFix64?) {
            self.estaViva = newEstaViva
            self.deathBlockHeight = newDeathBlock
            self.deathTimestamp = newDeathTimestamp
        }
        
        access(all) fun updateHomeostasisTarget(gene: String, target: UFix64) {
            self.homeostasisTargets[gene] = target
        }

        access(all) fun setLastEvolutionProcessed(blockHeight: UInt64, timestamp: UFix64) {
            self.lastEvolutionProcessedBlockHeight = blockHeight
            self.lastEvolutionProcessedTimestamp = timestamp
        }

        access(all) fun setHomeostasisTarget(gene: String, value: UFix64) {
            self.homeostasisTargets[gene] = value
        }

        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Serial>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>()
            ]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    // The thumbnail here could be dynamic based on creature state later
                    // if the game logic contract provides a way to get current image representation.
                    return MetadataViews.Display(
                        name: self.name.concat(" #").concat(self.id.toString()),
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(
                            url: self.thumbnail // Base thumbnail
                        )
                    )
                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(
                        self.id
                    )
                case Type<MetadataViews.NFTCollectionData>():
                    return CreatureNFT.resolveContractView(resourceType: Type<@CreatureNFT.NFT>(), viewType: Type<MetadataViews.NFTCollectionData>())
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return CreatureNFT.resolveContractView(resourceType: Type<@CreatureNFT.NFT>(), viewType: Type<MetadataViews.NFTCollectionDisplay>())
            }
            return nil
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-CreatureNFT.createEmptyCollection(nftType: Type<@CreatureNFT.NFT>())
        }
    }

    /// Defines the Collection resource that holds NFTs
    access(all) resource Collection: NonFungibleToken.Collection {
        /// Dictionary of NFT conforming tokens
        /// NFT is a resource type with an `UInt64` ID field
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init () {
            self.ownedNFTs <- {}
        }

        /// Removes an NFT from the collection and moves it to the caller
        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("Cannot withdraw NFT: token not found")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        /// Adds an NFT to the collections dictionary
        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @CreatureNFT.NFT
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }

        /// Helper method for getting the collection IDs
        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        /// Gets a reference to an NFT in the collection
        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
        }

        /// Gets a reference to a specific NFT type in the collection (read-only)
        access(all) view fun borrowCreatureNFT(id: UInt64): &CreatureNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
                return ref as! &CreatureNFT.NFT
            }
            return nil
        }
        
        /// Gets an authorized reference to a specific NFT that can be modified
        access(all) fun borrowCreatureNFTForUpdate(id: UInt64): auth(Mutate, Insert, Remove) &CreatureNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as auth(Mutate, Insert, Remove) &{NonFungibleToken.NFT}?
                return ref as! auth(Mutate, Insert, Remove) &CreatureNFT.NFT
            }
            return nil
        }

        /// Returns supported NFT types the collection can receive
        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@CreatureNFT.NFT>()] = true
            return supportedTypes
        }

        /// Returns whether or not the given type is accepted by the collection
        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@CreatureNFT.NFT>()
        }

        /// Create an empty NFT Collection
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-CreatureNFT.createEmptyCollection(nftType: Type<@CreatureNFT.NFT>())
        }
    }

    /// Resource that allows minting of NFTs
    access(all) resource NFTMinter {
        /// Mints a new NFT with given parameters
        access(all) fun createNFT(
            name: String, 
            description: String, 
            thumbnail: String,
            birthBlockHeight: UInt64,
            initialGenesVisibles: {String: UFix64},
            initialGenesOcultos: {String: UFix64},
            initialPuntosEvolucion: UFix64,
            lifespanDays: UFix64,
            initialEdadDiasCompletos: UFix64,
            initialEstaViva: Bool,
            initialHomeostasisTargets: {String: UFix64}
        ): @NFT {
            CreatureNFT.totalSupply = CreatureNFT.totalSupply + 1
            let newID = CreatureNFT.totalSupply
            
            return <-create NFT(
                id: newID,
                name: name,
                description: description,
                thumbnail: thumbnail,
                birthBlockHeight: birthBlockHeight,
                initialGenesVisibles: initialGenesVisibles,
                initialGenesOcultos: initialGenesOcultos,
                initialPuntosEvolucion: initialPuntosEvolucion,
                lifespanDays: lifespanDays,
                initialEdadDiasCompletos: initialEdadDiasCompletos,
                initialEstaViva: initialEstaViva,
                initialHomeostasisTargets: initialHomeostasisTargets
            )
        }
    }

    /// Creates an empty collection for storing NFTs
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    /// Gets a list of views for all NFTs defined by this contract
    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return [
            Type<MetadataViews.NFTCollectionData>(),
            Type<MetadataViews.NFTCollectionDisplay>()
        ]
    }

    /// Resolves a view that applies to all the NFTs defined by this contract
    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<MetadataViews.NFTCollectionData>():
                return MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&CreatureNFT.Collection>(),
                    publicLinkedType: Type<&CreatureNFT.Collection>(),
                    createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                        return <-CreatureNFT.createEmptyCollection(nftType: Type<@CreatureNFT.NFT>())
                    })
                )
            case Type<MetadataViews.NFTCollectionDisplay>():
                let media = MetadataViews.Media(
                    file: MetadataViews.HTTPFile(
                        url: "https://example.com/creature_collection_banner.png"
                    ),
                    mediaType: "image/png"
                )
                return MetadataViews.NFTCollectionDisplay(
                    name: "Creature Collection",
                    description: "A collection of unique creatures.",
                    externalURL: MetadataViews.ExternalURL("https://example.com/creatures"),
                    squareImage: media,
                    bannerImage: media,
                    socials: {
                        "twitter": MetadataViews.ExternalURL("https://twitter.com/YourCreatureProject")
                    }
                )
        }
        return nil
    }

    init() {
        // Initialize the total supply
        self.totalSupply = 0

        // Set the named paths
        self.CollectionStoragePath = /storage/CreatureNFTCollection
        self.CollectionPublicPath = /public/CreatureNFTCollection
        self.MinterStoragePath = /storage/CreatureNFTMinter

        // Create and save the NFTMinter resource
        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
} 