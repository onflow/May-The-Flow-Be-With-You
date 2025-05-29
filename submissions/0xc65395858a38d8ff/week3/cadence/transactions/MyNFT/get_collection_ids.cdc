import "NonFungibleToken"
import "MyNFT"

// This script reads the NFT IDs from an account's MyNFT Collection.

access(all) fun main(account: Address): [UInt64] {
    // Borrow a reference to the public Collection capability
    let collectionCap = getAccount(account)
        .capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(MyNFT.CollectionPublicPath)
        ?? panic("Could not borrow CollectionPublic capability from the account. Make sure the account is set up to receive MyNFTs.")

    // Return the array of NFT IDs
    return collectionCap.getIDs()
} 