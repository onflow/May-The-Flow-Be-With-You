// GetGameHistory.cdc
// 获取玩家游戏历史记录的脚本

import LuckySlots from 0x1b8e77b5c0610cdf // 原始部署合约地址

// 该脚本返回指定玩家的游戏历史记录
pub fun main(player: Address): [UInt64] {
    // 尝试获取玩家的游戏集合公共引用
    let collectionRef = getAccount(player)
        .getCapability(LuckySlots.GameCollectionPublicPath)
        .borrow<&LuckySlots.GameCollection{LuckySlots.GameCollectionPublic}>()
    
    // 如果玩家没有创建游戏集合，则返回空数组
    if collectionRef == nil {
        return []
    }
    
    // 返回玩家的游戏ID列表
    return collectionRef!.getPlayerGames(player: player)
} 