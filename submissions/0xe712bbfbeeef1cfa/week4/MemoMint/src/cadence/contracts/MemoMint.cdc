// MemoMint.cdc
// This is the main contract for the MemoMint NFT collection

import NonFungibleToken from 0x631e88ae7f1d7c20
import MetadataViews from 0x631e88ae7f1d7c20

pub contract MemoMint: NonFungibleToken {
    // Dictionary of all NFTs
    pub var totalSupply: UInt64
    
    // Dictionary of all NFTs
    pub var ownedNFTs: @{UInt64: NFT}
    
    // Dictionary of all NFT metadata
    pub var metadata: @{UInt64: MemoMetadata}
    
    // Event emitted when a new NFT is minted
    pub event Minted(id: UInt64, owner: Address, summary: String, timestamp: UFix64)
    
    // NFT resource
    pub resource NFT: NonFungibleToken.INFT {
        pub let id: UInt64
        
        init(_id: UInt64) {
            self.id = _id
        }
    }
    
    // Metadata structure for each NFT
    pub struct MemoMetadata {
        pub let summary: String
        pub let timestamp: UFix64
        pub let owner: Address
        
        init(summary: String, timestamp: UFix64, owner: Address) {
            self.summary = summary
            self.timestamp = timestamp
            self.owner = owner
        }
    }
    
    // Collection resource that holds NFTs
    pub resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}
        
        init() {
            self.ownedNFTs = {}
        }
        
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let nft <- self.ownedNFTs.remove(key: withdrawID) 
                ?? panic("This NFT does not exist in this Collection.")
            emit Withdraw(id: nft.id, from: self.owner?.address)
            return <-nft
        }
        
        pub fun deposit(token: @NonFungibleToken.NFT) {
            let nft <- token as! @NFT
            let id = nft.id
            self.ownedNFTs[id] = nft
            emit Deposit(id: id, to: self.owner?.address)
        }
        
        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }
        
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT
        }
    }
    
    // Function to mint a new NFT
    pub fun mintNFT(summary: String, recipient: &{NonFungibleToken.CollectionPublic}) {
        let id = MemoMint.totalSupply
        let timestamp = getCurrentBlock().timestamp
        
        // Create the NFT
        let nft <- create NFT(_id: id)
        
        // Create and store metadata
        let metadata = MemoMetadata(
            summary: summary,
            timestamp: timestamp,
            owner: recipient.owner?.address ?? panic("No owner found")
        )
        
        MemoMint.metadata[id] = metadata
        MemoMint.totalSupply = MemoMint.totalSupply + 1
        
        // Deposit the NFT to the recipient
        recipient.deposit(token: <-nft)
        
        emit Minted(id: id, owner: recipient.owner?.address ?? panic("No owner found"), summary: summary, timestamp: timestamp)
    }
    
    init() {
        self.totalSupply = 0
        self.ownedNFTs = {}
        self.metadata = {}
    }
} 