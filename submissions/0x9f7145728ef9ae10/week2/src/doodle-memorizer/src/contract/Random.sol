// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Random {
    // Cadence Arch precompile address on Flow EVM
    address constant public cadenceArch = 0x0000000000000000000000010000000000000001;

    // Store the latest random number in a state variable
    uint8 public latestRandomNumber;

    // Event to emit the random number generation action
    event RandomNumberGenerated(uint8 randomNumber);

    // Function to get and store a random number between 5 and 15
    function generateRandom() public returns (uint8) {
        // Call Cadence Arch's revertibleRandom function
        (bool ok, bytes memory data) = cadenceArch.staticcall(abi.encodeWithSignature("revertibleRandom()"));
        require(ok, "Random number fetch failed");

        uint64 random = abi.decode(data, (uint64));
        
        // Map the random number to the range 5 to 15
        uint8 randomNumber = 5 + uint8(random % 11); // Generates a number between 5 and 15

        // Store the random number in the contract's state
        latestRandomNumber = randomNumber;

        // Emit an event with the new random number
        emit RandomNumberGenerated(randomNumber);

        // Return the random number
        return randomNumber;
    }
}

