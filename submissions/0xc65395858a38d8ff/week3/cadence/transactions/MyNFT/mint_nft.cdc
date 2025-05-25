import "NonFungibleToken"
import "MyNFT"
import "MetadataViews"

// This transaction mints a new MyNFT and deposits it into a recipient's Collection.
// The transaction must be signed by an account that has the NFTMinter resource.

transaction(recipient: Address, name: String, description: String, thumbnail: String) {

    // Reference to the NFTMinter resource
    let minter: &MyNFT.NFTMinter

    // Reference to the recipient's public Collection capability
    let recipientCollection: &{NonFungibleToken.Receiver}

    prepare(signer: auth(BorrowValue) &Account) {
        // Borrow a reference to the NFTMinter resource from the signer's account storage
        self.minter = signer.storage.borrow<&MyNFT.NFTMinter>(from: MyNFT.MinterStoragePath)
            ?? panic("Signer does not have an MyNFT.NFTMinter resource.")

        // Borrow a reference to the recipient's public Collection capability
        // to deposit the NFT into it.
        self.recipientCollection = getAccount(recipient)
            .capabilities.borrow<&{NonFungibleToken.Receiver}>(MyNFT.CollectionPublicPath)
            ?? panic("Could not borrow Receiver capability from recipient's account. Make sure the account is set up to receive MyNFTs.")
    }

    execute {
        // Mint the new NFT
        let newNFT <- self.minter.createNFT(name: name, description: description, thumbnail: thumbnail)

        // Deposit the new NFT into the recipient's Collection
        self.recipientCollection.deposit(token: <-newNFT)

        log("MyNFT minted and deposited to recipient.")
    }
} 