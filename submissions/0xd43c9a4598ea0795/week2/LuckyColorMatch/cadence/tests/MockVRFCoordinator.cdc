/// @title Mock VRF Coordinator Contract (Test Utility)
/// @author Rooroo Documenter
/// @notice This contract provides a mock implementation of a Verifiable Random Function (VRF)
/// Coordinator. It is designed for testing environments to simulate the process of requesting
/// and fulfilling randomness for contracts like `LuckyColorMatch` without relying on a live
/// VRF service. It allows test scripts to control the randomness fulfillment process.
import LuckyColorMatch from "../contracts/LuckyColorMatch.cdc"
/// Imports the `LuckyColorMatch` contract to understand its interfaces or for type references if needed,
/// though direct interaction for fulfillment is typically orchestrated by test scripts.

// MockVRFCoordinator
// This contract simulates the behavior of a VRF Coordinator for testing purposes.
// It allows tests to trigger randomness fulfillment for the LuckyColorMatch contract.
/// The main contract definition for the MockVRFCoordinator.
pub contract MockVRFCoordinator {

    // Interface that LuckyColorMatch expects the VRF Coordinator to implement
    // This must match the IVRFCoordinator interface definition that LuckyColorMatch imports.
    // For this mock, we'll assume LuckyColorMatch.IVRFCoordinator is the correct one.
    // If LuckyColorMatch.cdc defines its own IVRFCoordinator, that should be used.
    // Based on LuckyColorMatch.cdc, it imports `IVRFCoordinator from 0xVRFCOORDINATOR`.
    // We will define a compatible interface here.
    /// @title CoordinatorPublic Interface
    /// @notice Defines the public interface that a VRF coordinator is expected to expose.
    /// This mock interface should be compatible with the `IVRFCoordinator` interface
    /// that `LuckyColorMatch` expects to interact with for requesting randomness.
    ///
    /// Functions:
    /// - `requestRandomness`: Simulates a request for randomness.
    pub resource interface CoordinatorPublic {
        /// Simulates a request for a random number.
        /// In a real VRF system, this would initiate an off-chain process.
        /// Here, it records the request and returns a unique request ID.
        ///
        /// Parameters:
        /// - keyHash: A `String` representing the key hash for the VRF configuration (unused in mock, present for interface compatibility).
        /// - fee: A `UFix64` value representing the fee paid for the randomness request (unused in mock).
        /// - seed: A `UInt64` seed value provided by the requester, which might influence the randomness generation.
        ///
        /// Returns: `UInt64` - A unique request ID for this randomness request.
        pub fun requestRandomness(keyHash: String, fee: UFix64, seed: UInt64): UInt64
    }

    /// @title Coordinator Resource
    /// @notice Implements the `CoordinatorPublic` interface and manages randomness requests.
    /// This resource is stored in the contract deployer's account and is accessible
    /// via a public capability.
    pub resource Coordinator: CoordinatorPublic {
        /// Counter to generate unique request IDs for randomness requests.
        access(self) var nextRequestID: UInt64
        /// A dictionary mapping request IDs (`UInt64`) to their corresponding seeds (`UInt64`).
        /// Used by tests to retrieve seeds if needed for deterministic randomness generation.
        access(self) var requests: {UInt64: UInt64} // Maps requestID to seed

        /// Initializes the `Coordinator` resource, setting the initial request ID counter.
        init() {
            self.nextRequestID = 1 // Start request IDs from 1
            self.requests = {}
        }

        pub fun requestRandomness(keyHash: String, fee: UFix64, seed: UInt64): UInt64 {
            let requestID = self.nextRequestID
            self.requests[requestID] = seed
            self.nextRequestID = self.nextRequestID + 1
            // In a real test scenario, we might emit an event or log this.
            log("MockVRFCoordinator: New randomness request. ID: ".concat(requestID.toString()).concat(", Seed: ").concat(seed.toString()))
            return requestID
        }

        // Helper function for tests to retrieve a seed for a given request ID
        /// Retrieves the seed associated with a given randomness request ID.
        /// This is a helper function primarily for test scripts to inspect or use the seed.
        ///
        /// Parameters:
        /// - requestID: The `UInt64` ID of the randomness request.
        ///
        /// Returns: `UInt64?` - The seed associated with the request ID, or `nil` if the request ID is not found.
        pub fun getSeedForRequest(requestID: UInt64): UInt64? {
            return self.requests[requestID]
        }
    }

    // Path where the Coordinator resource will be stored
    /// The storage path where the `Coordinator` resource instance is saved in the deployer's account.
    pub let CoordinatorStoragePath: StoragePath
    // Path where the public capability to the Coordinator will be linked
    /// The public path where the capability to the `Coordinator` resource is linked, allowing other accounts/contracts to interact with it.
    pub let CoordinatorPublicPath: PublicPath

    /// Initializes the `MockVRFCoordinator` contract when it's deployed.
    /// It creates an instance of the `Coordinator` resource, saves it to the contract deployer's account storage,
    /// and links a public capability to it.
    init() {
        self.CoordinatorStoragePath = /storage/mockVRFCoordinator
        self.CoordinatorPublicPath = /public/mockVRFCoordinator

        // Save the Coordinator resource to the contract deployer's account
        self.account.save(<- create Coordinator(), to: self.CoordinatorStoragePath)

        // Create a public capability for the Coordinator resource
        self.account.link<&MockVRFCoordinator.Coordinator{CoordinatorPublic}>(
            self.CoordinatorPublicPath,
            target: self.CoordinatorStoragePath
        ) ?? panic("Failed to link MockVRFCoordinator public capability")

        log("MockVRFCoordinator deployed and initialized.")
    }

    /// @title Fulfill Randomness (Simulated Callback)
    /// @notice This function is intended to simulate the action of a VRF Coordinator fulfilling a randomness request
    /// by calling back to the requesting contract (e.g., `LuckyColorMatch`).
    /// In a real testing scenario, the test script itself would typically invoke the
    /// `rawFulfillRandomness` function on the `LuckyColorMatch` contract directly,
    /// using an account with the necessary permissions (e.g., the game admin or the account
    /// designated as the VRF coordinator in `LuckyColorMatch`'s configuration).
    /// This function logs the intent to fulfill but does not perform the actual callback.
    ///
    /// Parameters:
    /// - luckyColorMatchContractAddress: The `Address` of the `LuckyColorMatch` contract that requested randomness.
    /// - requestID: The `UInt64` ID of the randomness request to fulfill.
    /// - randomness: The `UInt64` pseudo-random value to provide as fulfillment.
    // Function to allow an authorized account (e.g., game admin in tests)
    // to fulfill randomness for the LuckyColorMatch contract.
    // This simulates the VRF callback.
    pub fun fulfillRandomness(
        luckyColorMatchContractAddress: Address,
        requestID: UInt64,
        randomness: UInt64
    ) {
        // Get the LuckyColorMatch contract account
        let gameContract = getAccount(luckyColorMatchContractAddress)

        // Borrow a reference to the LuckyColorMatch contract
        // Note: This requires LuckyColorMatch to expose a way to be called,
        // or this function needs to be callable by an account that LuckyColorMatch trusts.
        // The `rawFulfillRandomness` function in LuckyColorMatch is public,
        // but its security relies on the caller being the actual VRF coordinator.
        // In a test, the admin account deploying LuckyColorMatch might call this.

        // A more direct way for testing is to have the test script itself
        // call rawFulfillRandomness on LuckyColorMatch using an admin capability
        // or directly if the function signature allows (e.g. if it's public and doesn't check signer strictly in test mode).

        // For this mock, we'll assume the test will orchestrate the call to rawFulfillRandomness.
        // This function primarily serves to show how a coordinator *would* call back.
        log("MockVRFCoordinator: Simulating fulfillment for request ID ".concat(requestID.toString()).concat(" with randomness ").concat(randomness.toString()))

        // The actual call to LuckyColorMatch.rawFulfillRandomness will be done
        // in the test script using an account that has the authority.
    }
}