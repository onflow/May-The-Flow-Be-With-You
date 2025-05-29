import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

/// Simple token gating contract
access(all) contract FlowGating {
    
    /// Check if user has at least 1.0 FLOW for page access
    access(all) fun hasAccess(userAddress: Address): Bool {
        let userAccount = getAccount(userAddress)
        
        if let vaultRef = userAccount.capabilities.borrow<&FlowToken.Vault>(/public/flowTokenBalance) {
            return vaultRef.balance >= 1.0
        }
        
        return false
    }
}