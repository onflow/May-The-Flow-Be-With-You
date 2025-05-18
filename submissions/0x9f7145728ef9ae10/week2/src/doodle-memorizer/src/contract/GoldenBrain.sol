// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GoldenBrain is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    string private constant BASE_URI = "ipfs://bafybeialy4kfxol273d7yyrdknfktcc7vxyeig5do6ozkzpbc5titticla/";

    constructor() ERC721("Golden Brain", "BRAIN") Ownable(msg.sender) {}

    function mint(address to) external onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newItemId = _tokenIds;

        _mint(to, newItemId);
        _setTokenURI(newItemId, BASE_URI);

        return newItemId;
    }

    function totalMinted() external view returns (uint256) {
        return _tokenIds;
    }
}

