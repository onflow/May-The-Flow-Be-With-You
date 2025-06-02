// Get Registered Modules Script
import "EvolvingCreatureNFT"

access(all) fun main(contractAddress: Address): {String: AnyStruct} {
    return {
        "registeredModules": EvolvingCreatureNFT.getRegisteredModules(),
        "totalSupply": EvolvingCreatureNFT.totalSupply
    }
} 