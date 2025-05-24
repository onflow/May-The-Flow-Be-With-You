// RevealResult.cdc
// 揭示游戏结果交易脚本

import LuckySlots from "../contracts/LuckySlots.cdc"

// 该交易揭示游戏结果，使用链上随机数生成游戏符号并计算奖励
transaction(gameId: UInt64) {
    // 玩家的游戏集合引用
    let gameCollection: &{LuckySlots.GameCollectionPublic}
    
    prepare(account: AuthAccount) {
        // 获取玩家的游戏集合引用
        self.gameCollection = account.borrow<&{LuckySlots.GameCollectionPublic}>(
            from: LuckySlots.GameCollectionStoragePath
        ) ?? panic("无法获取游戏集合")
    }
    
    execute {
        // 揭示游戏结果
        self.gameCollection.revealGame(gameId: gameId)
        
        // 获取游戏会话信息
        let gameSession = self.gameCollection.getGameSession(gameId: gameId)
            ?? panic("无法获取游戏会话")
        
        // 检查游戏是否已揭示
        assert(gameSession.status == LuckySlots.GameStatus.revealed, message: "游戏尚未揭示结果")
        
        // 获取游戏符号和奖励金额
        let symbols = gameSession.symbols!
        let winAmount = gameSession.winAmount!
        
        // 输出游戏结果
        let symbolNames = [
            "七", "樱桃", "柠檬", "橙子", "李子", "铃铛", "条形"
        ]
        
        let symbolsDisplay = symbolNames[symbols[0].rawValue]
            .concat(" - ")
            .concat(symbolNames[symbols[1].rawValue])
            .concat(" - ")
            .concat(symbolNames[symbols[2].rawValue])
        
        log("游戏结果：".concat(symbolsDisplay))
        
        if winAmount > 0.0 {
            log("恭喜！您赢得了 ".concat(winAmount.toString()).concat(" FLOW"))
        } else {
            log("很遗憾，您没有赢得奖励")
        }
    }
} 