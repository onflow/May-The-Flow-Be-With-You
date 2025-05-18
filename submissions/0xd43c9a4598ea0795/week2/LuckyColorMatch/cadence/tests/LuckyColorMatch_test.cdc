/// @title LuckyColorMatch Test Suite
/// @author Rooroo Documenter (with original structure by project developers)
/// @notice This file contains a suite of tests for the LuckyColorMatch smart contract and its associated
/// contracts (LuckyCharmNFT, AchievementBadgeNFT). It utilizes a TestFramework (presumably the Flow Emulator Test Framework)
/// to deploy contracts, execute transactions and scripts, and assert expected outcomes.
/// The tests cover various functionalities including contract deployment, game round management,
/// player interactions, and eventually, prize calculations and distributions.
/// It uses a MockVRFCoordinator to simulate randomness generation for testing purposes.
import TestFramework
/// Imports the TestFramework, which provides utilities for writing and running Cadence tests.

// Standard Contract Imports - Using placeholder addresses that should be aliased or replaced by TestFramework
import FungibleToken from "0xFUNFUNGIBLETOKENADDRESS"
import NonFungibleToken from "0xNONFUNGIBLETOKENADDRESS"
import MetadataViews from "0xMETADATAVIEWSADDRESS"

// Project Contract Imports
import LuckyColorMatch from "../contracts/LuckyColorMatch.cdc"
import LuckyCharmNFT from "../contracts/LuckyCharmNFT.cdc"
import AchievementBadgeNFT from "../contracts/AchievementBadgeNFT.cdc"
import MockVRFCoordinator from "./MockVRFCoordinator.cdc" // Our Mock VRF

// --- Test Constants ---
/// This section defines various constants used throughout the test suite, including
/// addresses for deployed contracts and participating accounts, default game parameters,
/// and other configuration values. These are typically resolved or provided by the TestFramework.
// --- Test Constants ---
/// Address for the standard FungibleToken contract, resolved by TestFramework.
pub let FungibleTokenAddress = TestFramework.getAccountAddress("FungibleToken")
/// Address for the standard NonFungibleToken contract, resolved by TestFramework.
pub let NonFungibleTokenAddress = TestFramework.getAccountAddress("NonFungibleToken")
/// Address for the standard MetadataViews contract, resolved by TestFramework.
pub let MetadataViewsAddress = TestFramework.getAccountAddress("MetadataViews")
/// Address for the deployed LuckyColorMatch contract, resolved by TestFramework.
pub let LuckyColorMatchAddress = TestFramework.getAccountAddress("LuckyColorMatch")
/// Address for the deployed LuckyCharmNFT contract, resolved by TestFramework.
pub let LuckyCharmNFTAddress = TestFramework.getAccountAddress("LuckyCharmNFT")
/// Address for the deployed AchievementBadgeNFT contract, resolved by TestFramework.
pub let AchievementBadgeNFTAddress = TestFramework.getAccountAddress("AchievementBadgeNFT")
/// Address for the deployed MockVRFCoordinator contract, resolved by TestFramework.
pub let MockVRFCoordinatorAddress = TestFramework.getAccountAddress("MockVRFCoordinator")

/// Address for the account designated as the Game Administrator.
pub let GameAdmin = TestFramework.getAccountAddress("GameAdmin")
/// Address for the account designated as Player 1.
pub let Player1 = TestFramework.getAccountAddress("Player1")
/// Address for the account designated as Player 2.
pub let Player2 = TestFramework.getAccountAddress("Player2")
/// Address for the account designated as Player 3.
pub let Player3 = TestFramework.getAccountAddress("Player3")

// Default entry fee for the game
/// Default entry fee (e.g., 10.0 FLOW) for participating in a game round.
pub let DefaultEntryFee: UFix64 = 10.0
/// Example fee for requesting randomness from the VRF coordinator.
pub let DefaultVRFFee: UFix64 = 0.1 // Example VRF fee
/// Example key hash for the VRF service configuration.
pub let DefaultVRFKeyHash = "keyhash-example-0123456789abcdef"
/// Default set of available colors for players to choose from in the game.
pub let DefaultAvailableColors = ["Red", "Green", "Blue", "Yellow", "Purple", "Orange"]

// --- Test Setup Functions ---
/// This section contains helper functions responsible for setting up the necessary
/// environment for each test case, such as deploying contracts and initializing player accounts.
// --- Test Setup Functions ---

