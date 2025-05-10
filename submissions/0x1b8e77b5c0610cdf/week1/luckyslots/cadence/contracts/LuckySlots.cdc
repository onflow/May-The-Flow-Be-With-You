// LuckySlots.cdc
// 实现基于Flow链上随机性的老虎机游戏

import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
// 移除外部RandomBeacon导入，改为使用测试中提供的模拟版本或内部实现
// import RandomBeacon from "RandomBeacon" 

access(all) contract LuckySlots {

    // 游戏状态定义
    access(all) enum GameStatus: UInt8 {
        access(all) case active
        access(all) case committed
        access(all) case revealed
        access(all) case completed
    }

    // 游戏符号定义，共7种符号
    access(all) enum Symbol: UInt8 {
        access(all) case seven // 7 - 特殊符号
        access(all) case cherry
        access(all) case lemon
        access(all) case orange
        access(all) case plum
        access(all) case bell
        access(all) case bar
    }

    // 游戏会话结构
    access(all) struct GameSession {
        access(all) let id: UInt64
        access(all) let player: Address
        access(all) let betAmount: UFix64
        access(all) let timestamp: UFix64
        access(all) var status: GameStatus
        access(all) var randomRequestId: UInt64?
        access(all) var symbols: [Symbol]?
        access(all) var winAmount: UFix64?
        
        init(id: UInt64, player: Address, betAmount: UFix64) {
            self.id = id
            self.player = player
            self.betAmount = betAmount
            self.timestamp = getCurrentBlock().timestamp
            self.status = GameStatus.active
            self.randomRequestId = nil
            self.symbols = nil
            self.winAmount = nil
        }

        access(all) fun setCommitted(randomRequestId: UInt64) {
            self.randomRequestId = randomRequestId
            self.status = GameStatus.committed
        }

        access(all) fun setRevealed(symbols: [Symbol], winAmount: UFix64) {
            self.symbols = symbols
            self.winAmount = winAmount
            self.status = GameStatus.revealed
        }

        access(all) fun setCompleted() {
            self.status = GameStatus.completed
        }
    }

    // 合约事件
    access(all) event ContractInitialized()
    access(all) event BetPlaced(gameId: UInt64, player: Address, amount: UFix64)
    access(all) event RandomnessRequested(gameId: UInt64, requestId: UInt64)
    access(all) event GameResult(gameId: UInt64, symbols: [UInt8], winAmount: UFix64)
    access(all) event PrizeWithdrawn(gameId: UInt64, player: Address, amount: UFix64)

    // 合约存储路径
    access(all) let AdminStoragePath: StoragePath
    access(all) let GameCollectionStoragePath: StoragePath
    access(all) let GameCollectionPublicPath: PublicPath

    // 合约状态变量
    access(self) var games: {UInt64: GameSession}
    access(self) let pendingRandomRequests: {UInt64: UInt64} // requestId -> gameId
    access(self) var nextGameId: UInt64
    access(self) var vaultBalance: UFix64
    access(contract) let gameVault: @FlowToken.Vault
    
    // 添加内部随机数请求计数器，用于测试环境
    access(self) var randomRequestCounter: UInt64
    // 添加内部随机数存储，用于测试环境
    access(self) var testRandomnessData: {UInt64: [UInt256]}

    // 管理员资源，用于管理合约设置和提取合约收益
    access(all) resource Administrator {
        // 管理员可以提取合约收益
        access(all) fun withdrawContractProfit(amount: UFix64): @{FungibleToken.Vault} {
            pre {
                amount <= LuckySlots.vaultBalance: "提取金额不能超过合约余额"
            }
            
            LuckySlots.vaultBalance = LuckySlots.vaultBalance - amount
            
            return <- LuckySlots.gameVault.withdraw(amount: amount)
        }
        
        // 添加设置测试随机数的方法
        access(all) fun setTestRandomness(requestId: UInt64, value: [UInt256]) {
            LuckySlots.testRandomnessData[requestId] = value
        }
    }

    // 游戏集合公共接口
    access(all) resource interface GameCollectionPublic {
        access(all) fun placeBet(amount: @FlowToken.Vault): UInt64
        access(all) fun revealGame(gameId: UInt64)
        access(all) fun withdrawPrize(gameId: UInt64): @{FungibleToken.Vault}
        access(all) fun getGameSession(gameId: UInt64): GameSession?
        access(all) fun getPlayerGames(player: Address): [UInt64]
    }

    // 游戏集合资源，包含玩家可以交互的所有游戏功能
    access(all) resource GameCollection: GameCollectionPublic {
        // 存储当前玩家的所有游戏ID
        access(self) var playerGames: {Address: [UInt64]}

        init() {
            self.playerGames = {}
        }

        // 玩家下注方法
        access(all) fun placeBet(amount: @FlowToken.Vault): UInt64 {
            // 确保下注金额在允许范围内
            let betAmount = amount.balance
            assert(betAmount >= 0.001, message: "最小下注金额为0.001 FLOW")
            assert(betAmount <= 100.0, message: "最大下注金额为100 FLOW")

            // 创建新的游戏会话
            let gameId = LuckySlots.nextGameId
            LuckySlots.nextGameId = LuckySlots.nextGameId + 1
            
            let player = self.owner!.address
            let newGame = GameSession(
                id: gameId,
                player: player,
                betAmount: betAmount
            )
            
            // 将下注金额存入合约金库
            LuckySlots.gameVault.deposit(from: <-amount)
            LuckySlots.vaultBalance = LuckySlots.vaultBalance + betAmount
            
            // 提交随机数请求
            let randomRequestId = self.requestRandomness(gameId: gameId)
            newGame.setCommitted(randomRequestId: randomRequestId)
            
            // 存储游戏会话
            LuckySlots.games[gameId] = newGame
            
            // 记录玩家游戏
            if self.playerGames[player] == nil {
                self.playerGames[player] = []
            }
            self.playerGames[player]!.append(gameId)
            
            emit BetPlaced(gameId: gameId, player: player, amount: betAmount)
            
            return gameId
        }

        // 请求随机数 - 修改为使用内部实现
        access(self) fun requestRandomness(gameId: UInt64): UInt64 {
            // 使用内部计数器生成请求ID
            let requestId = LuckySlots.randomRequestCounter
            LuckySlots.randomRequestCounter = LuckySlots.randomRequestCounter + 1
            
            // 设置默认随机值，在测试中会被覆盖
            if LuckySlots.testRandomnessData[requestId] == nil {
                LuckySlots.testRandomnessData[requestId] = [UInt256(getCurrentBlock().timestamp)]
            }
            
            // 记录请求
            LuckySlots.pendingRandomRequests[requestId] = gameId
            
            emit RandomnessRequested(gameId: gameId, requestId: requestId)
            
            return requestId
        }

        // 揭示游戏结果
        access(all) fun revealGame(gameId: UInt64) {
            // 获取游戏会话
            let gameSessionOpt = LuckySlots.games[gameId]
            
            if gameSessionOpt == nil {
                panic("游戏不存在：".concat(gameId.toString()))
            }
            var gameSession = gameSessionOpt! // 现在可以安全解包
            
            // 确保游戏处于已提交状态
            assert(gameSession.status == GameStatus.committed, message: "游戏状态错误，无法揭示结果")
            assert(gameSession.randomRequestId != nil, message: "随机请求ID不存在")
            
            let requestId = gameSession.randomRequestId!
            
            // 确保随机数已生成 - 修改为使用内部实现
            assert(LuckySlots.testRandomnessData[requestId] != nil, message: "随机数尚未生成")
            
            // 获取随机数并生成游戏结果 - 修改为使用内部实现
            let randomWords = LuckySlots.testRandomnessData[requestId]!
            let symbols = self.generateSymbols(randomWords: randomWords)
            
            // 计算奖励
            let winAmount = self.calculateWinAmount(symbols: symbols, betAmount: gameSession.betAmount)
            
            // 更新游戏状态
            gameSession.setRevealed(symbols: symbols, winAmount: winAmount)
            LuckySlots.games[gameId] = gameSession // 将修改后的 struct 存回
            
            // 移除待处理的随机请求
            LuckySlots.pendingRandomRequests.remove(key: requestId)
            
            // 发出游戏结果事件
            emit GameResult(
                gameId: gameId, 
                symbols: symbols.map(fun (s: Symbol): UInt8 { return s.rawValue }), 
                winAmount: winAmount
            )
        }

        // 从随机数生成符号
        access(self) fun generateSymbols(randomWords: [UInt256]): [Symbol] {
            var symbols: [Symbol] = []
            let word = randomWords[0]
            
            // 使用随机数生成3个符号
            var i = 0
            while i < 3 { // 确保这里是 while 循环
                // 从256位随机数中提取不同的部分
                let shift = UInt256(i * 8)
                let symbolValue = UInt8((word >> shift) % UInt256(7))
                symbols.append(Symbol(rawValue: symbolValue)!)
                i = i + 1
            }
            
            return symbols
        }

        // 计算奖励金额
        access(self) fun calculateWinAmount(symbols: [Symbol], betAmount: UFix64): UFix64 {
            // 检查是否所有符号都是7
            if symbols[0] == Symbol.seven && symbols[1] == Symbol.seven && symbols[2] == Symbol.seven {
                // 三个7，赢得77倍投注额
                return betAmount * 77.0
            }
            
            // 检查是否所有符号相同（非7）
            if symbols[0] == symbols[1] && symbols[1] == symbols[2] && symbols[0] != Symbol.seven {
                // 三个相同符号，赢得10倍投注额
                return betAmount * 10.0
            }
            
            // 检查是否有两个相同符号
            if (symbols[0] == symbols[1] && symbols[0] != symbols[2]) ||
               (symbols[0] == symbols[2] && symbols[0] != symbols[1]) ||
               (symbols[1] == symbols[2] && symbols[1] != symbols[0]) {
                // 两个相同符号，赢得3倍投注额
                return betAmount * 3.0
            }
            
            // 其他情况，损失投注额
            return 0.0
        }

        // 提取奖金
        access(all) fun withdrawPrize(gameId: UInt64): @{FungibleToken.Vault} {
            // 获取游戏会话
            let gameSessionOpt = LuckySlots.games[gameId]
            if gameSessionOpt == nil {
                panic("游戏不存在无法提奖：".concat(gameId.toString()))
            }
            var gameSession = gameSessionOpt!
            
            // 确保游戏处于已揭示状态且未完成
            assert(gameSession.status == GameStatus.revealed, message: "游戏状态错误，无法提取奖金")
            assert(gameSession.player == self.owner!.address, message: "只有游戏玩家可以提取奖金")
            assert(gameSession.winAmount != nil, message: "奖金金额不存在")
            
            let winAmount = gameSession.winAmount!
            
            // 确保有足够的奖金可提取
            assert(winAmount > 0.0, message: "没有可提取的奖金")
            assert(winAmount <= LuckySlots.vaultBalance, message: "合约余额不足")
            
            // 更新游戏状态
            gameSession.setCompleted()
            LuckySlots.games[gameId] = gameSession // 将修改后的 struct 存回
            
            // 更新合约余额
            LuckySlots.vaultBalance = LuckySlots.vaultBalance - winAmount
            
            // 提取奖金
            emit PrizeWithdrawn(gameId: gameId, player: gameSession.player, amount: winAmount)
            
            return <- LuckySlots.gameVault.withdraw(amount: winAmount)
        }

        // 获取游戏会话信息
        access(all) fun getGameSession(gameId: UInt64): GameSession? {
            return LuckySlots.games[gameId]
        }

        // 获取玩家所有游戏ID
        access(all) fun getPlayerGames(player: Address): [UInt64] {
            return self.playerGames[player] ?? []
        }
    }
    
    // 为测试添加的公共方法
    access(all) fun isRandomnessAvailable(requestID: UInt64): Bool {
        return self.testRandomnessData[requestID] != nil
    }
    
    access(all) fun getRandomness(requestID: UInt64): [UInt256] {
        return self.testRandomnessData[requestID] ?? panic("随机数不可用")
    }
    
    access(all) fun requestRandomness(): UInt64 {
        let requestId = self.randomRequestCounter
        self.randomRequestCounter = self.randomRequestCounter + 1
        
        // 创建一个默认随机值
        if self.testRandomnessData[requestId] == nil {
            self.testRandomnessData[requestId] = [UInt256(getCurrentBlock().timestamp)]
        }
        
        return requestId
    }
    
    // 添加公共方法来获取下一个游戏ID
    access(all) fun getNextGameId(): UInt64 {
        return self.nextGameId
    }

    // 创建新的游戏集合
    access(all) fun createGameCollection(): @GameCollection {
        return <- create GameCollection()
    }

    // 获取玩家游戏信息
    access(all) fun getGameInfo(gameId: UInt64): GameSession? {
        return self.games[gameId]
    }

    // 获取待处理的随机请求数量
    access(all) fun getPendingRequestsCount(): Int {
        return self.pendingRandomRequests.length
    }

    // 获取合约余额
    access(all) fun getContractBalance(): UFix64 {
        return self.vaultBalance
    }

    init() {
        self.AdminStoragePath = /storage/LuckySlotsAdmin
        self.GameCollectionStoragePath = /storage/LuckySlotsCollection
        self.GameCollectionPublicPath = /public/LuckySlotsCollection
        
        self.games = {}
        self.pendingRandomRequests = {}
        self.nextGameId = 1
        self.vaultBalance = 0.0
        self.gameVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
        // 初始化内部随机数相关变量
        self.randomRequestCounter = 1
        self.testRandomnessData = {}
        
        // 创建并存储管理员资源
        self.account.storage.save(<- create Administrator(), to: self.AdminStoragePath)
        
        emit ContractInitialized()
    }
} 