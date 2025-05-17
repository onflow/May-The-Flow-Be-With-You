// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract RandomInRange {
    address public constant cadenceArch =
        0x0000000000000000000000010000000000000001;

    // Generate a random number between min and max
    function getRandomInRange(
        uint64 min,
        uint64 max
    ) public view returns (uint64) {
        // Static call to the Cadence Arch contract's revertibleRandom function
        (bool ok, bytes memory data) = cadenceArch.staticcall(
            abi.encodeWithSignature("revertibleRandom()")
        );
        require(ok, "Failed to fetch a random number through Cadence Arch");
        uint64 randomNumber = abi.decode(data, (uint64));

        // Return the number in the specified range
        return (randomNumber % (max + 1 - min)) + min;
    }
}