/// Deploys all smart contracts required for the LuckyColorMatch game tests.
/// This includes the mock VRF coordinator, NFT contracts, and the main game contract itself.
/// It relies on `TestFramework.deployContract` for deployment and assumes paths to contract files
/// are correct relative to the test file's location or as configured in `flow.json`.
/// Standard Flow contracts (FungibleToken, NonFungibleToken, MetadataViews) are assumed to be
/// available or handled by the TestFramework/emulator environment.
// Deploys all necessary contracts for testing.
pub fun setupContracts() {
    // Deploy FungibleToken (TestFramework might handle this if standard addresses are used,
    // or it might need a path if deploying locally for tests)
    // Assuming flow.json maps 0xFUNFUNGIBLETOKENADDRESS to a local path or emulator default.
    // If not, these deployments would be needed with correct paths.
    // For now, we assume TestFramework or flow.json handles resolution of standard contracts.
    // If explicit deployment is needed:
    // TestFramework.deployContract(
    //     name: "FungibleToken",
    //     path: "../../../cadence/contracts/FungibleToken.cdc", // Example path, adjust
    //     arguments: []
    // )
    // TestFramework.deployContract(
    //     name: "NonFungibleToken",
    //     path: "../../../cadence/contracts/NonFungibleToken.cdc", // Example path, adjust
    //     arguments: []
    // )
    // TestFramework.deployContract(
    //     name: "MetadataViews",
    //     path: "../../../cadence/contracts/MetadataViews.cdc", // Example path, adjust
    //     arguments: []
    // )

    // Deploy MockVRFCoordinator first as LuckyColorMatch depends on its address
    TestFramework.deployContract(
        name: "MockVRFCoordinator",
        path: "./MockVRFCoordinator.cdc",
        arguments: []
    )

    // Deploy LuckyCharmNFT
    TestFramework.deployContract(
        name: "LuckyCharmNFT",
        path: "../contracts/LuckyCharmNFT.cdc",
        arguments: []
    )

    // Deploy AchievementBadgeNFT
    TestFramework.deployContract(
        name: "AchievementBadgeNFT",
        path: "../contracts/AchievementBadgeNFT.cdc",
        arguments: []
    )

    // Deploy LuckyColorMatch
    // Arguments for LuckyColorMatch:
    // entryFeeAmount: UFix64,
    // vrfCoordinatorAddress: Address,
    // vrfCoordinatorCapPath: PublicPath, (This will be MockVRFCoordinator.CoordinatorPublicPath)
    // vrfKeyHash: String,
    // vrfFee: UFix64,
    // availableColors: [String],
    // luckyCharmNFTCollectionPublicPath: PublicPath, (LuckyCharmNFT.CollectionPublicPath)
    // achievementBadgeNFTCollectionPublicPath: PublicPath (AchievementBadgeNFT.CollectionPublicPath)
    // achievementBadgeMinterStoragePath: StoragePath (Path to AchievementBadgeNFT minter resource)
    TestFramework.deployContract(
        name: "LuckyColorMatch",
        path: "../contracts/LuckyColorMatch.cdc",
        arguments: [
            DefaultEntryFee,
            MockVRFCoordinatorAddress,
            MockVRFCoordinator.CoordinatorPublicPath, // from MockVRFCoordinator contract
            DefaultVRFKeyHash,
            DefaultVRFFee,
            DefaultAvailableColors,
            LuckyCharmNFT.CollectionPublicPath, // from LuckyCharmNFT contract
            AchievementBadgeNFT.CollectionPublicPath, // from AchievementBadgeNFT contract
            AchievementBadgeNFT.MinterStoragePath // Assuming this path is defined in AchievementBadgeNFT for admin minting
        ]
    )
    log("All contracts deployed successfully.")
}

