/// LuckyCharmNFT Contract
/// This contract defines and manages Lucky Charm Non-Fungible Tokens (NFTs)
/// for the LuckyColorMatch game. These NFTs can provide in-game benefits to their holders,
/// such as entry fee discounts or prize bonuses.
/// It implements the NonFungibleToken standard and MetadataViews for compatibility.
import NonFungibleToken from "NonFungibleToken"
/// Standard Non-Fungible Token interface.
import MetadataViews from "MetadataViews"
/// Standard for resolving metadata views for NFTs.

pub contract LuckyCharmNFT: NonFungibleToken {

    // --- Contract Events ---
    /// Emitted when the contract is first initialized.
    pub event ContractInitialized()
    /// Emitted when an NFT is withdrawn from a collection.
    pub event Withdraw(id: UInt64, from: Address?)
    /// Emitted when an NFT is deposited into a collection.
    pub event Deposit(id: UInt64, to: Address?)
    /// Emitted when a new Lucky Charm NFT is minted.
    pub event Minted(id: UInt64, name: String, charmType: String, benefitValue: UFix64)

    // --- Contract Storage ---
    /// The total number of Lucky Charm NFTs ever minted.
    pub var totalSupply: UInt64
    /// The account authorized to mint new Lucky Charm NFTs. Typically the contract deployer.
    access(self) var minter: AuthAccount // The account that can mint new NFTs

    // --- NFT Resource Definition ---
    /// The core NFT resource representing a single Lucky Charm.
    /// Implements `NonFungibleToken.INFT` for standard NFT functionality and
    /// `MetadataViews.Resolver` to provide metadata about the NFT.
    ///
    /// Fields:
    /// - id: Unique identifier for this NFT.
    /// - name: Display name of the Lucky Charm (e.g., "Charm of Minor Discount").
    /// - description: A brief description of the charm and its effect.
    /// - thumbnail: URL or IPFS CID for the charm's image.
    /// - charmType: The type of benefit this charm provides (e.g., "FeeDiscount", "PrizeBonus").
    /// - benefitValue: The magnitude of the benefit (e.g., 0.10 for a 10% fee discount, or 1.05 for a 5% prize bonus factor).
    pub resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
        pub let id: UInt64
        pub let name: String
        pub let description: String
        pub let thumbnail: String // URL or IPFS CID for the image
        pub let charmType: String // e.g., "FeeDiscount", "PrizeBonus"
        pub let benefitValue: UFix64 // e.g., 0.10 for 10% discount, or 1.05 for 5% prize bonus factor

        /// Initializes a new NFT resource.
        ///
        /// Parameters:
        /// - id: The unique UInt64 ID for this NFT.
        /// - name: The String name of the NFT.
        /// - description: The String description of the NFT.
        /// - thumbnail: The String URL or IPFS CID for the NFT's image.
        /// - charmType: The String type of charm (e.g., "FeeDiscount", "PrizeBonus").
        /// - benefitValue: The UFix64 value representing the charm's benefit.
        init(
            id: UInt64,
            name: String,
            description: String,
            thumbnail: String,
            charmType: String,
            benefitValue: UFix64
        ) {
            self.id = id
            self.name = name
            self.description = description
            self.thumbnail = thumbnail
            self.charmType = charmType
            self.benefitValue = benefitValue
        }

        /// Returns an array of `Type` indicating which metadata views this NFT resource can resolve.
        /// This allows other contracts and services to discover and query its metadata.
        pub fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>(),
                Type<MetadataViews.Royalties>() // Optional, can be removed if no royalties
            ]
        }

        /// Resolves a specific metadata view for this NFT.
        /// Based on the `view` type requested, it returns an appropriate struct from `MetadataViews`
        /// (e.g., `Display`, `ExternalURL`, `NFTCollectionData`).
        ///
        /// Parameters:
        /// - view: The `Type` of the metadata view to resolve.
        ///
        /// Returns: An `AnyStruct?` containing the resolved metadata view, or `nil` if the view is not supported.
        pub fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.name,
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(url: self.thumbnail) // Assuming HTTPFile for simplicity
                    )
                case Type<MetadataViews.ExternalURL>():
                    // Assuming the thumbnail URL can also serve as an external URL for the NFT
                    return MetadataViews.ExternalURL(self.thumbnail)
                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: LuckyCharmNFT.CollectionStoragePath,
                        publicPath: LuckyCharmNFT.CollectionPublicPath,
                        providerPath: LuckyCharmNFT.CollectionProviderPath,
                        publicCollection: Type<&amp;Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(),
                        publicLinkedType: Type<&amp;Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(),
                        providerLinkedType: Type<&amp;Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, NonFungibleToken.Provider, MetadataViews.ResolverCollection}>(),
                        createEmptyCollectionFunction: (fun (): @NonFungibleToken.Collection {
                            return <-LuckyCharmNFT.createEmptyCollection()
                        })
                    )
                case Type<MetadataViews.NFTCollectionDisplay>():
                    // This typically describes the collection itself, not an individual NFT
                    // For now, returning basic info. This might be better on the collection resource.
                    let media = MetadataViews.Media(
                        file: MetadataViews.HTTPFile(url: "COLLECTION_IMAGE_URL_PLACEHOLDER"), // Placeholder for collection image
                        mediaType: "image/png"
                    )
                    return MetadataViews.NFTCollectionDisplay(
                        name: "Lucky Charm NFT Collection",
                        description: "A collection of Lucky Charm NFTs for the LuckyColorMatch game.",
                        externalURL: MetadataViews.ExternalURL("COLLECTION_EXTERNAL_URL_PLACEHOLDER"),
                        squareImage: media,
                        bannerImage: media,
                        socials: {} // Empty for now
                    )
                // Add royalty view if needed
                // case Type<MetadataViews.Royalties>():
                //     return MetadataViews.Royalties([]) // No royalties for now
            }
            return nil
        }

        // If you need to destroy NFTs, implement this
        // destroy() {
        //     LuckyCharmNFT.totalSupply = LuckyCharmNFT.totalSupply - 1
        // }
    }

    // --- Collection Resource Definition ---
    /// The NFT Collection resource that holds Lucky Charm NFTs for a user.
    /// Implements standard `NonFungibleToken` interfaces for collection management (Provider, Receiver, CollectionPublic)
    /// and `MetadataViews.ResolverCollection` to provide metadata about the NFTs it contains.
    pub resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, MetadataViews.ResolverCollection {
        /// Dictionary storing the NFTs owned by this collection, mapping NFT ID to the NFT resource.
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        /// Initializes an empty collection.
        init() {
            self.ownedNFTs <- {}
        }

        /// Withdraws an NFT from the collection.
        /// Emits a `Withdraw` event.
        ///
        /// Parameters:
        /// - withdrawID: The `UInt64` ID of the NFT to withdraw.
        ///
        /// Returns: The withdrawn `@NonFungibleToken.NFT` resource.
        /// Panics if the NFT with `withdrawID` is not found in the collection.
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        /// Deposits an NFT into the collection.
        /// Emits a `Deposit` event if the collection has an owner.
        ///
        /// Parameters:
        /// - token: The `@NonFungibleToken.NFT` resource to deposit. Must be a `@LuckyCharmNFT.NFT`.
        ///
        /// Panics if the deposited token is not of type `@LuckyCharmNFT.NFT`.
        pub fun deposit(token: @NonFungibleToken.NFT) {
            let nft <- token as! @LuckyCharmNFT.NFT
            let id = nft.id
            let oldToken <- self.ownedNFTs[id] <- nft
            if self.owner != nil {
                emit Deposit(id: id, to: self.owner?.address)
            }
            destroy oldToken
        }

        /// Returns an array of IDs of all NFTs currently in the collection.
        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        /// Borrows an immutable reference to an NFT in the collection.
        ///
        /// Parameters:
        /// - id: The `UInt64` ID of the NFT to borrow.
        ///
        /// Returns: An immutable reference `&NonFungibleToken.NFT`.
        /// Panics if the NFT with `id` is not found.
        pub fun borrowNFT(id: UInt64): &amp;NonFungibleToken.NFT {
            return &amp;self.ownedNFTs[id] as &amp;NonFungibleToken.NFT
        }

        /// Borrows a reference to the `MetadataViews.Resolver` for a specific NFT in the collection.
        /// This allows querying metadata for that NFT.
        ///
        /// Parameters:
        /// - id: The `UInt64` ID of the NFT whose resolver is to be borrowed.
        ///
        /// Returns: A reference `&AnyResource{MetadataViews.Resolver}`.
        /// Panics if the NFT with `id` is not found.
        pub fun borrowViewResolver(id: UInt64): &amp;AnyResource{MetadataViews.Resolver} {
            let nft = &amp;self.ownedNFTs[id] as auth &amp;NonFungibleToken.NFT
            return nft as &amp;AnyResource{MetadataViews.Resolver}
        }

        // If you need to destroy the collection and its NFTs
        // destroy() {
        //     destroy self.ownedNFTs
        // }
    }

    // --- Public Functions ---
    /// Public function to create and return an empty NFT collection resource.
    /// This is typically called by users when setting up their account to receive these NFTs.
    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <-create Collection()
    }

    // --- Admin Functions ---
    /// Mints a new Lucky Charm NFT and deposits it into a recipient's collection.
    /// This function can only be called by the authorized minter account (contract owner).
    /// It increments the `totalSupply` and emits a `Minted` event.
    ///
    /// Parameters:
    /// - recipient: A reference to the recipient's collection (`&{NonFungibleToken.CollectionPublic}`), typically obtained via a capability.
    /// - name: The `String` name for the new NFT.
    /// - description: The `String` description for the new NFT.
    /// - thumbnail: The `String` URL/IPFS CID for the NFT's image.
    /// - charmType: The `String` type of the charm (must be "FeeDiscount" or "PrizeBonus").
    /// - benefitValue: The `UFix64` value representing the charm's benefit.
    ///
    /// Preconditions:
    /// - The signer of the transaction must be the `self.minter`.
    /// - `charmType` must be one of the allowed types.
    ///
    /// Panics if preconditions are not met.
    pub fun mintNFT(
        recipient: &amp;{NonFungibleToken.CollectionPublic}, // Usually a capability to a Collection
        name: String,
        description: String,
        thumbnail: String,
        charmType: String,
        benefitValue: UFix64
    ) {
        pre {
            self.signer.address == self.minter.address : "Only the contract owner (minter) can mint NFTs."
            charmType == "FeeDiscount" || charmType == "PrizeBonus" : "Invalid charmType. Must be 'FeeDiscount' or 'PrizeBonus'."
            // Add more validation for benefitValue if needed (e.g., range for discount/bonus)
        }

        let newID = self.totalSupply
        let newNFT <- create NFT(
            id: newID,
            name: name,
            description: description,
            thumbnail: thumbnail,
            charmType: charmType,
            benefitValue: benefitValue
        )

        recipient.deposit(token: <-newNFT)

        emit Minted(id: newID, name: name, charmType: charmType, benefitValue: benefitValue)
        self.totalSupply = self.totalSupply + 1
    }

    // --- Public Paths ---
    /// The storage path where user NFT collections will be saved in their account storage.
    pub let CollectionStoragePath: StoragePath
    /// The public path where others can access a user's NFT collection (e.g., to view NFTs or deposit to it).
    pub let CollectionPublicPath: PublicPath
    /// The private path for creating a provider capability, allowing secure withdrawal from the collection.
    pub let CollectionProviderPath: PrivatePath // For providing withdrawal capability securely

    // --- Initialization ---
    /// Initializes the LuckyCharmNFT contract when it's deployed.
    /// Sets the initial `totalSupply` to 0, assigns the deploying account as the `minter`,
    /// and defines the standard storage, public, and private paths for NFT collections.
    /// Emits a `ContractInitialized` event.
    init() {
        self.totalSupply = 0
        self.minter = self.account // The deploying account becomes the minter

        // Initialize paths
        self.CollectionStoragePath = /storage/luckyCharmNFTCollection
        self.CollectionPublicPath = /public/luckyCharmNFTCollection
        self.CollectionProviderPath = /private/luckyCharmNFTCollectionProvider

        // Save a Minter resource to allow the admin to mint later
        // This is a common pattern, or the mintNFT function can directly check self.signer
        // For simplicity, direct check on self.signer is used in mintNFT.

        emit ContractInitialized()
    }
}