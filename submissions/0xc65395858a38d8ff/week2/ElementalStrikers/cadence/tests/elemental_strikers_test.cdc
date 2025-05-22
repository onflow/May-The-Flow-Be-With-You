import Test
import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import ElementalStrikers from "ElementalStrikers"

// Test Suite for ElementalStrikers Contract

// Emulator addresses (can be overridden in flow.json for test environment)
access(all) let FungibleTokenAddress: Address = 0xee82856bf20e2aa6
access(all) let FlowTokenAddress: Address = 0x0ae53cb6e3f42a79
access(all) let ElementalStrikersAdmin: Address = Test.getAccount(0x01cf0e2f2f715450) // Using address from flow.json

// Helper to deploy the ElementalStrikers contract
access(all) fun deployContract(): Address {
    let address = Test.deployContract(
        name: "ElementalStrikers",
        path: "week1/ElementalStrikers/cadence/contracts/ElementalStrikers.cdc",
        arguments: []
    )
    return address
}

// Helper to setup a player account with a PlayerAgent and a FlowToken Vault
access(all) fun setupPlayerAccount(account: Test.Account) {
    // Fund account first (optional, if transactions require fees even in emulator tests)
    // Test.mintFlow(to: account.address, amount: 10.0)

    // Setup FlowToken Vault if it doesn't exist (critical for staking)
    let vaultPath = /storage/flowTokenVault
    if account.storage.type(at: vaultPath) == nil {
        let setupTx = Test.Transaction(
            code: "import FungibleToken from \"FungibleToken\"\nimport FlowToken from \"FlowToken\"\ntransaction {\n    prepare(signer: &Account) {\n        if signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault) == nil {\n            signer.storage.save(<-FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>()), to: /storage/flowTokenVault)\n            signer.capabilities.unpublish(/public/flowTokenReceiver)\n            signer.capabilities.publish(\n                signer.capabilities.storage.issue<&FlowToken.Vault{FungibleToken.Receiver}>(\n                    /storage/flowTokenVault\n                ),\n                at: /public/flowTokenReceiver\n            )\n            signer.capabilities.unpublish(/public/flowTokenBalance)\n            signer.capabilities.publish(\n                signer.capabilities.storage.issue<&FlowToken.Vault{FungibleToken.Balance}>(\n                    /storage/flowTokenVault\n                ),\n                at: /public/flowTokenBalance\n            )\n        }\n    }\n}",
            signers: [account],
            imports: {
                "FungibleToken": FungibleTokenAddress,
                "FlowToken": FlowTokenAddress
            }
        )
        let result = Test.executeTransaction(tx: setupTx)
        if result.error != nil {
            panic("Failed to setup FlowToken vault: ".concat(result.error!.message))
        }
    }

    // Get the deployed address of ElementalStrikers for the import within the transaction code
    // This assumes deployContract() or a deployment in flow.json has made "ElementalStrikers" alias available
    let elementalStrikersContractAddress = Test.getDeployedAddress(name: "ElementalStrikers") 
        ?? panic("ElementalStrikers contract not deployed or alias 'ElementalStrikers' not found for test. Ensure it's deployed before setup.")

    let tx = Test.Transaction(
        code: "import ElementalStrikers from \"ElementalStrikers\"\ntransaction {\n    prepare(signer: &Account) {\n        if signer.storage.type(at: ElementalStrikers.PlayerVaultStoragePath) == nil {\n            signer.storage.save(<-ElementalStrikers.createPlayerAgent(), to: ElementalStrikers.PlayerVaultStoragePath)\n            signer.capabilities.unpublish(ElementalStrikers.GamePlayerPublicPath)\n            signer.capabilities.publish(\n                signer.capabilities.storage.issue<&ElementalStrikers.PlayerAgent{ElementalStrikers.GamePlayer}>(\n                    ElementalStrikers.PlayerVaultStoragePath\n                ),\n                at: ElementalStrikers.GamePlayerPublicPath\n            )\n        }\n    }\n}",
        signers: [account],
        imports: {
            "ElementalStrikers": elementalStrikersContractAddress
        }
    )
    let result = Test.executeTransaction(tx: tx)
    if result.error != nil {
        panic("Failed to setup PlayerAgent: ".concat(result.error!.message))
    }
    Test.log("Player account setup complete for: ".concat(account.address.toString()))
}

// Helper to set the next test random source (callable by admin/deployer)
access(all) fun setNextTestRandomSource(source: UInt64, contractAddress: Address) {
    let code = "import ElementalStrikers from \"ElementalStrikers\"\ntransaction(source: UInt64) {\n    prepare(signer: &Account) {}\n    execute {\n        ElementalStrikers.setNextTestRandomSource(source: source)\n    }\n}"
    let tx = Test.Transaction(
        code: code,
        signers: [Test.getAccount(ElementalStrikersAdmin.toString())],
        arguments: [Test.Argument(source)],
        imports: {
            "ElementalStrikers": contractAddress
        }
    )
    let result = Test.executeTransaction(tx: tx)
    if result.error != nil {
        panic("Failed to set next test random source: ".concat(result.error!.message))
    }
}

