# LuckySlots - 基于Flow链上随机性的老虎机游戏

## 概述
LuckySlots是一个利用Flow区块链原生随机性功能实现的老虎机游戏。游戏采用commit-reveal机制，确保每次抽奖结果都是真正不可预测和无法操纵的。玩家下注后，系统利用Flow的Random Beacon生成密码学安全的随机数，决定老虎机的滚轮结果，提供公平透明的游戏体验。

## 实现细节
项目使用Cadence智能合约实现，主要功能包括：

1. **下注机制**：玩家使用Flow代币下注
2. **随机性生成**：利用Flow的链上随机性功能生成安全随机数
3. **结果验证**：通过commit-reveal方案确保随机结果的公平性
4. **奖励分配**：基于不同符号组合分配不同倍数的奖励
5. **游戏记录**：在链上存储游戏历史记录

## 游戏规则
- 老虎机有3个滚轮，每个滚轮有7种不同符号
- 玩家下注后，触发随机生成过程
- 相同符号组合获得不同倍数奖励：
  - 三个7：赢得投注额的77倍
  - 三个相同符号（非7）：赢得投注额的10倍
  - 两个相同符号：赢得投注额的3倍
  - 其他组合：损失投注金额

## 技术特点
- 使用Flow链上随机性生成器，确保游戏公平性
- 实现commit-reveal机制防止预测和操纵
- 智能合约自动执行奖励分配
- 游戏结果和奖励分配过程完全透明且可验证

## 文件结构
- `contracts/`: 包含Cadence智能合约代码
  - `LuckySlots777.cdc`: 主游戏合约
  - `RandomnessConsumer.cdc`: 随机性接口合约
- `transactions/`: 包含交互交易脚本
  - `PlaceBet.cdc`: 下注交易
  - `RevealResult.cdc`: 查看结果交易
  - `WithdrawWinnings.cdc`: 提取奖金交易
- `scripts/`: 包含查询脚本
  - `CheckGameStatus.cdc`: 检查游戏状态
  - `GetGameHistory.cdc`: 获取游戏历史
- `tests/`: 包含测试代码
  - `LuckySlots777_test.cdc`: 基本功能测试
  - `WinCalculation_test.cdc`: 奖励计算测试

## 测试和部署
详细的测试说明可查看 [`tests/README.md`](./tests/README.md)。

要部署此合约到Flow Testnet：

