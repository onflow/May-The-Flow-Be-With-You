import FlowGating from 0xdfab49498c36d959

access(all) fun main(userAddress: Address): Bool {
    return FlowGating.hasAccess(userAddress: userAddress)
}