// --- Test Cases --- 

// Test contract deployment
access(all) fun testContractDeployment() {
    Test.log("Starting test: Contract Deployment")
    var deployedAddress: Address? = nil
    
    // For a successful deployment, we expect no panic.
    deployedAddress = Test.deployContract(
        name: "ElementalStrikers",
        path: "week1/ElementalStrikers/cadence/contracts/ElementalStrikers.cdc",
        arguments: []
    )
    Test.assertNotNil(deployedAddress, message: "Deployed contract address should not be nil after successful deployment")
    Test.log("Contract deployed to: ".concat(deployedAddress!.toString()))
    Test.log("Contract Deployment Test Passed")
}

// Test player account setup
access(all) fun testPlayerAccountSetup() {
    Test.log("Starting test: Player Account Setup")
    let player1 = Test.createAccount()
    let _ = deployContract() // Deploy contract. Its address is then available via Test.getDeployedAddress("ElementalStrikers")
    // Test.log("ElementalStrikers deployed at: ".concat(contractAddress.toString()).concat(" for player setup test"))

    setupPlayerAccount(account: player1)
    
    let agent = player1.storage.borrow<&ElementalStrikers.PlayerAgent>(from: ElementalStrikers.PlayerVaultStoragePath)
    Test.assertNotNil(agent, message: "PlayerAgent should exist in storage")
    let cap = player1.capabilities.get<&{ElementalStrikers.GamePlayer}>(ElementalStrikers.GamePlayerPublicPath)
    Test.assertNotNil(cap.borrow(), message: "GamePlayer capability should be published and borrowable")

    Test.log("Player Account Setup Test Passed")
}

// Test PvE game creation and immediate commit to randomness
access(all) fun testCreatePracticeGame() {
    Test.log("Starting test: Create Practice Game (PvE)")
    let player1 = Test.createAccount()
    let contractAddress = deployContract()
    // Test.log("ElementalStrikers deployed at: ".concat(contractAddress.toString()).concat(" for PvE test"))
    setupPlayerAccount(account: player1)

    let choice = "Fuego"
    let createGameCode = "import ElementalStrikers from \"ElementalStrikers\"\ntransaction(player1Choice: String) {\n    prepare(signer: &Account) {}\n    execute {\n        let gameId = ElementalStrikers.createPracticeGame(player1Address: signer.address, player1Choice: player1Choice)\n        Test.log(\"Practice game created with ID: \".concat(gameId.toString()))\n    }\n}"
    let createTx = Test.Transaction(
        code: createGameCode,
        signers: [player1],
        arguments: [Test.Argument(choice)],
        imports: {"ElementalStrikers": contractAddress}
    )
    let createResult = Test.executeTransaction(tx: createTx)
    Test.expect(createResult.error == nil, message: createResult.error?.message ?? "Create practice game tx failed")
    
    let getDetailsScriptCode = "import ElementalStrikers from \"ElementalStrikers\"\npub fun main(gameId: UInt64): ElementalStrikers.GameDetails? {\n    return ElementalStrikers.getGamePublicDetails(gameId: gameId)\n}"
    let gameIdToQuery = UInt64(1)
    let gameDetailsResult = Test.executeScript(
        code: getDetailsScriptCode, 
        arguments: [Test.Argument(gameIdToQuery)],
        imports: {"ElementalStrikers": contractAddress}
    )
    Test.expect(gameDetailsResult.error == nil, message: gameDetailsResult.error?.message ?? "Get game details script failed")
    let gameDetails = gameDetailsResult.returnValue! as? ElementalStrikers.GameDetails
    Test.assertNotNil(gameDetails, message: "Game details are nil for gameId: ".concat(gameIdToQuery.toString()))
    Test.assertEqual(ElementalStrikers.GameStatus.awaitingRandomness, gameDetails!.status, message: "Game should be awaiting randomness")
    Test.assertEqual(choice, gameDetails!.player1Move, message: "Player 1 move not set correctly in PvE details")
    Test.log("Create Practice Game Test Passed")
}

