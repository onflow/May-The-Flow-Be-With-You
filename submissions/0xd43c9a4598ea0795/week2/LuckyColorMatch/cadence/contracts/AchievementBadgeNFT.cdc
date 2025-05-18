/// AchievementBadgeNFT Contract
/// This contract defines and manages Achievement Badge Non-Fungible Tokens (NFTs)
/// for the LuckyColorMatch game. These NFTs are awarded to players for accomplishing
/// specific milestones or achievements within the game, serving as non-transferable (typically)
/// on-chain records of their accomplishments.
/// It implements the NonFungibleToken standard and MetadataViews.
import NonFungibleToken from "NonFungibleToken"
/// Standard Non-Fungible Token interface.
import MetadataViews from "MetadataViews"
/// Standard for resolving metadata views for NFTs.

pub contract AchievementBadgeNFT: NonFungibleToken {

    // --- Contract Events ---
    /// Emitted when the contract is first initialized.
    pub event ContractInitialized()
    /// Emitted when an NFT is withdrawn from a collection.
    pub event Withdraw(id: UInt64, from: Address?)
    /// Emitted when an NFT is deposited into a collection.
    pub event Deposit(id: UInt64, to: Address?)
    /// Emitted when a new Achievement Badge NFT is minted.
    pub event Minted(id: UInt64, badgeName: String, achievement: String)

    // --- Contract Storage ---
    /// The total number of Achievement Badge NFTs ever minted.
    pub var totalSupply: UInt64
    /// The account authorized to mint new Achievement Badge NFTs. Typically the contract deployer or a designated game admin account.
    access(self) var minter: AuthAccount // The account that can mint new NFTs

    // --- NFT Resource Definition ---
    /// The core NFT resource representing a single Achievement Badge.
    /// Implements `NonFungibleToken.INFT` and `MetadataViews.Resolver`.
    ///
    /// Fields:
    /// - id: Unique identifier for this NFT.
    /// - badgeName: Display name of the achievement badge (e.g., "Grand Prize Winner - Round 5").
    /// - description: A detailed description of the achievement that earned this badge.
    /// - thumbnail: URL or IPFS CID for the badge's image.
    /// - achievement: A short code or identifier for the specific achievement (e.g., "GRAND_PRIZE_R5", "WIN_STREAK_5").
    pub resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
        pub let id: UInt64
        pub let badgeName: String      // e.g., "First Win Streak", "Perfect Match Master"
        pub let description: String    // Detailed description of the achievement
        pub let thumbnail: String      // URL or IPFS CID for the badge image
        pub let achievement: String    // A short code or identifier for the achievement, e.g., "WIN_STREAK_3", "PERFECT_ROUND"

        /// Initializes a new NFT resource for an Achievement Badge.
        ///
        /// Parameters:
        /// - id: The unique UInt64 ID for this NFT.
        /// - badgeName: The String name of the badge.
        /// - description: The String description of the achievement.
        /// - thumbnail: The String URL or IPFS CID for the badge's image.
        /// - achievement: The String code or identifier for the achievement.
        init(
            id: UInt64,
            badgeName: String,
            description: String,
            thumbnail: String,
            achievement: String
        ) {
            self.id = id
            self.badgeName = badgeName
            self.description = description
            self.thumbnail = thumbnail
            self.achievement = achievement
        }

        /// Returns an array of `Type` indicating which metadata views this NFT resource can resolve.
        pub fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>()
                // Type<MetadataViews.Royalties>() // Optional
            ]
        }

        /// Resolves a specific metadata view for this Achievement Badge NFT.
        ///
        /// Parameters:
        /// - view: The `Type` of the metadata view to resolve.
        ///
        /// Returns: An `AnyStruct?` containing the resolved metadata view, or `nil` if not supported.
        pub fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.badgeName,
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(url: self.thumbnail)
                    )
                case Type<MetadataViews.ExternalURL>():
                    return MetadataViews.ExternalURL(self.thumbnail) // Or a link to more info about the achievement
                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: AchievementBadgeNFT.CollectionStoragePath,
                        publicPath: AchievementBadgeNFT.CollectionPublicPath,
                        providerPath: AchievementBadgeNFT.CollectionProviderPath,
                        publicCollection: Type<&amp;Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(),
                        publicLinkedType: Type<&amp;Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(),
                        providerLinkedType: Type<&amp;Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, NonFungibleToken.Provider, MetadataViews.ResolverCollection}>(),
                        createEmptyCollectionFunction: (fun (): @NonFungibleToken.Collection {
                            return <-AchievementBadgeNFT.createEmptyCollection()
                        })
                    )
                case Type<MetadataViews.NFTCollectionDisplay>():
                    let media = MetadataViews.Media(
                        file: MetadataViews.HTTPFile(url: "COLLECTION_BADGE_IMAGE_URL_PLACEHOLDER"),
                        mediaType: "image/png"
                    )
                    return MetadataViews.NFTCollectionDisplay(
                        name: "Achievement Badge NFT Collection",
                        description: "Commemorative badges for achievements in the LuckyColorMatch game.",
                        externalURL: MetadataViews.ExternalURL("COLLECTION_BADGE_EXTERNAL_URL_PLACEHOLDER"),
                        squareImage: media,
                        bannerImage: media,
                        socials: {}
                    )
            }
            return nil
        }
    }

    // --- Collection Resource Definition ---
    /// The NFT Collection resource that holds Achievement Badge NFTs for a user.
    /// Implements standard `NonFungibleToken` interfaces and `MetadataViews.ResolverCollection`.
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
        /// Panics if the NFT with `withdrawID` is not found.
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        /// Deposits an NFT into the collection.
        /// Emits a `Deposit` event if the collection has an owner.
        ///
        /// Parameters:
        /// - token: The `@NonFungibleToken.NFT` resource to deposit. Must be an `@AchievementBadgeNFT.NFT`.
        ///
        /// Panics if the deposited token is not of type `@AchievementBadgeNFT.NFT`.
        pub fun deposit(token: @NonFungibleToken.NFT) {
            let nft <- token as! @AchievementBadgeNFT.NFT
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

        /// Destroys the collection and all NFTs within it. This is standard for NFT collections.
        destroy() {
            destroy self.ownedNFTs
        }
    }

    // --- Public Functions ---
    /// Public function to create and return an empty NFT collection resource.
    /// Users call this to set up their account to receive Achievement Badge NFTs.
    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <-create Collection()
    }

    // --- Admin/Game Contract Functions ---
    // This function will be called by the GameAdmin or potentially by the LuckyColorMatch contract itself
    // if it's given minting capabilities.
    /// Mints a new Achievement Badge NFT and deposits it into a recipient's collection.
    /// This function is typically called by an authorized minter (e.g., the game contract or an admin account).
    ///
    /// Parameters:
    /// - recipient: A reference to the recipient's collection (`&{NonFungibleToken.CollectionPublic}`).
    /// - badgeName: The `String` name for the new badge.
    /// - description: The `String` description for the new badge.
    /// - thumbnail: The `String` URL/IPFS CID for the badge's image.
    /// - achievement: The `String` code or identifier for the achievement.
    ///
    /// Preconditions:
    /// - The signer of the transaction must be the `self.minter`.
    ///
    /// Panics if preconditions are not met.
    pub fun mintBadge(
        recipient: &amp;{NonFungibleToken.CollectionPublic},
        badgeName: String,
        description: String,
        thumbnail: String,
        achievement: String
    ) {
        // For now, only the contract owner (minter) can mint.
        // This could be extended to allow other authorized accounts/contracts.
        pre {
            self.signer.address == self.minter.address : "Only the contract owner (minter) can mint achievement badges."
            // Add validation for achievement code if a predefined list exists
        }

        let newID = self.totalSupply
        let newNFT <- create NFT(
            id: newID,
            badgeName: badgeName,
            description: description,
            thumbnail: thumbnail,
            achievement: achievement
        )

        recipient.deposit(token: <-newNFT)

        emit Minted(id: newID, badgeName: badgeName, achievement: achievement)
        self.totalSupply = self.totalSupply + 1
    }

    // --- Public Paths ---
    /// The storage path where user NFT collections will be saved.
    pub let CollectionStoragePath: StoragePath
    /// The public path for accessing user NFT collections.
    pub let CollectionPublicPath: PublicPath
    /// The private path for creating a provider capability for collections.
    pub let CollectionProviderPath: PrivatePath
    /// Storage path for the NFTMinter resource, if a separate minter resource pattern is used (conceptual here).
    pub let MinterStoragePath: StoragePath // Path for storing/accessing the Minter resource if needed

    // --- Initialization ---
    /// Initializes the AchievementBadgeNFT contract upon deployment.
    /// Sets initial `totalSupply`, assigns the deployer as `minter`, and defines standard paths.
    /// Emits `ContractInitialized` event.
    init() {
        self.totalSupply = 0
        self.minter = self.account // The deploying account becomes the minter

        self.CollectionStoragePath = /storage/achievementBadgeNFTCollection
        self.CollectionPublicPath = /public/achievementBadgeNFTCollection
        self.CollectionProviderPath = /private/achievementBadgeNFTCollectionProvider
        self.MinterStoragePath = /storage/achievementBadgeNFSMinter // Example path

        emit ContractInitialized()
    }
}