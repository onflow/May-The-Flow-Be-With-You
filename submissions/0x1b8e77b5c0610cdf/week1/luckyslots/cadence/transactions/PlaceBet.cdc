// PlaceBet.cdc
// 玩家下注交易脚本

import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import LuckySlots from "../contracts/LuckySlots.cdc"

// 该交易允许玩家下注参与游戏
transaction(betAmount: UFix64) {
    // 玩家的Flow代币
    let payment: @FlowToken.Vault
    // 玩家的游戏集合引用
    let gameCollection: &{LuckySlots.GameCollectionPublic}
    
    prepare(account: AuthAccount) {
        // 确保玩家有游戏集合，如果没有则创建
        if account.borrow<&LuckySlots.GameCollection>(from: LuckySlots.GameCollectionStoragePath) == nil {
            // 创建新的游戏集合
            let collection <- LuckySlots.createGameCollection()
            
            // 保存到存储
            account.save(<-collection, to: LuckySlots.GameCollectionStoragePath)
            
            // 创建公共引用
            account.link<&{LuckySlots.GameCollectionPublic}>(
                LuckySlots.GameCollectionPublicPath,
                target: LuckySlots.GameCollectionStoragePath
            )
        }
        
        // 获取玩家的游戏集合引用
        self.gameCollection = account.borrow<&{LuckySlots.GameCollectionPublic}>(
            from: LuckySlots.GameCollectionStoragePath
        )!
        
        // 获取Flow代币
        let vaultRef = account.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("无法获取Flow代币金库")
        
        // 提取指定数量的Flow代币
        self.payment <- vaultRef.withdraw(amount: betAmount)
    }
    
    execute {
        // 下注并获取游戏ID
        let gameId = self.gameCollection.placeBet(amount: <-self.payment)
        
        log("下注成功！游戏ID：".concat(gameId.toString()))
    }
} 