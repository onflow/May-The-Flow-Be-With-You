// Get Registered Modules Script
import "EvolvingCreatureNFT"

access(all) fun main(contractAddress: Address): {String: AnyStruct} {
    // Get contract account
    let account = getAccount(contractAddress)
    let minterCap = account.capabilities.get<&EvolvingCreatureNFT.NFTMinter>(EvolvingCreatureNFT.MinterPublicPath)
    
    if !minterCap.check() {
        return {"error": "Minter capability not found"}
    }
    
    let minter = minterCap.borrow()!
    
    return {
        "registeredModules": minter.getRegisteredModuleTypes(),
        "totalSupply": EvolvingCreatureNFT.totalSupply
    }
} 