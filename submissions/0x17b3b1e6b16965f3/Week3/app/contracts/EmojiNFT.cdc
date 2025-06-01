pub contract EmojiNFT {
  pub event NFTMinted(id: UInt64, owner: Address, emojiCollage: String)
  pub event NFTTransferred(id: UInt64, from: Address, to: Address)
  pub event CollectionCreated(owner: Address)

  pub struct Metadata {
    pub let name: String
    pub let description: String
    pub let image: String
    pub let attributes: {String: String}
    pub let createdAt: UFix64

    init(name: String, description: String, image: String, attributes: {String: String}) {
      self.name = name
      self.description = description
      self.image = image
      self.attributes = attributes
      self.createdAt = getCurrentBlock().timestamp
    }
  }

  pub resource NFT {
    pub let id: UInt64
    pub let emojiCollage: String
    pub let metadata: Metadata
    pub let creator: Address
    pub let royaltyPercentage: UFix64

    init(id: UInt64, emojiCollage: String, metadata: Metadata, creator: Address, royaltyPercentage: UFix64) {
      self.id = id
      self.emojiCollage = emojiCollage
      self.metadata = metadata
      self.creator = creator
      self.royaltyPercentage = royaltyPercentage
    }
  }

  pub resource Collection {
    pub var ownedNFTs: @{UInt64: NFT}
    pub let owner: Address

    init(owner: Address) {
      self.ownedNFTs = {}
      self.owner = owner
      emit CollectionCreated(owner: owner)
    }

    pub fun deposit(token: @NFT) {
      self.ownedNFTs[token.id] = token
    }

    pub fun withdraw(id: UInt64): @NFT {
      let token = self.ownedNFTs.remove(key: id) ?? panic("NFT not found")
      return token
    }

    pub fun getNFTs(): [NFT] {
      return self.ownedNFTs.values
    }

    pub fun getNFT(id: UInt64): &NFT? {
      return &self.ownedNFTs[id] as &NFT?
    }
  }

  pub resource interface CollectionPublic {
    pub fun deposit(token: @NFT)
    pub fun getNFTs(): [NFT]
    pub fun getNFT(id: UInt64): &NFT?
  }

  pub resource CollectionPublicImpl: CollectionPublic {
    pub fun deposit(token: @NFT) {
      self.ownedNFTs[token.id] = token
    }

    pub fun getNFTs(): [NFT] {
      return self.ownedNFTs.values
    }

    pub fun getNFT(id: UInt64): &NFT? {
      return &self.ownedNFTs[id] as &NFT?
    }
  }

  pub fun createEmptyCollection(): @Collection {
    return create Collection(owner: self.account.address)
  }

  pub fun mintNFT(
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

    let nft = create NFT(
      id: id,
      emojiCollage: emojiCollage,
      metadata: metadata,
      creator: self.account.address,
      royaltyPercentage: royaltyPercentage
    )

    emit NFTMinted(id: id, owner: self.account.address, emojiCollage: emojiCollage)
    return nft
  }

  pub fun transferNFT(collection: &Collection, id: UInt64, recipient: Address) {
    let token = collection.withdraw(id: id)
    let recipientCollection = getAccount(recipient).getCapability(/public/EmojiNFTCollection)
      .borrow<&Collection>() ?? panic("Collection not found")
    
    recipientCollection.deposit(token: token)
    emit NFTTransferred(id: id, from: self.account.address, to: recipient)
  }

  pub fun getNFTMetadata(id: UInt64): Metadata? {
    let collection = self.account.getCapability(/public/EmojiNFTCollection)
      .borrow<&Collection>() ?? panic("Collection not found")
    
    let nft = collection.getNFT(id: id)
    return nft?.metadata
  }

  pub var nextID: UInt64
  pub var totalSupply: UInt64

  init() {
    self.nextID = 1
    self.totalSupply = 0
  }
} 