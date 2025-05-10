// WithdrawWinnings.cdc
// 提取游戏奖金交易脚本

import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import LuckySlots from "../contracts/LuckySlots.cdc"

// 该交易允许玩家提取已揭示游戏的奖金
transaction(gameId: UInt64) {
    // 玩家的游戏集合引用
    let gameCollection: &{LuckySlots.GameCollectionPublic}
    // 玩家的Flow代币金库引用
    let flowTokenReceiver: &{FungibleToken.Receiver}
    
    prepare(account: AuthAccount) {
        // 获取玩家的游戏集合引用
        self.gameCollection = account.borrow<&{LuckySlots.GameCollectionPublic}>(
            from: LuckySlots.GameCollectionStoragePath
        ) ?? panic("无法获取游戏集合")
        
        // 获取玩家的Flow代币金库引用
        self.flowTokenReceiver = account.borrow<&{FungibleToken.Receiver}>(
            from: /storage/flowTokenVault
        ) ?? panic("无法获取Flow代币金库")
    }
    
    execute {
        // 提取游戏奖金
        let prize <- self.gameCollection.withdrawPrize(gameId: gameId)
        
        // 获取奖金金额
        let amount = prize.balance
        
        // 将奖金存入玩家的Flow代币金库
        self.flowTokenReceiver.deposit(from: <-prize)
        
        log("成功提取奖金：".concat(amount.toString()).concat(" FLOW"))
    }
} 