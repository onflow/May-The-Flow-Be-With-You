import "NonFungibleToken"
import "MetadataViews"
import "ViewResolver"

access(all) contract MyNFT: NonFungibleToken {

    // Standard Paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)

    // Total supply of MyNFTs
    access(all) var totalSupply: UInt64

    access(all) resource NFT: NonFungibleToken.NFT, ViewResolver.Resolver {
        access(all) let id: UInt64

        // Metadata
        access(all) let name: String
        access(all) var description: String
        access(all) let thumbnail: String

        init(
            id: UInt64,
            name: String,
            description: String,
            thumbnail: String
        ) {
            self.id = id
            self.name = name
            self.description = description
            self.thumbnail = thumbnail
        }

        // Function to update the description
        // Only the owner of the NFT should be able to call this
        // This is implicitly handled if the transaction borrows the NFT with write access
        access(all) fun updateDescription(newDescription: String) {
            self.description = newDescription
            // TODO: Consider emitting an event here if updates are important to track off-chain
            // log("NFT ".concat(self.id.toString()).concat(" description updated to: ").concat(newDescription))
        }

        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Editions>(),
                Type<MetadataViews.Serial>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>()
            ]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.name,
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(
                            url: self.thumbnail
                        )
                    )
                case Type<MetadataViews.Editions>():
                    // There is no max number of NFTs that can be minted from this contract
                    // so the max edition field value is set to nil
                    let editionInfo = MetadataViews.Edition(name: "MyNFT Edition", number: self.id, max: nil)
                    let editionList: [MetadataViews.Edition] = [editionInfo]
                    return MetadataViews.Editions(
                        editionList
                    )
                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(
                        self.id
                    )
                case Type<MetadataViews.NFTCollectionData>():
                    return MyNFT.resolveContractView(resourceType: Type<@MyNFT.NFT>(), viewType: Type<MetadataViews.NFTCollectionData>())
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return MyNFT.resolveContractView(resourceType: Type<@MyNFT.NFT>(), viewType: Type<MetadataViews.NFTCollectionDisplay>())
            }
            return nil
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-MyNFT.createEmptyCollection(nftType: Type<@MyNFT.NFT>())
        }
    }

    access(all) resource Collection: NonFungibleToken.Collection {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init() {
            self.ownedNFTs <- {}
        }

        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID)
                ?? panic("MyNFT.Collection.withdraw: Could not withdraw an NFT with ID ".concat(withdrawID.toString()).concat(". Check the submitted ID to make sure it is one that this collection owns."))
            
            emit MyNFT.Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @MyNFT.NFT
            let id = token.id

            let oldToken <- self.ownedNFTs[id] <- token
            
            emit MyNFT.Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
        }
        
        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@MyNFT.NFT>()] = true
            return supportedTypes
        }

        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@MyNFT.NFT>()
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-MyNFT.createEmptyCollection(nftType: Type<@MyNFT.NFT>())
        }
    }

    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    access(all) resource NFTMinter {
        access(all) fun createNFT(name: String, description: String, thumbnail: String): @NFT {
            MyNFT.totalSupply = MyNFT.totalSupply + 1
            return <-create NFT(id: MyNFT.totalSupply, name: name, description: description, thumbnail: thumbnail)
        }
    }

    /// Gets a list of views for all the NFTs defined by this contract
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
                let collectionData = MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&MyNFT.Collection>(),
                    publicLinkedType: Type<&MyNFT.Collection>(),
                    createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                        return <-MyNFT.createEmptyCollection(nftType: Type<@MyNFT.NFT>())
                    })
                )
                return collectionData
            case Type<MetadataViews.NFTCollectionDisplay>():
                let media = MetadataViews.Media(
                    file: MetadataViews.HTTPFile(
                        url: "https://assets.website-files.com/5f734f4dbd95382f4fdfa0ea/5f734f4dbd95385a79dfa10a_342ea741-743c-423a-9943-92b4bf0b100f.png" // Generic Flow logo
                    ),
                    mediaType: "image/png"
                )
                return MetadataViews.NFTCollectionDisplay(
                    name: "MyNFT Example Collection",
                    description: "This collection is a generic example based on the Flow NFT tutorial.",
                    externalURL: MetadataViews.ExternalURL("https://developers.flow.com/docs/cadence/creating-nft-contract"),
                    squareImage: media,
                    bannerImage: media,
                    socials: {
                        "twitter": MetadataViews.ExternalURL("https://twitter.com/flow_blockchain")
                    }
                )
        }
        return nil
    }

    // Interface for public capabilities
    // This allows us to publicly expose the borrowNFT function
    access(all) resource interface MyNFTCollectionPublic {
        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}?
        access(all) view fun getIDs(): [UInt64]
        access(all) view fun getSupportedNFTTypes(): {Type: Bool}
        access(all) view fun isSupportedNFTType(type: Type): Bool
    }
    
    // Conform the Collection to the public interface
    // This is a placeholder as direct binding isn't how capabilities are typically exposed.
    // Capabilities are created and published by account owners.
    // access(all) fun bindCollectionPublic(collection: &Collection) {
    //     let MyNFTCollectionPublic = Type<&MyNFT.Collection{MyNFT.MyNFTCollectionPublic}>()
    // }


    init() {
        self.totalSupply = 0
        self.CollectionStoragePath = /storage/MyNFTCollection
        self.CollectionPublicPath = /public/MyNFTCollection
        self.MinterStoragePath = /storage/MyNFTMinter

        // Save the Minter resource to the contract account's storage
        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
} 