// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MineSweeper is ERC721URIStorage, Ownable {
    address public constant cadenceArch = 0x0000000000000000000000010000000000000001;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    struct Record {
        address player;
        uint256 timestamp;
        uint256 timeTaken;
        uint8 level;
    }
    Record[] private records;

    constructor() ERC721("MineSweeper", "MS") Ownable(msg.sender) {}

    function getRandomNumber() public view returns (uint64) {
        (bool ok, bytes memory data) = cadenceArch.staticcall(
            abi.encodeWithSignature("revertibleRandom()")
        );
        require(ok, "Failed to fetch a random number through Cadence Arch");
        uint64 output = abi.decode(data, (uint64));
        return output;
    }

    function addRecord(uint256 timeTaken, uint8 level) onlyOwner public {
        uint256 at = block.timestamp;
        records.push(Record({ player: msg.sender, timestamp: at, timeTaken: timeTaken, level: level}));
        emit addRecordEvent(msg.sender, at, timeTaken, level);
    }

    function getRecords() public view returns (Record[] memory) {
        return records;
    }
    function mint(string memory _uri) public {
        uint256 mintIndex = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, mintIndex);
        _setTokenURI(mintIndex, _uri);
    }
    event addRecordEvent(address,uint256,uint256, uint8);
}
