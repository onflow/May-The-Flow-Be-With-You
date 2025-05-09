# Dynamic NFT: The Shifting Shapes

## Project Overview

The Shifting Shapes NFT project is an ERC721-compliant dynamic Non-Fungible Token (NFT) collection built using Foundry. Each NFT represents a unique geometric shape with a set of randomly assigned initial properties, such as the number of sides, color, size, and pattern.

A key feature of this project is the ability for NFT owners to "nudge" their shapes. This action triggers an on-chain randomness event using Flow EVM's native Verifiable Random Function (VRF), which in turn alters the shape's properties. This mechanism ensures that each NFT's visual representation can evolve over time, making each piece a unique and dynamic digital collectible.

The `tokenURI` function for each NFT generates JSON metadata that includes an on-chain generated Scalable Vector Graphic (SVG) representation of the shape's current attributes, allowing for a truly decentralized and ever-changing visual.

## Technologies Used

*   **Foundry**: For smart contract development, testing, and deployment.
*   **Solidity**: Language version `^0.8.19`.
*   **OpenZeppelin Contracts**: Version `@openzeppelin/contracts@5.0.2` for robust and secure ERC721 implementations and other utilities.
*   **Flow EVM Native VRF**: For on-chain verifiable randomness to determine shape properties.

## Development Journey/Key Tasks

This project has progressed through several key development stages:

1.  **Project Initialization**:
    *   Initialized the Foundry project named `shifting-shapes-nft`.
    *   Installed necessary dependencies, including OpenZeppelin Contracts. (Chainlink was initially considered and installed but later replaced).

2.  **Initial Contract Scaffolding**:
    *   Created the initial file structure for the main contract, [`ShiftingShapes.sol`](shifting-shapes-nft/src/ShiftingShapes.sol:1).
    *   Initial scaffolding for Chainlink VRF components was done but later removed.

3.  **Dependency Resolution & VRF Pivot**:
    *   Addressed and resolved various compilation and import issues.
    *   Made a strategic pivot from the initially planned Chainlink VRF to Flow EVM's native VRF. This involved updating contract dependencies and refactoring the logic for randomness generation.

4.  **Core Contract Implementation ([`ShiftingShapes.sol`](shifting-shapes-nft/src/ShiftingShapes.sol:1))**:
    *   Developed the primary logic for the NFT contract, including:
        *   Minting new shapes with attributes randomized via Flow EVM's native VRF.
        *   A `nudge` function allowing token owners to re-randomize their shape's attributes, again utilizing Flow EVM VRF.
        *   Implementation of the `tokenURI` function to generate JSON metadata, which includes an on-chain SVG image representing the shape's current state.

5.  **Project Cleanup**:
    *   Removed obsolete files and contract code related to the earlier Chainlink VRF implementation to maintain a clean and focused codebase.

6.  **Test Scaffolding (Partial)**:
    *   Initiated the writing of Forge tests to ensure contract correctness and robustness.
    *   Created test files: [`test/ShiftingShapes.t.sol`](shifting-shapes-nft/test/ShiftingShapes.t.sol:1) and a mock contract [`test/mocks/MockFlowVRF.sol`](shifting-shapes-nft/test/mocks/MockFlowVRF.sol:1) for simulating VRF behavior. (Note: This testing phase is ongoing and not yet fully completed).

## Current Status

The core smart contract, [`ShiftingShapes.sol`](shifting-shapes-nft/src/ShiftingShapes.sol:1), is implemented and compiles successfully. The basic project structure, including dependencies and initial test scaffolding, is in place. Further development will focus on completing the test suite and preparing for deployment.

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

For more information on Foundry, visit the official documentation:
[https://book.getfoundry.sh/](https://book.getfoundry.sh/)

## Basic Foundry Usage

### Build

```shell
forge build
```

### Test

```shell
forge test
```

### Format

```shell
forge fmt
```

### Gas Snapshots

```shell
forge snapshot
```

### Anvil (Local Node)

```shell
anvil
```

### Deploy a Script

(Note: Update `script/Counter.s.sol` or create a new script for `ShiftingShapes.sol`)
```shell
forge script script/YourDeploymentScript.s.sol:YourScriptName --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast (Interact with Contracts)

```shell
cast <subcommand>
```

### Help

```shell
forge --help
anvil --help
cast --help
