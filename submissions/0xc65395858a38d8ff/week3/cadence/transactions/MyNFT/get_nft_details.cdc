import "NonFungibleToken"
import "MyNFT"
import "MetadataViews"

// This script reads various metadata views for a specific MyNFT in an account's Collection.

access(all) fun main(account: Address, nftID: UInt64): {String: AnyStruct} {
    let result: {String: AnyStruct} = {}

    let acct = getAccount(account)

    // Borrow a reference to the MyNFT.Collection
    let collectionRef = acct.capabilities.borrow<&MyNFT.Collection>(MyNFT.CollectionPublicPath)
        ?? panic("Could not borrow MyNFT.Collection capability from the account.")

    // Borrow a reference to the specific NFT as &MyNFT.NFT
    // MyNFT.NFT resource now explicitly conforms to ViewResolver.Resolver
    let nftRef = collectionRef.borrowNFT(nftID) 
        ?? panic("Could not borrow MyNFT.NFT with ID ".concat(nftID.toString()).concat(" from collection."))

    // Now try to get views directly from the &MyNFT.NFT reference
    // &MyNFT.NFT must implicitly be a ViewResolver.Resolver if the views are implemented correctly
    
    // Get the Display view
    if let displayView = MetadataViews.getDisplay(nftRef) {
        result["display"] = displayView
    }

    // Get the Editions view
    if let editionsView = MetadataViews.getEditions(nftRef) {
        result["editions"] = editionsView
    }

    // Get the Serial view
    if let serialView = MetadataViews.getSerial(nftRef) {
        result["serial"] = serialView
    }
    
    // Get NFTCollectionData view
    // Note: These are usually resolved on the contract or collection level, 
    // but the NFT resource itself also has a way to resolve them.
    if let nftCollectionDataView = nftRef.resolveView(Type<MetadataViews.NFTCollectionData>()) {
        result["nftCollectionData"] = nftCollectionDataView
    }

    // Get NFTCollectionDisplay view
    if let nftCollectionDisplayView = nftRef.resolveView(Type<MetadataViews.NFTCollectionDisplay>()) {
        result["nftCollectionDisplay"] = nftCollectionDisplayView
    }

    return result
} 