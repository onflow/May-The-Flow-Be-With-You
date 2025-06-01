import NonFungibleToken from "NonFungibleToken"
import MetadataViews from "MetadataViews"

access(all) contract AchievementBadgeNFT: NonFungibleToken {

    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event Minted(id: UInt64, badgeName: String, achievement: String)

    access(all) var totalSupply: UInt64
    access(self) var minter: AuthAccount

    access(all) resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
        access(all) let id: UInt64
        access(all) let badgeName: String
        access(all) let description: String
        access(all) let thumbnail: String
        access(all) let achievement: String

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

        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>()
            ]
        }

        access(all) view fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.badgeName,
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(url: self.thumbnail)
                    )
                case Type<MetadataViews.ExternalURL>():
                    return MetadataViews.ExternalURL(self.thumbnail)
                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: AchievementBadgeNFT.CollectionStoragePath,
                        publicPath: AchievementBadgeNFT.CollectionPublicPath,
                        providerPath: AchievementBadgeNFT.CollectionProviderPath,
                        publicCollection: Type<&Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(),
                        publicLinkedType: Type<&Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(),
                        providerLinkedType: Type<&Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, NonFungibleToken.Provider, MetadataViews.ResolverCollection}>(),
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

    access(all) resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, MetadataViews.ResolverCollection {
        access(all) var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        init() {
            self.ownedNFTs <- {}
        }

        access(all) fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        access(all) fun deposit(token: @NonFungibleToken.NFT) {
            let nft <- token as! @AchievementBadgeNFT.NFT
            let id = nft.id
            let oldToken <- self.ownedNFTs[id] <- nft
            if self.owner != nil {
                emit Deposit(id: id, to: self.owner?.address)
            }
            destroy oldToken
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) view fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT
        }

        access(all) view fun borrowViewResolver(id: UInt64): &AnyResource{MetadataViews.Resolver} {
            let nft = &self.ownedNFTs[id] as auth &NonFungibleToken.NFT
            return nft as &AnyResource{MetadataViews.Resolver}
        }

        destroy() {
            destroy self.ownedNFTs
        }
    }

    access(all) fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <-create Collection()
    }

    access(all) fun mintBadge(
        recipient: &{NonFungibleToken.CollectionPublic},
        badgeName: String,
        description: String,
        thumbnail: String,
        achievement: String
    ) {
        pre {
            self.signer.address == self.minter.address:
                "Only the contract owner (minter) can mint achievement badges."
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

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let CollectionProviderPath: PrivatePath
    access(all) let MinterStoragePath: StoragePath

    init() {
        self.totalSupply = 0
        self.minter = self.account // ❗ Must migrate this to signer logic during deployment

        self.CollectionStoragePath = /storage/achievementBadgeNFTCollection
        self.CollectionPublicPath = /public/achievementBadgeNFTCollection
        self.CollectionProviderPath = /private/achievementBadgeNFTCollectionProvider
        self.MinterStoragePath = /storage/achievementBadgeNFSMinter

        emit ContractInitialized()
    }
}