/// Sets up a player account by executing necessary transactions.
/// This typically involves creating a FungibleToken vault for payments, and setting up
/// storage for LuckyCharmNFT and AchievementBadgeNFT collections.
/// It also mints an initial amount of FungibleTokens to the player's account for covering entry fees.
///
/// Parameters:
/// - playerAddress: The `Address` of the player account to set up.
// Sets up a player account with a FungibleToken vault and NFT collections.
pub fun setupPlayerAccount(playerAddress: Address) {
    TestFramework.executeTransaction(
        name: "setup_account",
        path: "../transactions/utility/setup_account.cdc", // This transaction needs to be created
        signers: [playerAddress],
        arguments: [
            LuckyCharmNFT.CollectionPublicPath,
            LuckyCharmNFT.CollectionStoragePath,
            LuckyCharmNFT.CollectionProviderPath,
            AchievementBadgeNFT.CollectionPublicPath,
            AchievementBadgeNFT.CollectionStoragePath,
            AchievementBadgeNFT.CollectionProviderPath
        ]
    )

    // Mint some FungibleToken to the player for entry fees
    // This transaction needs to exist at the specified path or be a standard one.
    // Assuming a generic minting transaction for FungibleToken.
    // The signer should be an account with minting rights for FT (often the service account/emulator admin).
    TestFramework.executeTransaction(
        name: "mint_tokens_for_player", // More descriptive name
        path: "../transactions/utility/mint_fungible_tokens.cdc", // This transaction needs to be created
        signers: [GameAdmin], // Assuming GameAdmin or service account can mint FT in test env
        arguments: [playerAddress, 1000.0] // Mint 1000.0 tokens
    )
    log("Account setup for ".concat(playerAddress.toString()))
}

// --- Test Cases ---
/// This section contains individual test functions, each designed to verify a specific
/// aspect or feature of the LuckyColorMatch game.
// --- Test Cases ---

/// @title Test Contract Deployment and Initialization
/// @notice Verifies that all contracts, especially `LuckyColorMatch`, are deployed successfully
/// and that their initial state variables are set as expected (e.g., entry fee, admin, next round ID).
// Test 1: Contract Deployment and Initialization
pub fun testContractDeployment() {
    setupContracts() // This will panic if deployment fails

    // Check if LuckyColorMatch is initialized correctly
    let result = TestFramework.executeScript(
        name: "get_game_details",
        path: "../scripts/admin/get_game_details.cdc", // Needs to be created
        arguments: []
    )
    assert(result.status == TestFramework.ScriptStatus.succeeded, message: "Failed to get game details.")
    let gameDetails = result.returnValue! as! {String: AnyStruct}

    assertEqual(gameDetails["nextRoundID"] as! UInt64, 1, "Initial nextRoundID should be 1.")
    assertEqual(gameDetails["entryFeeAmount"] as! UFix64, DefaultEntryFee, "Initial entryFeeAmount is incorrect.")
    assertEqual(gameDetails["gameAdmin"] as! Address, GameAdmin, "GameAdmin not set correctly.") // Assuming GameAdmin deploys LuckyColorMatch
    assertEqual(gameDetails["vrfCoordinatorAddress"] as! Address, MockVRFCoordinatorAddress, "VRF Coordinator address incorrect.")

    log("testContractDeployment PASSED")
}

/// @title Test Admin Starts a New Round
/// @notice Verifies that the Game Administrator can successfully start a new game round.
/// It checks if the transaction to start a round executes without errors and that the
/// round status is correctly updated to 'Active' with the expected round ID.
// Test 2: Admin Starts a New Round
pub fun testAdminStartNewRound() {
    setupContracts()
    setupPlayerAccount(playerAddress: GameAdmin) // GameAdmin needs FT if any actions cost gas

    // Admin starts a new round
    let txResult = TestFramework.executeTransaction(
        name: "admin_start_new_round",
        path: "../transactions/admin/admin_start_new_round.cdc",
        signers: [GameAdmin],
        arguments: []
    )
    assert(txResult.status == TestFramework.TransactionStatus.sealed, message: "Admin failed to start new round. Error: ".concat(txResult.errorMessage))

    // Verify round status
    let scriptResult = TestFramework.executeScript(
        name: "get_current_round_status",
        path: "../scripts/player/get_current_round_status.cdc",
        arguments: []
    )
    assert(scriptResult.status == TestFramework.ScriptStatus.succeeded, message: "Failed to get current round status.")
    let roundStatus = scriptResult.returnValue! as! {String: AnyStruct}

    assertEqual(roundStatus["roundID"] as! UInt64, 1, "Round ID should be 1.")
    assertEqual(roundStatus["status"] as! String, "Active", "Round status should be Active.") // Assuming enum to string conversion

    log("testAdminStartNewRound PASSED")
}

