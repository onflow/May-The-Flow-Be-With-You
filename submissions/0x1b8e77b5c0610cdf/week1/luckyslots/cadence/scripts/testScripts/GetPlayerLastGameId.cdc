// GetPlayerLastGameId.cdc
// 获取玩家最后一个游戏ID的测试脚本

import LuckySlots from "../../contracts/LuckySlots.cdc" // 相对路径导入

// 返回指定玩家的最后一个游戏ID
// 如果玩家没有游戏或者无法访问游戏集合，返回0
access(all) fun main(playerAddress: Address): UInt64 {
    // 尝试获取玩家的游戏集合引用
    let collectionRef = getAccount(playerAddress)
        .getCapability(LuckySlots.GameCollectionPublicPath)
        .borrow<&{LuckySlots.GameCollectionPublic}>()
    
    // 如果无法获取到引用，返回0
    if collectionRef == nil {
        return 0
    }
    
    // 获取所有游戏ID
    let gameIds = collectionRef!.getPlayerGames(player: playerAddress)
    
    // 如果没有游戏，返回0
    if gameIds.length == 0 {
        return 0
    }
    
    // 返回最后一个游戏ID (假设游戏ID是按顺序分配的，最大的ID就是最后一个)
    return gameIds[gameIds.length - 1]
} 