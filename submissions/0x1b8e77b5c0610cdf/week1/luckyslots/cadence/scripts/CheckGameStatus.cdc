// CheckGameStatus.cdc
// 查询游戏状态的脚本

import LuckySlots from 0x1b8e77b5c0610cdf // 原始部署合约地址

// 该脚本返回指定游戏ID的游戏状态
pub fun main(gameId: UInt64): {String: AnyStruct} {
    // 获取游戏会话信息
    let gameSession = LuckySlots.getGameInfo(gameId: gameId)
        ?? panic("游戏ID不存在：".concat(gameId.toString()))

    // 构造结果
    let result: {String: AnyStruct} = {
        "id": gameSession.id,
        "player": gameSession.player,
        "betAmount": gameSession.betAmount,
        "timestamp": gameSession.timestamp,
        "status": gameSession.status.rawValue
    }

    // 添加随机请求ID（如果有）
    if let requestId = gameSession.randomRequestId {
        result["randomRequestId"] = requestId
    }

    // 添加符号结果（如果有）
    if let symbols = gameSession.symbols {
        // 将符号转换为可读形式
        let symbolNames = symbols.map(fun (s: LuckySlots.Symbol): String {
            switch s {
                case LuckySlots.Symbol.seven: return "7"
                case LuckySlots.Symbol.cherry: return "樱桃"
                case LuckySlots.Symbol.lemon: return "柠檬"
                case LuckySlots.Symbol.orange: return "橙子"
                case LuckySlots.Symbol.plum: return "李子"
                case LuckySlots.Symbol.bell: return "铃铛"
                case LuckySlots.Symbol.bar: return "BAR"
                default: return "未知"
            }
        })
        
        result["symbols"] = symbolNames
        result["symbolsRaw"] = symbols.map(fun (s: LuckySlots.Symbol): UInt8 { 
            return s.rawValue 
        })
    }

    // 添加奖金金额（如果有）
    if let winAmount = gameSession.winAmount {
        result["winAmount"] = winAmount
    }

    return result
} 