1. 安装[Flow CLI](https://docs.onflow.org/flow-cli/install/)
2. 配置Flow账户并获取测试代币
3. 修改合约中的导入地址为正确的Testnet地址
4. 部署合约：
   ```bash
   flow project deploy --network=testnet
   ```

## 使用流程
1. 玩家通过`PlaceBet.cdc`交易下注
2. 合约请求随机数并创建游戏会话
3. 随机数生成后，玩家通过`RevealResult.cdc`交易查看结果
4. 如有奖金，玩家通过`WithdrawWinnings.cdc`交易提取奖金

## 链上随机性优势
本项目展示了Flow链上随机性的几个关键优势：
- **无需预言机**：直接使用Flow内置的随机性功能，无需依赖外部服务
- **可验证公平**：随机结果完全透明且可验证
- **防止操纵**：通过commit-reveal机制防止玩家或运营方操纵结果
- **低成本高效**：比使用外部预言机更经济和高效 

## 👋 Welcome Flow Developer!

This project is a starting point for you to develop smart contracts on the Flow Blockchain. It comes with example contracts, scripts, transactions, and tests to help you get started.

## 🔨 Getting Started

Here are some essential resources to help you hit the ground running:

- **[Flow Documentation](https://developers.flow.com/)** - The official Flow Documentation is a great starting point to start learning about about [building](https://developers.flow.com/build/flow) on Flow.
- **[Cadence Documentation](https://cadence-lang.org/docs/language)** - Cadence is the native language for the Flow Blockchain. It is a resource-oriented programming language that is designed for developing smart contracts.  The documentation is a great place to start learning about the language.
- **[Visual Studio Code](https://code.visualstudio.com/)** and the **[Cadence Extension](https://marketplace.visualstudio.com/items?itemName=onflow.cadence)** - It is recommended to use the Visual Studio Code IDE with the Cadence extension installed.  This will provide syntax highlighting, code completion, and other features to support Cadence development.
- **[Flow Clients](https://developers.flow.com/tools/clients)** - There are clients available in multiple languages to interact with the Flow Blockchain.  You can use these clients to interact with your smart contracts, run transactions, and query data from the network.
- **[Block Explorers](https://developers.flow.com/ecosystem/block-explorers)** - Block explorers are tools that allow you to explore on-chain data.  You can use them to view transactions, accounts, events, and other information.  [Flowser](https://flowser.dev/) is a powerful block explorer for local development on the Flow Emulator.

## 📦 Project Structure

Your project has been set up with the following structure:

- `flow.json` - This is the configuration file for your project (analogous to a `package.json` file for NPM).  It has been initialized with a basic configuration to get started.
- `/cadence` - This is where your Cadence smart contracts code lives

Inside the `cadence` folder you will find:
- `/contracts` - This folder contains your Cadence contracts (these are deployed to the network and contain the business logic for your application)
  - `Counter.cdc`
- `/scripts` - This folder contains your Cadence scripts (read-only operations)
  - `GetCounter.cdc`
- `/transactions` - This folder contains your Cadence transactions (state-changing operations)
  - `IncrementCounter.cdc`
- `/tests` - This folder contains your Cadence tests (integration tests for your contracts, scripts, and transactions to verify they behave as expected)
  - `Counter_test.cdc`

## Running the Existing Project

### Executing the `GetCounter` Script

To run the `GetCounter` script, use the following command:

```shell
flow scripts execute cadence/scripts/GetCounter.cdc
```

### Sending the `IncrementCounter` Transaction

To run the `IncrementCounter` transaction, use the following command:

```shell
flow transactions send cadence/transactions/IncrementCounter.cdc
```

To learn more about using the CLI, check out the [Flow CLI Documentation](https://developers.flow.com/tools/flow-cli).

## 👨‍💻 Start Developing

### Creating a New Contract

To add a new contract to your project, run the following command:

```shell
flow generate contract
```

This command will create a new contract file and add it to the `flow.json` configuration file.

### Creating a New Script

To add a new script to your project, run the following command:

```shell
flow generate script
```

This command will create a new script file.  Scripts are used to read data from the blockchain and do not modify state (i.e. get the current balance of an account, get a user's NFTs, etc).

You can import any of your own contracts or installed dependencies in your script file using the `import` keyword.  For example:

```cadence
import "Counter"
```

### Creating a New Transaction

To add a new transaction to your project you can use the following command:

```shell
flow generate transaction
```

This command will create a new transaction file.  Transactions are used to modify the state of the blockchain (i.e purchase an NFT, transfer tokens, etc).

You can import any dependencies as you would in a script file.

### Creating a New Test

To add a new test to your project you can use the following command:

```shell
flow generate test
```

This command will create a new test file.  Tests are used to verify that your contracts, scripts, and transactions are working as expected.

### Installing External Dependencies

If you want to use external contract dependencies (such as NonFungibleToken, FlowToken, FungibleToken, etc.) you can install them using [Flow CLI Dependency Manager](https://developers.flow.com/tools/flow-cli/dependency-manager).

For example, to install the NonFungibleToken contract you can use the following command:

```shell
flow deps add mainnet://1d7e57aa55817448.NonFungibleToken
```

Contracts can be found using [ContractBrowser](https://contractbrowser.com/), but be sure to verify the authenticity before using third-party contracts in your project.

## 🧪 Testing

To verify that your project is working as expected you can run the tests using the following command:

```shell
flow test
```

This command will run all tests with the `_test.cdc` suffix (these can be found in the `cadence/tests` folder). You can add more tests here using the `flow generate test` command (or by creating them manually).

To learn more about testing in Cadence, check out the [Cadence Test Framework Documentation](https://cadence-lang.org/docs/testing-framework).

## 🚀 Deploying Your Project

To deploy your project to the Flow network, you must first have a Flow account and have configured your deployment targets in the `flow.json` configuration file.

You can create a new Flow account using the following command:

```shell
flow accounts create
```

Learn more about setting up deployment targets in the [Flow CLI documentation](https://developers.flow.com/tools/flow-cli/deployment/project-contracts).

### Deploying to the Flow Emulator

To deploy your project to the Flow Emulator, start the emulator using the following command:

```shell
flow emulator --start
```

To deploy your project, run the following command:

```shell
flow project deploy --network=emulator
```

This command will start the Flow Emulator and deploy your project to it. You can now interact with your project using the Flow CLI or alternate [client](https://developers.flow.com/tools/clients).

### Deploying to Flow Testnet

To deploy your project to Flow Testnet you can use the following command:

```shell
flow project deploy --network=testnet
```

This command will deploy your project to Flow Testnet. You can now interact with your project on this network using the Flow CLI or any other Flow client.

### Deploying to Flow Mainnet

To deploy your project to Flow Mainnet you can use the following command:

```shell
flow project deploy --network=mainnet
```

This command will deploy your project to Flow Mainnet. You can now interact with your project using the Flow CLI or alternate [client](https://developers.flow.com/tools/clients).

## 📚 Other Resources

- [Cadence Design Patterns](https://cadence-lang.org/docs/design-patterns)
- [Cadence Anti-Patterns](https://cadence-lang.org/docs/anti-patterns)
- [Flow Core Contracts](https://developers.flow.com/build/core-contracts)

## 🤝 Community
- [Flow Community Forum](https://forum.flow.com/)
- [Flow Discord](https://discord.gg/flow)
- [Flow Twitter](https://x.com/flow_blockchain)
