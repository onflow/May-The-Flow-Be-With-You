// GetNextGameId.cdc
// 获取下一个游戏ID的测试脚本

import LuckySlots from "../../contracts/LuckySlots.cdc" // 相对路径导入

// 通过公共方法获取下一个游戏ID
access(all) fun main(): UInt64 {
    return LuckySlots.getNextGameId() // 使用合约提供的公共方法
} 