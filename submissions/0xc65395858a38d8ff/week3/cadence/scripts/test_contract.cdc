import NonFungibleToken from 0x631e88ae7f1d7c20
import EvolvingCreatures from 0x2444e6b4d9327f09
import MetadataViews from 0x631e88ae7f1d7c20

access(all) fun main(): String {
    // Check if createEmptyCollection expects arguments
    let collectionType = EvolvingCreatures.resolveContractView(
        resourceType: Type<@EvolvingCreatures.Collection>(),
        viewType: Type<MetadataViews.NFTCollectionData>()
    )

    if collectionType != nil {
        let data = collectionType as! MetadataViews.NFTCollectionData
        return "CreateEmptyCollectionFunction exists in NFTCollectionData"
    }

    return "Failed to resolve NFTCollectionData"
} 