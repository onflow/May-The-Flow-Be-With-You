// GetAccountBalance.cdc
// 获取账户FlowToken余额的测试脚本

import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"

// 返回指定账户的Flow代币余额
// 如果无法访问账户余额，返回0.0
access(all) fun main(account: Address): UFix64 {
    // 尝试获取FlowToken余额引用
    let vaultRef = getAccount(account)
        .getCapability(/public/flowTokenBalance)
        .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
    
    // 如果无法访问余额，返回0.0
    if vaultRef == nil {
        return 0.0
    }
    
    // 返回余额
    return vaultRef!.balance
} 