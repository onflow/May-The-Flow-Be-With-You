// GetGameStatus.cdc
// 获取游戏状态的测试脚本

import LuckySlots from "../../contracts/LuckySlots.cdc" // 相对路径导入

// 返回指定游戏ID的游戏状态
// 如果游戏不存在，返回nil
// 如果游戏存在，返回其状态值
access(all) fun main(gameId: UInt64): UInt8? {
    let gameOpt = LuckySlots.getGameInfo(gameId: gameId)
    if gameOpt == nil {
        return nil
    }
    return gameOpt!.status.rawValue
} 