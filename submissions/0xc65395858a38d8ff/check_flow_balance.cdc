// check_flow_balance.cdc
// Script to check the FlowToken balance of an account

import FungibleToken from 0xee82856bf20e2aa6
import FlowToken from 0x0ae53cb6e3f42a79

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    
    let vaultRef = account.capabilities.borrow<&{FungibleToken.Balance}>(
        /public/flowTokenBalance
    ) ?? panic("Could not borrow Balance reference to the Vault")

    return vaultRef.balance
} 