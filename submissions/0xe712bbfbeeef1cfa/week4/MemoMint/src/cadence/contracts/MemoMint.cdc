import NonFungibleToken from 0x631e88ae7f1d7c20

access(all) contract MemoMint {

    // NFT resource conforming to NFT interface
    access(all) resource NFT: NonFungibleToken.NFT {
        access(all) let id: UInt64
        access(all) let summary: String
        access(all) let timestamp: UFix64

        init(id: UInt64, summary: String) {
            self.id = id
            self.summary = summary
            self.timestamp = getCurrentBlock().timestamp
        }
    }

    access(all) resource Collection: 
        NonFungibleToken.Provider, 
        NonFungibleToken.Receiver, 
        NonFungibleToken.CollectionPublic {

        access(self) var ownedNFTs: @{UInt64: NFT}

        access(all) fun deposit(token: @NonFungibleToken.NFT) {
            let nft <- token as! @MemoMint.NFT
            self.ownedNFTs[nft.id] <-! nft
            emit Deposit(id: nft.id, to: self.owner?.address)
        }

        access(all) fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let nft <- self.ownedNFTs.remove(key: withdrawID)
                ?? panic("This NFT does not exist.")
            emit Withdraw(id: nft.id, from: self.owner?.address)
            return <- nft
        }

        access(all) fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            let ref = &self.ownedNFTs[id] as &NonFungibleToken.NFT
            return ref
        }

        access(all) fun getLength(): UInt64 {
            return UInt64(self.ownedNFTs.length)
        }

        access(all) fun getSupportedNFTTypes(): [Type] {
            return [Type<@MemoMint.NFT>()]
        }

        access(all) fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@MemoMint.NFT>()
        }

        // Remove destroy() block — Cadence v1.0+ destroys nested resources automatically

        init() {
            self.ownedNFTs <- {}
        }
    }

    access(all) resource Minter {
        access(contract) var nextID: UInt64

        access(all) fun mintNFT(summary: String, recipient: &{NonFungibleToken.CollectionPublic}): UInt64 {
            let id = self.nextID
            self.nextID = self.nextID + 1
            let nft <- create NFT(id: id, summary: summary)
            recipient.deposit(token: <- nft)
            emit Mint(id: id, summary: summary)
            return id
        }

        access(all) fun getNextID(): UInt64 {
            return self.nextID
        }

        init() {
            self.nextID = 1
        }
    }

    access(all) fun createEmptyCollection(): @Collection {
        return <- create Collection()
    }

    access(all) fun getMinter(): @Minter {
        return <- create Minter()
    }

    access(all) event Mint(id: UInt64, summary: String)
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
}
