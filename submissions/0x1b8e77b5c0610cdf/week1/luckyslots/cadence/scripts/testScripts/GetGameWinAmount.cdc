// GetGameWinAmount.cdc
// 获取游戏奖励金额的测试脚本

import LuckySlots from "../../contracts/LuckySlots.cdc" // 相对路径导入

// 返回指定游戏ID的奖励金额
// 如果游戏不存在或者奖励金额为nil，则返回0.0
access(all) fun main(gameId: UInt64): UFix64 {
    let gameOpt = LuckySlots.getGameInfo(gameId: gameId)
    
    // 如果游戏不存在，返回0.0
    if gameOpt == nil {
        return 0.0
    }
    
    // 如果游戏奖励金额未设置，返回0.0
    if gameOpt!.winAmount == nil {
        return 0.0
    }
    
    // 返回游戏奖励金额
    return gameOpt!.winAmount!
} 