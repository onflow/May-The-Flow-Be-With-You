// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ShiftingShapes} from "../src/ShiftingShapes.sol";
import {MockFlowVRF} from "./mocks/MockFlowVRF.sol";
import {Strings} from "@openzeppelin/utils/Strings.sol";
import {Base64} from "@openzeppelin/utils/Base64.sol";
import {Ownable} from "@openzeppelin/access/Ownable.sol"; // For OwnableUnauthorizedAccount error
import {ERC721, IERC721Errors} from "@openzeppelin/token/ERC721/ERC721.sol"; // For ERC721NonexistentToken error

// Helper contract to access internal _tokenAttributes for more detailed testing
contract TestableShiftingShapes is ShiftingShapes {
    constructor() ShiftingShapes() {}

    function getTokenAttributes(uint256 tokenId) external view returns (ShapeAttributes memory) {
        return _tokenAttributes[tokenId];
    }

    function getPossibleColors() external view returns (string[] memory) {
        return _possibleColors;
    }

    function getPossiblePatterns() external view returns (string[] memory) {
        return _possiblePatterns;
    }

    function setFlowVRFAddressForTest(address newVRFAddress) public { // Changed to public
        _setFlowVRFAddress(newVRFAddress);
    }

    // Expose internal function for testing tokenURI
    function _generateSVG(ShapeAttributes memory attributes) internal pure override returns (string memory) {
        return super._generateSVG(attributes);
    }
}

