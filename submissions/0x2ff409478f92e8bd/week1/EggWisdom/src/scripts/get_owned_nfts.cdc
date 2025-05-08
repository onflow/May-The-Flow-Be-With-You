import "EggWisdom"
import "MetadataViews"

access(all) fun main(account: Address): [AnyStruct]?  {
 
    let account = getAccount(account)
    let answer: [AnyStruct]  = []
    var nft: AnyStruct = nil

        
    let cap = account.capabilities.borrow<&EggWisdom.Collection>(EggWisdom.CollectionPublicPath)!
    log(cap)

    let ids = cap.getIDs()


    for id in ids {
        // Ref to the EggWisdom to get the Card's metadata
        let nftRef = cap.borrowNFT(id)!
        let resolver = cap.borrowViewResolver(id: id)!
        let displayView: MetadataViews.Display = MetadataViews.getDisplay(resolver)!
        let serialView = MetadataViews.getSerial(resolver)!
        let traits = MetadataViews.getTraits(resolver)!
        

        nft = {
        "cardMetadataID": nftRef.id,
        "display": displayView,
        "nftID": nftRef.id,
        "serial": serialView,
        "traits": traits,
        "id in ids": id,
        "imgSrc": displayView.thumbnail
        }
        
        answer.append(nft
        )
    }
    return answer 
}