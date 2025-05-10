// LuckySlots_test.cdc
// LuckySlots游戏合约测试

import Test
import "FungibleToken"
import "FlowToken"

// 导入主合约
import LuckySlots from "../contracts/LuckySlots.cdc"

// 测试套件
access(all)
fun setup(): Test.TestDependencies {
    // 创建模拟区块链
    let blockchain = Test.newEmulatorBlockchain()
    
    // 创建测试账户
    let deployer = blockchain.createAccount()
    let player1 = blockchain.createAccount()
    let player2 = blockchain.createAccount()
    
    // 给玩家账户添加Flow代币
    let mintedVault <- FlowToken.createEmptyVault()
    let minter = blockchain.serviceAccount().contracts.borrow<&FlowToken.Minter>(from: /storage/flowTokenMinter)
            ?? panic("无法借用FlowToken铸造者")
    minter.mintTokens(amount: 1000.0, recipient: mintedVault)
    
    player1.getCapability(/public/flowTokenReceiver)
        .borrow<&{FungibleToken.Receiver}>()!
        .deposit(from: <-mintedVault.withdraw(amount: 500.0))
        
    player2.getCapability(/public/flowTokenReceiver)
        .borrow<&{FungibleToken.Receiver}>()!
        .deposit(from: <-mintedVault)
    
    // 部署LuckySlots合约
    blockchain.deployContract(
        name: "LuckySlots",
        code: LuckySlots.cdc,
        account: deployer.address
    )

    // 返回测试依赖
    return Test.TestDependencies(
        blockchain: blockchain,
        accounts: {
            "Deployer": deployer.address,
            "Player1": player1.address,
            "Player2": player2.address
        }
    )
}

// 测试合约初始化
access(all)
fun testContractInitialization() {
    let deps = setup()
    let blockchain = deps.blockchain
    let deployerAddress = deps.accounts["Deployer"]!
    
    // 验证合约是否正确部署
    let luckySlots = blockchain.getContract(name: "LuckySlots")
    Test.assert(luckySlots.address == deployerAddress)
    
    // 验证初始游戏ID是否为1
    let script = Test.readFile("../scripts/testScripts/GetNextGameId.cdc")
    let result = blockchain.executeScript(script, [])
    Test.expect(result, Test.beSucceeded())
    Test.assertEqual(result.returnValue as! UInt64, 1 as UInt64)
    
    // 验证初始合约余额是否为0
    let balanceScript = Test.readFile("../scripts/testScripts/GetContractBalance.cdc")
    let balanceResult = blockchain.executeScript(balanceScript, [])
    Test.expect(balanceResult, Test.beSucceeded())
    Test.assertEqual(balanceResult.returnValue as! UFix64, 0.0 as UFix64)
}

// 测试下注功能
access(all)
fun testPlaceBet() {
    let deps = setup()
    let blockchain = deps.blockchain
    let player1Address = deps.accounts["Player1"]!
    
    // 检查玩家初始余额
    let checkBalanceScript = Test.readFile("../scripts/testScripts/GetAccountBalance.cdc")
    let initialBalanceResult = blockchain.executeScript(checkBalanceScript, [player1Address])
    Test.expect(initialBalanceResult, Test.beSucceeded())
    let initialBalance = initialBalanceResult.returnValue as! UFix64
    
    // 执行下注交易
    let betTx = Test.readFile("../transactions/PlaceBet.cdc")
    let betAmount: UFix64 = 10.0
    let betResult = blockchain.executeTransaction(
        betTx,
        [betAmount],
        [blockchain.getAccount(player1Address)]
    )
    Test.expect(betResult, Test.beSucceeded())
    
    // 验证下注后的余额减少
    let finalBalanceResult = blockchain.executeScript(checkBalanceScript, [player1Address])
    Test.expect(finalBalanceResult, Test.beSucceeded())
    let finalBalance = finalBalanceResult.returnValue as! UFix64
    Test.assert(finalBalance == initialBalance - betAmount)
    
    // 验证合约余额增加
    let contractBalanceScript = Test.readFile("../scripts/testScripts/GetContractBalance.cdc")
    let contractBalanceResult = blockchain.executeScript(contractBalanceScript, [])
    Test.expect(contractBalanceResult, Test.beSucceeded())
    Test.assertEqual(contractBalanceResult.returnValue as! UFix64, betAmount)
    
    // 验证游戏ID是否正确分配
    let gameIdScript = Test.readFile("../scripts/testScripts/GetPlayerLastGameId.cdc")
    let gameIdResult = blockchain.executeScript(gameIdScript, [player1Address])
    Test.expect(gameIdResult, Test.beSucceeded())
    Test.assertEqual(gameIdResult.returnValue as! UInt64, 1 as UInt64)
}

