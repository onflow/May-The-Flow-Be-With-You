import NonFungibleToken from "NonFungibleToken"
import MetadataViews from "MetadataViews"

access(all) contract LuckyCharmNFT: NonFungibleToken {

    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event Minted(id: UInt64, name: String, charmType: String, benefitValue: UFix64)

    access(all) var totalSupply: UInt64
    access(self) var minter: AuthAccount

    access(all) resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let thumbnail: String
        access(all) let charmType: String
        access(all) let benefitValue: UFix64

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

        access(all) fun getViews(): [Type] view {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>(),
                Type<MetadataViews.Royalties>()
            ]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? view {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.name,
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(url: self.thumbnail)
                    )
                case Type<MetadataViews.ExternalURL>():
                    return MetadataViews.ExternalURL(self.thumbnail)
                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: LuckyCharmNFT.CollectionStoragePath,
                        publicPath: LuckyCharmNFT.CollectionPublicPath,
                        providerPath: LuckyCharmNFT.CollectionProviderPath,
                        publicCollection: Type<&LuckyCharmNFT.Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(),
                        publicLinkedType: Type<&LuckyCharmNFT.Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(),
                        providerLinkedType: Type<&LuckyCharmNFT.Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, NonFungibleToken.Provider, MetadataViews.ResolverCollection}>(),
                        createEmptyCollectionFunction: (fun (): @NonFungibleToken.Collection {
                            return <-LuckyCharmNFT.createEmptyCollection()
                        })
                    )
                case Type<MetadataViews.NFTCollectionDisplay>():
                    let media = MetadataViews.Media(
                        file: MetadataViews.HTTPFile(url: "COLLECTION_IMAGE_URL_PLACEHOLDER"),
                        mediaType: "image/png"
                    )
                    return MetadataViews.NFTCollectionDisplay(
                        name: "Lucky Charm NFT Collection",
                        description: "A collection of Lucky Charm NFTs for the LuckyColorMatch game.",
                        externalURL: MetadataViews.ExternalURL("COLLECTION_EXTERNAL_URL_PLACEHOLDER"),
                        squareImage: media,
                        bannerImage: media,
                        socials: {}
                    )
                default:
                    return nil
            }
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
            let nft <- token as! @LuckyCharmNFT.NFT
            let id = nft.id
            let oldToken <- self.ownedNFTs[id] <- nft
            if self.owner != nil {
                emit Deposit(id: id, to: self.owner?.address)
            }
            destroy oldToken
        }

        access(all) fun getIDs(): [UInt64] view {
            return self.ownedNFTs.keys
        }

        access(all) fun borrowNFT(id: UInt64): &NonFungibleToken.NFT view {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT
        }

        access(all) fun borrowViewResolver(id: UInt64): &AnyResource{MetadataViews.Resolver} view {
            let nft = &self.ownedNFTs[id] as auth &NonFungibleToken.NFT
            return nft as &AnyResource{MetadataViews.Resolver}
        }
    }

    access(all) fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <-create Collection()
    }

    access(all) fun mintNFT(
        recipient: &{NonFungibleToken.CollectionPublic},
        name: String,
        description: String,
        thumbnail: String,
        charmType: String,
        benefitValue: UFix64
    ) {
        pre {
            self.signer.address == self.minter.address: "Only the contract owner (minter) can mint NFTs."
            charmType == "FeeDiscount" || charmType == "PrizeBonus": "Invalid charmType. Must be 'FeeDiscount' or 'PrizeBonus'."
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

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let CollectionProviderPath: PrivatePath

    init() {
        self.totalSupply = 0
        self.minter = self.account // ❗️ Must move this to a deployment tx in Cadence 1.0

        self.CollectionStoragePath = /storage/luckyCharmNFTCollection
        self.CollectionPublicPath = /public/luckyCharmNFTCollection
        self.CollectionProviderPath = /private/luckyCharmNFTCollectionProvider

        emit ContractInitialized()
    }
}
