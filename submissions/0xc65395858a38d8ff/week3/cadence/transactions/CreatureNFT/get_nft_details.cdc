import "NonFungibleToken"
import "CreatureNFT"
import "MetadataViews"
import "ViewResolver"

// This script reads various metadata views and creature-specific details for a CreatureNFT in an account's Collection.

access(all) fun main(account: Address, nftID: UInt64): {String: AnyStruct} {
    let result: {String: AnyStruct} = {}

    let acct = getAccount(account)

    // Borrow a reference to the CreatureNFT.Collection
    let collectionRef = acct.capabilities.borrow<&CreatureNFT.Collection>(CreatureNFT.CollectionPublicPath)
        ?? panic("Could not borrow CreatureNFT.Collection capability from the account.")

    // Borrow a reference to the specific NFT as &CreatureNFT.NFT
    let creatureRef = collectionRef.borrowCreatureNFT(id: nftID) 
        ?? panic("Could not borrow CreatureNFT.NFT with ID ".concat(nftID.toString()).concat(" from collection."))

    // Add basic metadata views
    if let displayView = creatureRef.resolveView(Type<MetadataViews.Display>()) as! MetadataViews.Display? {
        result["display"] = displayView
    }

    if let serialView = creatureRef.resolveView(Type<MetadataViews.Serial>()) as! MetadataViews.Serial? {
        result["serial"] = serialView
    }
    
    // Get NFTCollectionData view
    if let nftCollectionDataView = creatureRef.resolveView(Type<MetadataViews.NFTCollectionData>()) {
        result["nftCollectionData"] = nftCollectionDataView
    }

    // Get NFTCollectionDisplay view
    if let nftCollectionDisplayView = creatureRef.resolveView(Type<MetadataViews.NFTCollectionDisplay>()) {
        result["nftCollectionDisplay"] = nftCollectionDisplayView
    }

    // Extract creature-specific attributes
    result["id"] = creatureRef.id
    result["name"] = creatureRef.name
    result["description"] = creatureRef.description
    result["thumbnail"] = creatureRef.thumbnail
    result["birthTimestamp"] = creatureRef.birthTimestamp
    result["birthBlockHeight"] = creatureRef.birthBlockHeight
    
    // Evolution and genetic attributes
    result["genesVisibles"] = creatureRef.genesVisibles
    result["puntosEvolucion"] = creatureRef.puntosEvolucion
    result["lifespanTotalSimulatedDays"] = creatureRef.lifespanTotalSimulatedDays
    result["edadDiasCompletos"] = creatureRef.edadDiasCompletos
    result["estaViva"] = creatureRef.estaViva
    
    // Only include death info if the creature is not alive
    if !creatureRef.estaViva {
        result["deathBlockHeight"] = creatureRef.deathBlockHeight
        result["deathTimestamp"] = creatureRef.deathTimestamp
    }
    
    // Evolution tracking info
    result["lastEvolutionProcessedBlockHeight"] = creatureRef.lastEvolutionProcessedBlockHeight
    result["lastEvolutionProcessedTimestamp"] = creatureRef.lastEvolutionProcessedTimestamp
    result["homeostasisTargets"] = creatureRef.homeostasisTargets
    
    return result
} 