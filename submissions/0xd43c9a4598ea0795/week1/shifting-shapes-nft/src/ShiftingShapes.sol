// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/access/Ownable.sol";
import {Strings} from "@openzeppelin/utils/Strings.sol";
import {Base64} from "@openzeppelin/utils/Base64.sol";

// Flow EVM VRF Interface
interface IFlowVRF {
    function getRandom(bytes32 seed, uint64 blockInterval) external view returns (bytes32 randomValue);
}

contract ShiftingShapes is ERC721, ERC721URIStorage, Ownable {
    // Flow VRF Precompile Address (Ensure this is the correct address for the target Flow EVM environment)
    IFlowVRF public _flowVRF; // Made public for easier inspection if needed, primarily set via _setFlowVRFAddress
    uint64 private constant VRF_BLOCK_INTERVAL = 1; // How many blocks in the future for randomness

    struct ShapeAttributes {
        uint8 sides;    // e.g., 3-12
        string color;   // e.g., "red", "blue", "green"
        uint8 size;     // e.g., 10-50 (represents SVG size factor)
        string pattern; // e.g., "solid", "striped", "dotted"
    }

    mapping(uint256 => ShapeAttributes) internal _tokenAttributes;
    uint256 internal _currentTokenId;

    // For converting random numbers to attributes
    string[] internal _possibleColors;
    string[] internal _possiblePatterns;

    // Events
    event ShapeAttributesSet(uint256 indexed tokenId, ShapeAttributes attributes);

    constructor()
        ERC721("Shifting Shapes", "SHAPE")
        Ownable(msg.sender)
    {
        _flowVRF = IFlowVRF(0x0102030405060708090a0B0c0d0e0f1011121314); // Placeholder, replace with actual in production or set via setter
        _currentTokenId = 0;
        _possibleColors.push("red");
        _possibleColors.push("blue");
        _possibleColors.push("green");
        _possibleColors.push("yellow");
        _possibleColors.push("purple");
        _possibleColors.push("orange");

        _possiblePatterns.push("solid");
        _possiblePatterns.push("striped");
        _possiblePatterns.push("dotted");
        _possiblePatterns.push("checkered");
    }

    // --- Core NFT Logic ---

    function mintShape(address to) public onlyOwner returns (uint256) { // Consider making it payable if there's a fee
        _currentTokenId++;
        uint256 tokenId = _currentTokenId;

        // Generate a seed for Flow VRF
        bytes32 seed = keccak256(abi.encodePacked(block.timestamp, msg.sender, tokenId, "mint"));
        bytes32 randomNumber = _flowVRF.getRandom(seed, VRF_BLOCK_INTERVAL);

        ShapeAttributes memory attributes = _deriveAttributesFromRandom(randomNumber);
        _tokenAttributes[tokenId] = attributes;

        _safeMint(to, tokenId);
        // ERC721URIStorage requires _setTokenURI to be called if you are not overriding tokenURI to directly return data.
        // However, we are overriding tokenURI to generate it on the fly.
        // If you were to store it, you'd call: _setTokenURI(tokenId, _constructTokenURI(tokenId, attributes));

        emit ShapeAttributesSet(tokenId, attributes);
        return tokenId;
    }

    function nudgeShape(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "ShiftingShapes: Not the owner");

        // Generate a seed for Flow VRF
        bytes32 seed = keccak256(abi.encodePacked(block.timestamp, msg.sender, tokenId, "nudge"));
        bytes32 randomNumber = _flowVRF.getRandom(seed, VRF_BLOCK_INTERVAL);

        ShapeAttributes memory newAttributes = _deriveAttributesFromRandom(randomNumber);
        _tokenAttributes[tokenId] = newAttributes;

        // If using ERC721URIStorage and storing URIs, you might need to update it:
        // _setTokenURI(tokenId, _constructTokenURI(tokenId, newAttributes));
        // However, our tokenURI generates on the fly, so an event is sufficient to signal change.

        emit ShapeAttributesSet(tokenId, newAttributes);
    }

    // --- URI Logic ---

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        ownerOf(tokenId); // Reverts if token doesn't exist, serving as the existence check.

        ShapeAttributes memory attributes = _tokenAttributes[tokenId];

        string memory svgImage = _generateSVG(attributes);
        string memory imageField = string(abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svgImage))));

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Shifting Shape #', Strings.toString(tokenId), '", ',
                        '"description": "A dynamic NFT that changes its shape.", ',
                        '"image": "', imageField, '", ',
                        '"attributes": [',
                        '{"trait_type": "Sides", "value": ', Strings.toString(attributes.sides), '}, ',
                        '{"trait_type": "Color", "value": "', attributes.color, '"}, ',
                        '{"trait_type": "Size", "value": ', Strings.toString(attributes.size), '}, ',
                        '{"trait_type": "Pattern", "value": "', attributes.pattern, '"}',
                        ']}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // --- Internal Helper Functions ---

    function _deriveAttributesFromRandom(bytes32 randomNumber) internal view returns (ShapeAttributes memory) {
        uint256 randomUint = uint256(randomNumber);

        uint8 sides = uint8((randomUint % 10) + 3); // 3-12 sides
        string memory color = _possibleColors[randomUint % _possibleColors.length];
        uint8 size = uint8((randomUint >> 8) % 41) + 10; // 10-50 size (using different bits)
        string memory pattern = _possiblePatterns[randomUint % _possiblePatterns.length]; // Can use more bits for pattern

        return ShapeAttributes(sides, color, size, pattern);
    }

    function _generateSVG(ShapeAttributes memory attributes) internal pure virtual returns (string memory) {
        // Simple SVG: a polygon. More complex SVGs can be generated.
        // For a polygon, we need to generate points.
        // Example: a regular polygon.
        // This is a simplified representation. A proper polygon requires calculating vertex coordinates.
        // For simplicity, let's just use a rectangle whose color and size changes.
        // A more accurate polygon generation would be complex in Solidity.

        string memory svgHeader = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">';
        string memory svgFooter = '</svg>';
        string memory shapeElement;

        // Simplified: draw a rectangle with given color and size as dimensions
        // A real polygon with 'sides' would be more complex to generate points for in Solidity.
        // Let's use 'sides' to influence the shape type or a property for now.
        if (attributes.sides < 5) { // e.g. rectangle
             shapeElement = string(abi.encodePacked(
                '<rect x="10" y="10" width="', Strings.toString(uint256(attributes.size) * 2), // Scale size
                '" height="', Strings.toString(uint256(attributes.size) * 2),
                '" fill="', attributes.color,
                '" />' // Removed stroke for simplicity with pattern
            ));
        } else { // e.g. circle for higher sides
            shapeElement = string(abi.encodePacked(
                '<circle cx="100" cy="100" r="', Strings.toString(attributes.size),
                '" fill="', attributes.color,
                '" />'
            ));
        }

        // Pattern could be represented by fill patterns or other SVG elements,
        // for simplicity, we are not fully implementing visual patterns here.
        // It's more of a metadata trait.

        return string(abi.encodePacked(svgHeader, shapeElement, svgFooter));
    }

    // --- Test Setup Helper ---

    /**
     * @dev Allows setting a custom Flow VRF address, intended for testing with mocks.
     * This function is internal and should only be callable by inheriting test contracts.
     */
    function _setFlowVRFAddress(address newVRFAddress) internal {
        _flowVRF = IFlowVRF(newVRFAddress);
    }

    // Required by ERC721URIStorage if we were to use its _setTokenURI and not override tokenURI.
    // Since we override tokenURI to generate on-the-fly, this specific override might not be strictly
    // necessary for functionality if _setTokenURI is never called. However, to be compliant with
    // the extension's interface if it were used elsewhere, it's good to have.
    // If _setTokenURI is *never* called, this can be removed.
    // Given our current implementation of tokenURI, we don't call _setTokenURI.
    // function _setTokenURI(uint256 tokenId, string memory _uri)
    //     internal
    //     override(ERC721URIStorage)
    // {
    //     super._setTokenURI(tokenId, _uri);
    // }

    // The following functions are overrides required by Solidity.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // --- Ownable Overrides (if any needed) ---
    // (No specific overrides needed for Ownable beyond constructor initialization)
}