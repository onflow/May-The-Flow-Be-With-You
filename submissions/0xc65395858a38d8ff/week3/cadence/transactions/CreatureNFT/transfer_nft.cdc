import "NonFungibleToken"
import "CreatureNFT"
import "MetadataViews"

// This transaction transfers a CreatureNFT from one account to another.

transaction(recipient: Address, withdrawID: UInt64) {

    // Reference to the signer's Collection
    let senderCollection: @{NonFungibleToken.Provider}

    // Reference to the recipient's public Collection capability
    let recipientCollection: &{NonFungibleToken.Receiver}

    prepare(signer: auth(BorrowValue) &Account) {
        // Borrow a reference to the signer's Collection resource
        // Note: We use the Provider interface to ensure we can withdraw.
        let collection = signer.storage.borrow<auth(NonFungibleToken.Withdraw) &CreatureNFT.Collection>(from: CreatureNFT.CollectionStoragePath)
            ?? panic("Could not borrow Provider capability from signer's Collection. Make sure the Collection exists.")
        self.senderCollection <- collection

        // Borrow a reference to the recipient's public Collection capability
        self.recipientCollection = getAccount(recipient)
            .capabilities.borrow<&{NonFungibleToken.Receiver}>(CreatureNFT.CollectionPublicPath)
            ?? panic("Could not borrow Receiver capability from recipient's account. Make sure the account is set up to receive CreatureNFTs.")
    }

    execute {
        // Withdraw the NFT from the signer's Collection
        let nft <- self.senderCollection.withdraw(withdrawID: withdrawID)

        // Deposit the NFT into the recipient's Collection
        self.recipientCollection.deposit(token: <-nft)

        log("CreatureNFT transferred successfully.")
    }
} 