contract ShiftingShapesTest is Test {
    TestableShiftingShapes internal shapesNft;
    MockFlowVRF internal mockVrf;

    address internal owner;
    address internal user1;
    address internal user2;

    uint256 internal constant DEFAULT_RANDOM_SEED_VALUE = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
    bytes32 internal MOCK_RANDOM_VALUE = bytes32(DEFAULT_RANDOM_SEED_VALUE);

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event ShapeAttributesSet(uint256 indexed tokenId, ShiftingShapes.ShapeAttributes attributes);

    function setUp() public {
        owner = vm.addr(1);
        user1 = vm.addr(2);
        user2 = vm.addr(3);

        vm.startPrank(owner);
        shapesNft = new TestableShiftingShapes();
        mockVrf = new MockFlowVRF();
        shapesNft.setFlowVRFAddressForTest(address(mockVrf));
        mockVrf.setNextRandomValue(MOCK_RANDOM_VALUE);
        vm.stopPrank();
    }

    // --- Test Deployment & Setup ---
    function test_InitialSetup() public {
        assertEq(shapesNft.owner(), owner, "Owner should be set correctly");
        assertEq(address(shapesNft._flowVRF()), address(mockVrf), "Mock VRF should be set");
        assertEq(mockVrf.nextRandomValue(), MOCK_RANDOM_VALUE, "Mock VRF initial random value not set");
    }

    // --- Test Minting ---
    function test_MintShape_Success() public {
        vm.startPrank(owner);
        vm.expectEmit(true, true, true, true, address(shapesNft));
        emit Transfer(address(0), user1, 1);
        uint256 tokenId = shapesNft.mintShape(user1);
        vm.stopPrank();

        assertEq(tokenId, 1, "Token ID should be 1");
        assertEq(shapesNft.ownerOf(1), user1, "Owner of token 1 should be user1");
        assertEq(shapesNft.balanceOf(user1), 1, "Balance of user1 should be 1");

        ShiftingShapes.ShapeAttributes memory attributes = shapesNft.getTokenAttributes(1);
        // Verify attributes are derived from the MOCK_RANDOM_VALUE
        // This requires knowing the _deriveAttributesFromRandom logic
        // sides = uint8((randomUint % 10) + 3);
        // color = _possibleColors[randomUint % _possibleColors.length];
        // size = uint8((randomUint >> 8) % 41) + 10;
        // pattern = _possiblePatterns[randomUint % _possiblePatterns.length];

        uint256 randomUint = uint256(MOCK_RANDOM_VALUE);
        string[] memory possibleColors = shapesNft.getPossibleColors();
        string[] memory possiblePatterns = shapesNft.getPossiblePatterns();

        uint8 expectedSides = uint8((randomUint % 10) + 3);
        string memory expectedColor = possibleColors[randomUint % possibleColors.length];
        uint8 expectedSize = uint8((randomUint >> 8) % 41) + 10;
        string memory expectedPattern = possiblePatterns[randomUint % possiblePatterns.length];

        assertEq(attributes.sides, expectedSides, "Sides attribute mismatch");
        assertEq(attributes.color, expectedColor, "Color attribute mismatch");
        assertEq(attributes.size, expectedSize, "Size attribute mismatch");
        assertEq(attributes.pattern, expectedPattern, "Pattern attribute mismatch");

        // Check ShapeAttributesSet event
        // Unfortunately, comparing structs directly in expectEmit is tricky.
        // We can check individual fields if needed by decoding event data or having more specific events.
        // For now, we trust the internal logic if the attributes are set correctly as checked above.
    }

    function test_MintShape_EmitsShapeAttributesSet() public {
        vm.startPrank(owner);
        // We need to predict the attributes to check the event properly
        uint256 randomUint = uint256(MOCK_RANDOM_VALUE);
        string[] memory possibleColors = shapesNft.getPossibleColors();
        string[] memory possiblePatterns = shapesNft.getPossiblePatterns();
        ShiftingShapes.ShapeAttributes memory expectedAttributes = ShiftingShapes.ShapeAttributes({
            sides: uint8((randomUint % 10) + 3),
            color: possibleColors[randomUint % possibleColors.length],
            size: uint8((randomUint >> 8) % 41) + 10,
            pattern: possiblePatterns[randomUint % possiblePatterns.length]
        });

        vm.expectEmit(true, false, false, true, address(shapesNft)); // tokenId is indexed
        emit ShapeAttributesSet(1, expectedAttributes);
        shapesNft.mintShape(user1);
        vm.stopPrank();
    }


    function test_Fail_MintShape_NotOwner() public {
        vm.startPrank(user1); // user1 is not the owner
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user1));
        shapesNft.mintShape(user1);
        vm.stopPrank();
    }

    // --- Test Nudging ---
    function test_NudgeShape_Success() public {
        vm.startPrank(owner);
        uint256 tokenId = shapesNft.mintShape(user1);
        vm.stopPrank();

        // Set a new random value for nudge
        bytes32 nudgeRandomValue = bytes32(uint256(DEFAULT_RANDOM_SEED_VALUE + 1));
        mockVrf.setNextRandomValue(nudgeRandomValue);

        vm.startPrank(user1); // user1 is the owner of tokenId 1

        uint256 randomUintNudge = uint256(nudgeRandomValue);
        string[] memory possibleColors = shapesNft.getPossibleColors();
        string[] memory possiblePatterns = shapesNft.getPossiblePatterns();
        ShiftingShapes.ShapeAttributes memory expectedNudgedAttributes = ShiftingShapes.ShapeAttributes({
            sides: uint8((randomUintNudge % 10) + 3),
            color: possibleColors[randomUintNudge % possibleColors.length],
            size: uint8((randomUintNudge >> 8) % 41) + 10,
            pattern: possiblePatterns[randomUintNudge % possiblePatterns.length]
        });

        vm.expectEmit(true, false, false, true, address(shapesNft));
        emit ShapeAttributesSet(tokenId, expectedNudgedAttributes);

        shapesNft.nudgeShape(tokenId);
        vm.stopPrank();

        ShiftingShapes.ShapeAttributes memory newAttributes = shapesNft.getTokenAttributes(tokenId);
        assertEq(newAttributes.sides, expectedNudgedAttributes.sides, "Nudged sides attribute mismatch");
        assertEq(newAttributes.color, expectedNudgedAttributes.color, "Nudged color attribute mismatch");
        assertEq(newAttributes.size, expectedNudgedAttributes.size, "Nudged size attribute mismatch");
        assertEq(newAttributes.pattern, expectedNudgedAttributes.pattern, "Nudged pattern attribute mismatch");
    }

    function test_Fail_NudgeShape_NotOwner() public {
        vm.startPrank(owner);
        uint256 tokenId = shapesNft.mintShape(user1);
        vm.stopPrank();

        vm.startPrank(user2); // user2 is not the owner of tokenId 1
        vm.expectRevert(bytes("ShiftingShapes: Not the owner"));
        shapesNft.nudgeShape(tokenId);
        vm.stopPrank();
    }

    function test_Fail_NudgeShape_NonExistentToken() public {
        vm.startPrank(user1);
        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, 999));
        shapesNft.nudgeShape(999); // Token 999 does not exist
        vm.stopPrank();
    }

    // --- Test tokenURI ---
    function test_TokenURI_Success() public {
        vm.startPrank(owner);
        uint256 tokenId = shapesNft.mintShape(user1);
        vm.stopPrank();

        string memory uri = shapesNft.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0, "Token URI should not be empty");
        assertTrue(startsWith(uri, "data:application/json;base64,"), "URI should start with data:application/json;base64,");

        // Decode Base64 and parse JSON
        string memory actualBase64JsonPayload = substring(uri, 29, bytes(uri).length - 29); // Length of "data:application/json;base64," is 29

        ShiftingShapes.ShapeAttributes memory attributes = shapesNft.getTokenAttributes(tokenId);

        // Reconstruct the expected SVG string based on attributes (simplified version from ShiftingShapes.sol)
        string memory expectedSvgImage;
        string memory svgHeader = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">';
        string memory svgFooter = '</svg>';
        string memory shapeElement;
        if (attributes.sides < 5) {
             shapeElement = string(abi.encodePacked(
                '<rect x="10" y="10" width="', Strings.toString(uint256(attributes.size) * 2),
                '" height="', Strings.toString(uint256(attributes.size) * 2),
                '" fill="', attributes.color,
                '" />'
            ));
        } else {
            shapeElement = string(abi.encodePacked(
                '<circle cx="100" cy="100" r="', Strings.toString(attributes.size),
                '" fill="', attributes.color,
                '" />'
            ));
        }
        expectedSvgImage = string(abi.encodePacked(svgHeader, shapeElement, svgFooter));

        string memory expectedImageField = string(abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(expectedSvgImage))));

        string memory expectedJson = string(
            abi.encodePacked(
                '{"name": "Shifting Shape #', Strings.toString(tokenId), '", ',
                '"description": "A dynamic NFT that changes its shape.", ',
                '"image": "', expectedImageField, '", ',
                '"attributes": [',
                '{"trait_type": "Sides", "value": ', Strings.toString(attributes.sides), '}, ',
                '{"trait_type": "Color", "value": "', attributes.color, '"}, ',
                '{"trait_type": "Size", "value": ', Strings.toString(attributes.size), '}, ',
                '{"trait_type": "Pattern", "value": "', attributes.pattern, '"}',
                ']}'
            )
        );
        string memory expectedBase64JsonPayload = Base64.encode(bytes(expectedJson));

        assertEq(actualBase64JsonPayload, expectedBase64JsonPayload, "Base64 JSON payload mismatch");
        // We can check that the image field looks like a base64 encoded SVG.
        // string memory imagePrefix = Base64.encode(bytes('"image": "data:image/svg+xml;base64,'));
        // string memory imageSuffix = Base64.encode(bytes('", "attributes"')); // This might be too fragile
        // uint256 imageStart = find(base64Json, imagePrefix) + bytes(imagePrefix).length;
        // uint256 imageEnd = find(base64Json, imageSuffix);
        // assertTrue(imageStart < imageEnd, "Could not find encoded image field correctly");

        // string memory imageBase64 = substring(base64Json, imageStart, imageEnd - imageStart);
        // // string memory decodedSvg = string(Base64.decode(bytes(imageBase64))); // Cannot decode

        // // assertTrue(startsWith(decodedSvg, "<svg") && endsWith(decodedSvg, "</svg>"), "Decoded image should be a valid SVG string");
        // // Further SVG content checks based on attributes
        // // assertTrue(contains(decodedSvg, string(abi.encodePacked('fill="', attributes.color, '"'))), "SVG should contain correct fill color");
        // // if (attributes.sides < 5) {
        // //     assertTrue(contains(decodedSvg, string(abi.encodePacked('width="', Strings.toString(uint256(attributes.size) * 2)))), "SVG rect should have correct width");
        // // } else {
        // //     assertTrue(contains(decodedSvg, string(abi.encodePacked('r="', Strings.toString(attributes.size)))), "SVG circle should have correct radius");
        // // }
        // For now, we'll assume if the image tag is there and the other attributes are, the SVG part is likely correct.
        // A more robust test would require a Base64 decode utility or more complex string matching on the encoded form.
    }

    function test_Fail_TokenURI_NonExistentToken() public {
        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, 999));
        shapesNft.tokenURI(999);
    }

    // --- Test ERC721 Compliance (Basic) ---
    // OpenZeppelin contracts are well-tested, so these are mostly sanity checks for integration.
    function test_ERC721_TransferFrom() public {
        vm.startPrank(owner);
        uint256 tokenId = shapesNft.mintShape(user1); // user1 owns token 1
        vm.stopPrank();

        vm.startPrank(user1); // user1 initiates transfer
        shapesNft.approve(user2, tokenId); // user1 approves user2 to take the token
        vm.stopPrank();

        vm.startPrank(user2); // user2 takes the token
        vm.expectEmit(true, true, true, true, address(shapesNft));
        emit Transfer(user1, user2, tokenId);
        shapesNft.transferFrom(user1, user2, tokenId);
        vm.stopPrank();

        assertEq(shapesNft.ownerOf(tokenId), user2, "New owner should be user2 after transferFrom");
    }

    function test_ERC721_ApproveAndGetApproved() public {
        vm.startPrank(owner);
        uint256 tokenId = shapesNft.mintShape(user1);
        vm.stopPrank();

        vm.startPrank(user1);
        shapesNft.approve(user2, tokenId);
        vm.stopPrank();

        assertEq(shapesNft.getApproved(tokenId), user2, "user2 should be approved for the token");
    }

    // --- Helper functions for string manipulation in tests ---
    function startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        return bytes(str).length >= bytes(prefix).length && keccak256(abi.encodePacked(substring(str, 0, bytes(prefix).length))) == keccak256(abi.encodePacked(prefix));
    }

    function endsWith(string memory str, string memory suffix) internal pure returns (bool) {
        return bytes(str).length >= bytes(suffix).length && keccak256(abi.encodePacked(substring(str, bytes(str).length - bytes(suffix).length, bytes(suffix).length))) == keccak256(abi.encodePacked(suffix));
    }

    function contains(string memory str, string memory substr) internal pure returns (bool) {
        return find(str, substr) != type(uint256).max;
    }

    function find(string memory str, string memory substr) internal pure returns (uint256) {
        bytes memory haystack = bytes(str);
        bytes memory needle = bytes(substr);
        if (needle.length == 0) return 0;
        if (needle.length > haystack.length) return type(uint256).max; // Not found

        for (uint i = 0; i <= haystack.length - needle.length; i++) {
            bool isMatch = true;
            for (uint j = 0; j < needle.length; j++) {
                if (haystack[i+j] != needle[j]) {
                    isMatch = false;
                    break;
                }
            }
            if (isMatch) return i;
        }
        return type(uint256).max; // Not found
    }

    function substring(string memory str, uint256 startIndex, uint256 length) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        require(startIndex + length <= strBytes.length, "Substring out of bounds");
        bytes memory result = new bytes(length);
        for (uint i = 0; i < length; i++) {
            result[i] = strBytes[startIndex + i];
        }
        return string(result);
    }
}