/// @title Test Player Submits Colors Successfully
/// @notice Verifies that a player can successfully submit their chosen color combination for an active round.
/// This test involves starting a round, then having a player execute the `submit_colors` transaction.
/// It asserts that the transaction completes and that the player's submission details (chosen colors, fee paid)
/// are correctly recorded in the contract's state.
/// Note: This test makes assumptions about how the `submit_colors.cdc` transaction handles fee payment,
/// specifically that it correctly prepares and passes the FungibleToken vault.
// Test 3: Player Submits Colors Successfully
pub fun testPlayerSubmitColors() {
    setupContracts()
    setupPlayerAccount(playerAddress: GameAdmin)
    setupPlayerAccount(playerAddress: Player1)

    // Admin starts a round
    TestFramework.executeTransaction(
        name: "admin_start_new_round",
        path: "../transactions/admin/admin_start_new_round.cdc",
        signers: [GameAdmin],
        arguments: []
    )

    let chosenColors = ["Red", "Green", "Blue"]
    let feeToPay = DefaultEntryFee

    // Player1 submits colors
    let txResult = TestFramework.executeTransaction(
        name: "submit_colors",
        path: "../transactions/player/submit_colors.cdc",
        signers: [Player1],
        arguments: [
            chosenColors,
            feeToPay, // This argument in the actual transaction should be the vault being sent
            nil      // luckyCharmID (optional)
        ]
    )
    // Note: The actual submit_colors.cdc transaction will need to handle vault withdrawal.
    // The test framework might need a way to prepare the vault argument.
    // For now, assuming the transaction is structured to accept fee amount and handles vault internally.
    // A better approach for the transaction is to take `@FungibleToken.Vault` as an argument.
    // The test framework would then prepare this vault.

    // This test will likely need adjustment based on how `submit_colors.cdc` handles the fee payment.
    // If it takes a vault, the test framework needs to provide it.
    // If it takes an amount and withdraws from signer's default vault, that's different.
    // The current LuckyColorMatch.submitColors takes `@FungibleToken.Vault`.
    // The test transaction `submit_colors.cdc` needs to be written to prepare and pass this vault.

    // For now, we'll assume the transaction `submit_colors.cdc` is correctly set up
    // to withdraw `feeToPay` from Player1's account and pass it as a vault.
    // The test framework's `executeTransaction` might need enhancement or specific transaction structure.

    assert(txResult.status == TestFramework.TransactionStatus.sealed, message: "Player1 failed to submit colors. Error: ".concat(txResult.errorMessage))

    // Verify player submission
    let scriptResult = TestFramework.executeScript(
        name: "get_player_round_details",
        path: "../scripts/player/get_player_round_details.cdc",
        arguments: [1, Player1] // roundID, playerAddress
    )
    assert(scriptResult.status == TestFramework.ScriptStatus.succeeded, message: "Failed to get player round details.")
    let playerDetails = scriptResult.returnValue! as! {String: AnyStruct}?
    assert(playerDetails != nil, message: "Player details not found for round.")
    assertEqual(playerDetails!["chosenCombination"] as! [String], chosenColors, "Chosen colors do not match.")
    assertEqual(playerDetails!["entryFeePaid"] as! UFix64, feeToPay, "Entry fee paid does not match.")

    log("testPlayerSubmitColors PASSED (with assumptions on fee payment in tx)")
}


/// Placeholder for future test cases. This section outlines various scenarios that should be tested
/// to ensure comprehensive coverage of the LuckyColorMatch game's functionality, including error handling,
/// different game states, prize calculations, NFT interactions, and the full game lifecycle.
// TODO: Add more tests:
// - testPlayerSubmitColors_InsufficientFee
// - testPlayerSubmitColors_RoundNotActive
// - testPlayerSubmitColors_AlreadySubmitted
// - testAdminCloseRound_And_VRFRequest
// - testFulfillRandomness_And_RevealCombination (Requires calling MockVRF and then LuckyColorMatch.rawFulfillRandomness)
// - testPrizeCalculation_SpecialWinner
// - testPrizeCalculation_FirstPrizeWinner
// - testPrizeCalculation_SecondPrizeWinner
// - testPrizeCalculation_MultipleWinnersPerTier
// - testPrizeCalculation_NoWinners
// - testPrizeDistribution
// - testTreasuryCut
// - testLuckyCharm_FeeDiscount
// - testLuckyCharm_PrizeBonus
// - testAchievementBadge_Awarding
// - testFullGameLifecycle

// --- Test Execution ---
/// This section contains the main entry point for running the test suite.
// --- Test Execution ---
/// The main function that orchestrates the execution of all defined test cases.
/// It calls `TestFramework.runTests` with a list of test functions to be executed.
/// Add new test functions to the array passed to `runTests` to include them in the suite.
pub fun main() {
    TestFramework.runTests([
        testContractDeployment,
        testAdminStartNewRound,
        testPlayerSubmitColors
        // Add other test functions here as they are implemented
    ])
}