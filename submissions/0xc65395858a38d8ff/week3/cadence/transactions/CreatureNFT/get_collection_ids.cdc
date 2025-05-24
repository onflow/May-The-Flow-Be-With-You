import "NonFungibleToken"
import "CreatureNFT"

// This script reads the NFT IDs from an account's CreatureNFT Collection.

access(all) fun main(account: Address): [UInt64] {
    // Borrow a reference to the public Collection capability
    let collectionCap = getAccount(account)
        .capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(CreatureNFT.CollectionPublicPath)
        ?? panic("Could not borrow CollectionPublic capability from the account. Make sure the account is set up to receive CreatureNFTs.")

    // Return the array of NFT IDs
    return collectionCap.getIDs()
} 