access(all) contract EmojiNFT {

    access(all) event NFTMinted(id: UInt64, owner: Address, emojiCollage: String)
    access(all) event NFTTransferred(id: UInt64, from: Address, to: Address)
    access(all) event CollectionCreated(owner: Address)

    access(all) struct Metadata {
        access(all) let name: String
        access(all) let description: String
        access(all) let image: String
        access(all) let attributes: {String: String}
        access(all) let createdAt: UFix64

        init(name: String, description: String, image: String, attributes: {String: String}) {
            self.name = name
            self.description = description
            self.image = image
            self.attributes = attributes
            self.createdAt = getCurrentBlock().timestamp
        }
    }

    access(all) resource NFT {
        access(all) let id: UInt64
        access(all) let emojiCollage: String
        access(all) let metadata: Metadata
        access(all) let creator: Address
        access(all) let royaltyPercentage: UFix64

        init(id: UInt64, emojiCollage: String, metadata: Metadata, creator: Address, royaltyPercentage: UFix64) {
            self.id = id
            self.emojiCollage = emojiCollage
            self.metadata = metadata
            self.creator = creator
            self.royaltyPercentage = royaltyPercentage
        }
    }

    access(all) resource Collection {
        access(all) var ownedNFTs: @{UInt64: NFT}
        access(all) let owner: Address

        init(owner: Address) {
            self.ownedNFTs <- {}
            self.owner = owner
            emit CollectionCreated(owner: owner)
        }

        access(all) fun deposit(token: @NFT) {
            self.ownedNFTs[token.id] <-! token
        }

        access(all) fun withdraw(id: UInt64): @NFT {
            let token <- self.ownedNFTs.remove(key: id) ?? panic("NFT not found")
            return <- token
        }

        access(all) view fun getNFTs(): [NFT] {
            return self.ownedNFTs.values
        }

        access(all) view fun getNFT(id: UInt64): &NFT? {
            return &self.ownedNFTs[id] as &NFT?
        }
    }

    access(all) resource interface CollectionPublic {
        access(all) fun deposit(token: @NFT)
        access(all) view fun getNFTs(): [NFT]
        access(all) view fun getNFT(id: UInt64): &NFT?
    }

    access(all) fun createEmptyCollection(): @Collection {
        let ownerAddress = getAccount(0x0).address // Replace with authorized account
        return <- create Collection(owner: ownerAddress)
    }

    access(all) fun mintNFT(
        emojiCollage: String,
        name: String,
        description: String,
        image: String,
        attributes: {String: String},
        royaltyPercentage: UFix64
    ): @NFT {
        let id = self.nextID
        self.nextID = self.nextID + 1

        let metadata = Metadata(
            name: name,
            description: description,
            image: image,
            attributes: attributes
        )

        let nft <- create NFT(
            id: id,
            emojiCollage: emojiCollage,
            metadata: metadata,
            creator: getAccount(0x0).address, // Replace with authorized account
            royaltyPercentage: royaltyPercentage
        )

        emit NFTMinted(id: id, owner: getAccount(0x0).address, emojiCollage: emojiCollage)

        return <- nft
    }

    access(all) fun transferNFT(collection: &Collection, id: UInt64, recipient: Address) {
        let token <- collection.withdraw(id: id)
        let recipientCollection = getAccount(recipient)
            .capabilities
            .borrow<&Collection>(/public/EmojiNFTCollection)
            ?? panic("Collection not found")

        recipientCollection.deposit(token: <- token)

        emit NFTTransferred(id: id, from: getAccount(0x0).address, to: recipient)
    }

    access(all) view fun getNFTMetadata(id: UInt64): Metadata? {
        let collection = getAccount(0x0)
            .capabilities
            .borrow<&Collection>(/public/EmojiNFTCollection)
            ?? panic("Collection not found")

        let nft = collection.getNFT(id: id)
        return nft?.metadata
    }

    access(all) var nextID: UInt64
    access(all) var totalSupply: UInt64

    init() {
        self.nextID = 1
        self.totalSupply = 0
    }
}
