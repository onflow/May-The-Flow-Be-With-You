pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialMint_) ERC20("MyToken", "MyT") {
        _mint(msg.sender, initialMint_);
    }
}