// 测试揭示游戏结果
access(all)
fun testRevealResult() {
    let deps = setup()
    let blockchain = deps.blockchain
    let player1Address = deps.accounts["Player1"]!
    
    // 执行下注交易
    let betTx = Test.readFile("../transactions/PlaceBet.cdc")
    let betAmount: UFix64 = 10.0
    let betResult = blockchain.executeTransaction(
        betTx,
        [betAmount],
        [blockchain.getAccount(player1Address)]
    )
    Test.expect(betResult, Test.beSucceeded())
    
    // 获取游戏ID
    let gameIdScript = Test.readFile("../scripts/testScripts/GetPlayerLastGameId.cdc")
    let gameIdResult = blockchain.executeScript(gameIdScript, [player1Address])
    Test.expect(gameIdResult, Test.beSucceeded())
    let gameId = gameIdResult.returnValue as! UInt64
    
    // 执行揭示结果交易
    let revealTx = Test.readFile("../transactions/RevealResult.cdc")
    let revealResult = blockchain.executeTransaction(
        revealTx,
        [gameId],
        [blockchain.getAccount(player1Address)]
    )
    Test.expect(revealResult, Test.beSucceeded())
    
    // 验证游戏状态是否为已揭示
    let statusScript = Test.readFile("../scripts/testScripts/GetGameStatus.cdc")
    let statusResult = blockchain.executeScript(statusScript, [gameId])
    Test.expect(statusResult, Test.beSucceeded())
    Test.assertEqual(statusResult.returnValue as! UInt8, LuckySlots.GameStatus.revealed.rawValue)
}

// 测试提取奖金
access(all)
fun testWithdrawWinnings() {
    let deps = setup()
    let blockchain = deps.blockchain
    let player1Address = deps.accounts["Player1"]!
    
    // 执行下注交易
    let betTx = Test.readFile("../transactions/PlaceBet.cdc")
    let betAmount: UFix64 = 10.0
    let betResult = blockchain.executeTransaction(
        betTx,
        [betAmount],
        [blockchain.getAccount(player1Address)]
    )
    Test.expect(betResult, Test.beSucceeded())
    
    // 获取游戏ID
    let gameIdScript = Test.readFile("../scripts/testScripts/GetPlayerLastGameId.cdc")
    let gameIdResult = blockchain.executeScript(gameIdScript, [player1Address])
    Test.expect(gameIdResult, Test.beSucceeded())
    let gameId = gameIdResult.returnValue as! UInt64
    
    // 执行揭示结果交易
    let revealTx = Test.readFile("../transactions/RevealResult.cdc")
    let revealResult = blockchain.executeTransaction(
        revealTx,
        [gameId],
        [blockchain.getAccount(player1Address)]
    )
    Test.expect(revealResult, Test.beSucceeded())
    
    // 检查玩家初始余额
    let checkBalanceScript = Test.readFile("../scripts/testScripts/GetAccountBalance.cdc")
    let initialBalanceResult = blockchain.executeScript(checkBalanceScript, [player1Address])
    Test.expect(initialBalanceResult, Test.beSucceeded())
    let initialBalance = initialBalanceResult.returnValue as! UFix64
    
    // 执行提取奖金交易
    let withdrawTx = Test.readFile("../transactions/WithdrawWinnings.cdc")
    let withdrawResult = blockchain.executeTransaction(
        withdrawTx,
        [gameId],
        [blockchain.getAccount(player1Address)]
    )
    Test.expect(withdrawResult, Test.beSucceeded())
    
    // 验证余额增加
    let finalBalanceResult = blockchain.executeScript(checkBalanceScript, [player1Address])
    Test.expect(finalBalanceResult, Test.beSucceeded())
    let finalBalance = finalBalanceResult.returnValue as! UFix64
    
    // 获取游戏信息以验证奖金
    let winAmountScript = Test.readFile("../scripts/testScripts/GetGameWinAmount.cdc")
    let winAmountResult = blockchain.executeScript(winAmountScript, [gameId])
    Test.expect(winAmountResult, Test.beSucceeded())
    let winAmount = winAmountResult.returnValue as! UFix64
    
    // 验证余额变化与奖金相符
    Test.assert(finalBalance == initialBalance + winAmount)
    
    // 验证游戏状态为已关闭
    let statusScript = Test.readFile("../scripts/testScripts/GetGameStatus.cdc")
    let statusResult = blockchain.executeScript(statusScript, [gameId])
    Test.expect(statusResult, Test.beSucceeded())
    Test.assertEqual(statusResult.returnValue as! UInt8, LuckySlots.GameStatus.completed.rawValue)
} 