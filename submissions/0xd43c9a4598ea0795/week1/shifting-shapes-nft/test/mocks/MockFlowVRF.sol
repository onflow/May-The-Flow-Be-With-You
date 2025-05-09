// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// Interface matching the one in ShiftingShapes.sol
interface IFlowVRF {
    function getRandom(bytes32 seed, uint64 blockInterval) external view returns (bytes32 randomValue);
}

contract MockFlowVRF is IFlowVRF {
    bytes32 public nextRandomValue;
    bytes32 public lastSeed;
    uint64 public lastBlockInterval;

    event RandomRequested(bytes32 seed, uint64 blockInterval);

    function getRandom(bytes32 seed, uint64 blockInterval) external view override returns (bytes32 randomValue) {
        // Emit an event to observe calls in tests (view functions can't easily emit events that are caught by `expectEmit`)
        // For testing purposes, we can make this non-view if needed to use expectEmit,
        // or use a public variable to store lastSeed and lastBlockInterval.
        // For now, keeping it view and relying on public variables for inspection.
        // To make it truly testable with expectEmit, we'd change it to non-view and store:
        // lastSeed = seed;
        // lastBlockInterval = blockInterval;
        // emit RandomRequested(seed, blockInterval);
        return nextRandomValue;
    }

    // --- Test Setup Functions ---
    function setNextRandomValue(bytes32 _randomValue) external {
        nextRandomValue = _randomValue;
    }

    // Helper to simulate the event emission for testing if needed by making it non-view
    // This is an alternative to check if getRandom was called with correct params.
    function recordRandomRequest(bytes32 seed, uint64 blockInterval) external returns (bytes32 randomValue) {
        lastSeed = seed;
        lastBlockInterval = blockInterval;
        emit RandomRequested(seed, blockInterval);
        return nextRandomValue;
    }
}