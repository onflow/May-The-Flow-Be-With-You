# LuckySlots777 测试说明

本目录包含LuckySlots777游戏合约的测试用例，用于验证合约功能的正确性。

## 测试文件说明

- `LuckySlots_test.cdc`: 主要测试文件，包含合约部署、下注、揭示结果和提取奖金等基本功能测试
- `WinCalculation_test.cdc`: 专门测试奖励计算功能，验证不同符号组合的奖励计算是否正确

## 运行测试

要运行测试，您需要安装Flow CLI并执行以下命令：

```bash
# 运行所有测试
flow test tests/

# 运行特定测试文件
flow test tests/LuckySlots777_test.cdc
flow test tests/WinCalculation_test.cdc
```

## 测试辅助脚本

测试需要的辅助脚本位于`scripts/testScripts/`目录下，包括：

- `GetNextGameId.cdc`: 获取下一个游戏ID
- `GetContractBalance.cdc`: 获取合约余额
- `GetAccountBalance.cdc`: 获取账户余额
- `GetPlayerLastGameId.cdc`: 获取玩家最后一个游戏ID
- `GetGameStatus.cdc`: 获取游戏状态
- `GetGameWinAmount.cdc`: 获取游戏奖金

## 注意事项

1. 测试使用模拟的RandomBeacon合约，而不是实际的Flow链上随机性服务
2. 测试环境中的随机值是可控的，用于验证不同情况下的游戏结果
3. 在实际部署时，需要使用Flow网络上真实的RandomBeacon合约地址 