// TODO: Add more test cases:
// - testCreatePvPGameAndJoin
// - testPvPMakeMovesAndCommit
// - testRevealOutcome_PvE_PlayerWins
// - testRevealOutcome_PvE_ComputerWins
// - testRevealOutcome_PvE_Draw (Elemental and Environmental)
// - testRevealOutcome_PvP_Player1Wins_Elemental
// - testRevealOutcome_PvP_Player2Wins_Elemental
// - testRevealOutcome_PvP_Draw_Elemental_NoEnvTieBreak (stakes returned)
// - testRevealOutcome_PvP_Draw_Elemental_EnvTieBreak_P1Wins (stakes to P1)
// - testRevealOutcome_PvP_Payouts (verify balances after win/loss)
// - testRevealOutcome_AttemptTooEarly (before commit block passed)
// - testInvalidMoves_States (e.g., join full game, move in wrong state)

// Example of how a reveal test might look (conceptual, needs specific random source)
/*
access(all) fun testRevealOutcome_PvE_PlayerWins_WithFuego() {
    Test.log("Starting test: Reveal PvE - Player Wins (Fuego vs Planta)")
    let player1 = Test.createAccount()
    let contractAddress = deployContract()
    setupPlayerAccount(account: player1)

    // 1. Create PvE Game with Fuego
    let createTx = Test.Transaction(
        code: "import ES from \"../contracts/ElementalStrikers.cdc\"; transaction { prepare(acct: &Account){} execute { ES.createPracticeGame(player1Address: acct.address, player1Choice: \"Fuego\") } }",
        signers: [player1],
        imports: {"ES": contractAddress}
    )
    Test.executeTransaction(tx: createTx)
    let gameId = UInt64(1) // Assuming it's the first game

    // 2. Set Next Random Source: Computer chooses Planta, Env=None, CritP1=None
    // We need a PRNG sequence that results in: computer chooses Planta, env=None, critP1=None
    // For LCG (a=1664525, c=1013904223, m=2^32) with seed `S` and salt `gameId=1`:
    // state0 = S ^ 1
    // envRandom = (state0*a+c)%m  -> e.g., gives "None" (index 0 of 4 options)
    // critP1Random = ( ((state0*a+c)%m) *a+c)%m -> e.g., gives "None" (index 0 of 3 options)
    // compMoveRandom = ( ( ((state0*a+c)%m) *a+c)%m *a+c)%m -> e.g., gives "Planta" (index 2 of 3 options)
    // This requires finding a suitable `S`. Or, for testing, we make setNextTestRandomSource take 3 values.
    // For simplicity now, let's assume we can force the PRNG outputs if the contract was more advanced
    // or we make setNextTestRandomSource take multiple mock values for the PRNG sequence.
    // OR, we just set ONE source, and check one of the possible outcomes.
    setNextTestRandomSource(source: 12345, contractAddress: contractAddress) // This source needs to lead to Computer choosing Planta

    // 3. Advance Blocks (if reveal has block height restriction, though RandomBeaconHistory handles it)
    // Test.advanceTime(10.0) // Advance time by 10s, implies blocks pass
    // Test.mineBlock() // Mine a block to ensure current block height > committed block height

    // 4. Reveal Outcome
    let revealTx = Test.Transaction(
        code: "import ES from \"../contracts/ElementalStrikers.cdc\"; transaction(gid: UInt64) { prepare(acct: &Account){ let agent = acct.storage.borrow<&ES.PlayerAgent>(from: ES.PlayerVaultStoragePath)!; agent.revealOutcome(gameId: gid) } execute {} }",
        signers: [player1],
        arguments: [Test.Argument(gameId)],
        imports: {"ES": contractAddress}
    )
    let revealResult = Test.executeTransaction(tx: revealTx)
    Test.expect(revealResult.error == nil, message: revealResult.error?.message ?? "Reveal tx failed")

    // 5. Verify Result
    let scriptCode = "import ES from \"../contracts/ElementalStrikers.cdc\"; pub fun main(gid: UInt64): ES.GameDetails? { return ES.getGamePublicDetails(gameId: gid) }"
    let detailsResult = Test.executeScript(code: scriptCode, arguments: [Test.Argument(gameId)], imports: {"ES": contractAddress})
    let gameDetails = detailsResult.returnValue! as! ElementalStrikers.GameDetails
    
    Test.assertEqual(ElementalStrikers.GameStatus.resolved, gameDetails.status, message: "Game should be resolved")
    Test.assertEqual(player1.address, gameDetails.winner, message: "Player 1 should be the winner (Fuego vs Planta)")
    Test.assertEqual("Planta", gameDetails.computerMove, message: "Computer should have chosen Planta")
    // Test.assertEqual("None", gameDetails.environmentalModifier, message: "Environment should be None")
    
    Test.log("Reveal PvE - Player Wins (Fuego vs Planta) Test Passed")
}
*/

// Main function to run tests (optional, can run tests individually with CLI)
// access(all) fun main() {
//     testContractDeployment()
//     testPlayerAccountSetup()
//     // ... call other tests
// } 