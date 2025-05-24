// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Potion is ERC1155, Ownable {
    uint256 public constant POTION = 1;

    string public name = "Mutation Potion";
    string public symbol = "POTION";

    constructor() 
        ERC1155("https://chocolate-magnetic-scorpion-427.mypinata.cloud/ipfs/bafkreibbqk2ao555oqlpubsl3scl3ozidut2w6xa6dwxdmhqmb7ijojopm") 
        Ownable(msg.sender) 
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, POTION, amount, "");
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == from || isApprovedForAll(from, msg.sender), "Not authorized");
        _burn(from, POTION, amount);
    }
}
