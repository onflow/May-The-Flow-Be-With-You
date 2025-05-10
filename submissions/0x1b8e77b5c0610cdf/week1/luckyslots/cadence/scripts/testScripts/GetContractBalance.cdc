// GetContractBalance.cdc
// 获取合约余额的测试脚本

import LuckySlots from "../../contracts/LuckySlots.cdc" // 相对路径导入

// 返回合约余额
access(all) fun main(): UFix64 {
    return LuckySlots.getContractBalance()
} 