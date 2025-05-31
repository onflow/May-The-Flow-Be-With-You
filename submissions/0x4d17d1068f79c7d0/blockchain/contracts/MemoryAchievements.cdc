// Memory Achievements NFT Contract
// Provides permanent, tradeable proof of memory training accomplishments

import NonFungibleToken from 0x631e88ae7f1d7c20
import MetadataViews from 0x631e88ae7f1d7c20
import ViewResolver from 0x631e88ae7f1d7c20

access(all) contract MemoryAchievements: NonFungibleToken {

    // Events
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event AchievementMinted(id: UInt64, achievementId: String, recipient: Address, culture: String?)

    // Paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    // Total supply of achievements
    access(all) var totalSupply: UInt64

    // Achievement metadata structure
    access(all) struct AchievementMetadata {
        access(all) let achievementId: String
        access(all) let name: String
        access(all) let description: String
        access(all) let category: String
        access(all) let culture: String?
        access(all) let icon: String
        access(all) let rarity: String
        access(all) let unlockedAt: UFix64
        access(all) let gameData: {String: AnyStruct}

        init(
            achievementId: String,
            name: String,
            description: String,
            category: String,
            culture: String?,
            icon: String,
            rarity: String,
            gameData: {String: AnyStruct}
        ) {
            self.achievementId = achievementId
            self.name = name
            self.description = description
            self.category = category
            self.culture = culture
            self.icon = icon
            self.rarity = rarity
            self.unlockedAt = getCurrentBlock().timestamp
            self.gameData = gameData
        }
    }

    // Achievement NFT resource
    access(all) resource NFT: NonFungibleToken.NFT {
        access(all) let id: UInt64
        access(all) let metadata: AchievementMetadata

        init(
            id: UInt64,
            metadata: AchievementMetadata
        ) {
            self.id = id
            self.metadata = metadata
        }

        // Create views for the NFT
        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Royalties>(),
                Type<MetadataViews.Editions>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>(),
                Type<MetadataViews.Serial>(),
                Type<MetadataViews.Traits>()
            ]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.metadata.name,
                        description: self.metadata.description,
                        thumbnail: MetadataViews.HTTPFile(
                            url: "https://memoreee.app/achievements/".concat(self.metadata.achievementId).concat(".png")
                        )
                    )

                case Type<MetadataViews.Editions>():
                    let editionInfo = MetadataViews.Edition(
                        name: self.metadata.category.concat(" Achievement"),
                        number: self.id,
                        max: nil
                    )
                    return MetadataViews.Editions([editionInfo])

                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(self.id)

                case Type<MetadataViews.Royalties>():
                    return MetadataViews.Royalties([])

                case Type<MetadataViews.ExternalURL>():
                    return MetadataViews.ExternalURL("https://memoreee.app/achievements/".concat(self.id.toString()))

                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: MemoryAchievements.CollectionStoragePath,
                        publicPath: MemoryAchievements.CollectionPublicPath,
                        publicCollection: Type<&MemoryAchievements.Collection>(),
                        publicLinkedType: Type<&MemoryAchievements.Collection>(),
                        createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                            return <-MemoryAchievements.createEmptyCollection(nftType: Type<@MemoryAchievements.NFT>())
                        })
                    )

                case Type<MetadataViews.NFTCollectionDisplay>():
                    let media = MetadataViews.Media(
                        file: MetadataViews.HTTPFile(url: "https://memoreee.app/logo.png"),
                        mediaType: "image/png"
                    )
                    return MetadataViews.NFTCollectionDisplay(
                        name: "Memory Achievements",
                        description: "Permanent proof of memory training mastery across global cultural traditions",
                        externalURL: MetadataViews.ExternalURL("https://memoreee.app"),
                        squareImage: media,
                        bannerImage: media,
                        socials: {
                            "twitter": MetadataViews.ExternalURL("https://twitter.com/memoreee")
                        }
                    )

                case Type<MetadataViews.Traits>():
                    let traits: [MetadataViews.Trait] = []

                    traits.append(MetadataViews.Trait(
                        name: "Category",
                        value: self.metadata.category,
                        displayType: "String",
                        rarity: nil
                    ))

                    if let culture = self.metadata.culture {
                        traits.append(MetadataViews.Trait(
                            name: "Culture",
                            value: culture,
                            displayType: "String",
                            rarity: nil
                        ))
                    }

                    traits.append(MetadataViews.Trait(
                        name: "Rarity",
                        value: self.metadata.rarity,
                        displayType: "String",
                        rarity: nil
                    ))

                    return MetadataViews.Traits(traits)
            }
            return nil
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-create Collection()
        }
    }

    // Collection interface
    access(all) resource interface MemoryAchievementCollectionPublic {
        access(all) fun deposit(token: @{NonFungibleToken.NFT})
        access(all) fun getIDs(): [UInt64]
        access(all) fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}?
        access(all) fun borrowAchievement(id: UInt64): &MemoryAchievements.NFT? {
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow Achievement reference: the ID of the returned reference is incorrect"
            }
        }
    }

    // Collection resource
    access(all) resource Collection: MemoryAchievementCollectionPublic, NonFungibleToken.Collection {
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
            let token <- token as! @MemoryAchievements.NFT
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return (&self.ownedNFTs[id] as &{NonFungibleToken.NFT}?)
        }

        access(all) fun borrowAchievement(id: UInt64): &MemoryAchievements.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = (&self.ownedNFTs[id] as &{NonFungibleToken.NFT}?)!
                return ref as! &MemoryAchievements.NFT
            }
            return nil
        }

        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@MemoryAchievements.NFT>()] = true
            return supportedTypes
        }

        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@MemoryAchievements.NFT>()
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-create Collection()
        }
    }

    // Minter resource for creating achievements
    access(all) resource NFTMinter {
        access(all) fun mintNFT(
            recipient: &{NonFungibleToken.CollectionPublic},
            achievementId: String,
            name: String,
            description: String,
            category: String,
            culture: String?,
            icon: String,
            rarity: String,
            gameData: {String: AnyStruct}
        ): UInt64 {
            let metadata = AchievementMetadata(
                achievementId: achievementId,
                name: name,
                description: description,
                category: category,
                culture: culture,
                icon: icon,
                rarity: rarity,
                gameData: gameData
            )

            let newNFT <- create NFT(
                id: MemoryAchievements.totalSupply,
                metadata: metadata
            )

            let nftId = newNFT.id

            emit AchievementMinted(
                id: nftId,
                achievementId: achievementId,
                recipient: recipient.owner?.address ?? panic("No recipient address"),
                culture: culture
            )

            recipient.deposit(token: <-newNFT)

            MemoryAchievements.totalSupply = MemoryAchievements.totalSupply + 1

            return nftId
        }
    }

    // Public function to create empty collection
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <-create Collection()
    }

    // Contract-level metadata views
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
                    publicCollection: Type<&MemoryAchievements.Collection>(),
                    publicLinkedType: Type<&MemoryAchievements.Collection>(),
                    createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                        return <-MemoryAchievements.createEmptyCollection(nftType: Type<@MemoryAchievements.NFT>())
                    })
                )
            case Type<MetadataViews.NFTCollectionDisplay>():
                let media = MetadataViews.Media(
                    file: MetadataViews.HTTPFile(
                        url: "https://memoreee.app/logo.png"
                    ),
                    mediaType: "image/png"
                )
                return MetadataViews.NFTCollectionDisplay(
                    name: "Memory Achievements",
                    description: "Permanent proof of memory training accomplishments across cultural traditions",
                    externalURL: MetadataViews.ExternalURL("https://memoreee.app"),
                    squareImage: media,
                    bannerImage: media,
                    socials: {}
                )
        }
        return nil
    }

    // Get achievement data for a specific NFT
    access(all) fun getAchievementData(address: Address, id: UInt64): AchievementMetadata? {
        if let collection = getAccount(address).capabilities.borrow<&MemoryAchievements.Collection>(MemoryAchievements.CollectionPublicPath) {
            if let achievement = collection.borrowAchievement(id: id) {
                // Create a copy of the metadata to return
                let gameDataCopy: {String: AnyStruct} = {}
                for key in achievement.metadata.gameData.keys {
                    gameDataCopy[key] = achievement.metadata.gameData[key]
                }

                return AchievementMetadata(
                    achievementId: achievement.metadata.achievementId,
                    name: achievement.metadata.name,
                    description: achievement.metadata.description,
                    category: achievement.metadata.category,
                    culture: achievement.metadata.culture,
                    icon: achievement.metadata.icon,
                    rarity: achievement.metadata.rarity,
                    gameData: gameDataCopy
                )
            }
        }
        return nil
    }

    // Get all achievements for an address
    access(all) fun getAchievements(address: Address): [AchievementMetadata] {
        let achievements: [AchievementMetadata] = []

        if let collection = getAccount(address).capabilities.borrow<&MemoryAchievements.Collection>(MemoryAchievements.CollectionPublicPath) {
            let ids = collection.getIDs()
            for id in ids {
                if let achievement = collection.borrowAchievement(id: id) {
                    // Create a copy of the metadata to append
                    let gameDataCopy: {String: AnyStruct} = {}
                    for key in achievement.metadata.gameData.keys {
                        gameDataCopy[key] = achievement.metadata.gameData[key]
                    }

                    achievements.append(AchievementMetadata(
                        achievementId: achievement.metadata.achievementId,
                        name: achievement.metadata.name,
                        description: achievement.metadata.description,
                        category: achievement.metadata.category,
                        culture: achievement.metadata.culture,
                        icon: achievement.metadata.icon,
                        rarity: achievement.metadata.rarity,
                        gameData: gameDataCopy
                    ))
                }
            }
        }

        return achievements
    }

    init() {
        self.totalSupply = 0

        self.CollectionStoragePath = /storage/memoryAchievementCollection
        self.CollectionPublicPath = /public/memoryAchievementCollection
        self.MinterStoragePath = /storage/memoryAchievementMinter

        // Create a Collection resource and save it to storage
        let collection <- create Collection()
        self.account.storage.save(<-collection, to: self.CollectionStoragePath)

        // Create a public capability for the collection
        let collectionCap = self.account.capabilities.storage.issue<&MemoryAchievements.Collection>(self.CollectionStoragePath)
        self.account.capabilities.publish(collectionCap, at: self.CollectionPublicPath)

        // Create a Minter resource and save it to storage
        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}