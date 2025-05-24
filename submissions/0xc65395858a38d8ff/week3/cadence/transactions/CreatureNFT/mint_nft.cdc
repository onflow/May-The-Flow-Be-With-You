import "NonFungibleToken"
import "CreatureNFT"
import "MetadataViews"

// This transaction mints a new CreatureNFT and deposits it into a recipient's Collection.
// The transaction must be signed by an account that has the NFTMinter resource.

transaction(
    recipient: Address, 
    name: String, 
    description: String, 
    thumbnail: String,
    initialGenesVisibles: {String: UFix64},
    initialGenesOcultos: {String: UFix64},
    initialPuntosEvolucion: UFix64,
    lifespanDays: UFix64,
    initialEdadDiasCompletos: UFix64,
    initialEstaViva: Bool,
    initialHomeostasisTargets: {String: UFix64}
) {

    // Reference to the NFTMinter resource
    let minter: &CreatureNFT.NFTMinter

    // Reference to the recipient's public Collection capability
    let recipientCollection: &{NonFungibleToken.Receiver}

    prepare(signer: auth(BorrowValue) &Account) {
        // Get the current block height for birth information
        let currentBlock = getCurrentBlock()
        
        // Borrow a reference to the NFTMinter resource from the signer's account storage
        self.minter = signer.storage.borrow<&CreatureNFT.NFTMinter>(from: CreatureNFT.MinterStoragePath)
            ?? panic("Signer does not have a CreatureNFT.NFTMinter resource.")

        // Borrow a reference to the recipient's public Collection capability
        // to deposit the NFT into it.
        self.recipientCollection = getAccount(recipient)
            .capabilities.borrow<&{NonFungibleToken.Receiver}>(CreatureNFT.CollectionPublicPath)
            ?? panic("Could not borrow Receiver capability from recipient's account. Make sure the account is set up to receive CreatureNFTs.")
    }

    execute {
        // Mint the new NFT with all creature-specific attributes
        let newNFT <- self.minter.createNFT(
            name: name, 
            description: description, 
            thumbnail: thumbnail,
            birthBlockHeight: getCurrentBlock().height,
            initialGenesVisibles: initialGenesVisibles,
            initialGenesOcultos: initialGenesOcultos,
            initialPuntosEvolucion: initialPuntosEvolucion,
            lifespanDays: lifespanDays,
            initialEdadDiasCompletos: initialEdadDiasCompletos,
            initialEstaViva: initialEstaViva,
            initialHomeostasisTargets: initialHomeostasisTargets
        )

        // Deposit the new NFT into the recipient's Collection
        self.recipientCollection.deposit(token: <-newNFT)

        log("CreatureNFT minted and deposited to recipient.")
    }
} 