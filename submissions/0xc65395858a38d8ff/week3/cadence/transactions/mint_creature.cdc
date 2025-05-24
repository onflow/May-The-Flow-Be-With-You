import NonFungibleToken from 0x631e88ae7f1d7c20
import EvolvingCreatures from 0xbeb2f48c3293e514 // Assuming EvolvingCreatures will be deployed here

// This transaction mints a new EvolvingCreature NFT and deposits it into a recipient's Collection.
// It assumes the signer of the transaction has minting capabilities or that the
// EvolvingCreatures.mintCreature function is publicly callable (or with some fee).

transaction(
    recipientAddress: Address,
    initialGenesVisibles: {String: UFix64},
    initialGenesOcultos: {String: UFix64},
    initialEP: UFix64,
    lifespanDays: UFix64
) {

    // The reference to the Minter resource (if minting is restricted by a resource)
    // For now, we assume the EvolvingCreatures.mintCreature function is callable directly
    // or the signer is implicitly authorized.

    // The capability of the recipient to receive an NFT
    let recipientCollectionRef: &{NonFungibleToken.Receiver}

    prepare(signer: auth(BorrowValue) &Account) {
        // Get the recipient's public account object
        let recipient = getAccount(recipientAddress)

        // Borrow a reference to the recipient's NFT Collection receiver capability
        self.recipientCollectionRef = recipient.capabilities.borrow<&{NonFungibleToken.Receiver}>(
            EvolvingCreatures.CollectionPublicPath
        ) ?? panic("Could not borrow receiver reference to the recipient's Collection")
    }

    execute {
        // Mint the new EvolvingCreature NFT
        // The EvolvingCreatures.mintCreature function returns the newly created @NFT resource.
        let newNFT <- EvolvingCreatures.mintCreature(
            recipient: self.recipientCollectionRef, // Pass the receiver ref for owner address in event
            initialGenesVisibles: initialGenesVisibles,
            initialGenesOcultos: initialGenesOcultos,
            initialEP: initialEP,
            lifespanDays: lifespanDays
        )

        // Deposit the new NFT into the recipient's collection
        self.recipientCollectionRef.deposit(token: <-newNFT)

        log("New EvolvingCreature NFT minted and deposited to ".concat(recipientAddress.toString()))
    }
} 