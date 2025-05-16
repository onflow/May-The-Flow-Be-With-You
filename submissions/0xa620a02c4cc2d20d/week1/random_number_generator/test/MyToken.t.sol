pragma solidity ^0.8.20;

import {Test, console2, stdError} from "forge-std/Test.sol";
import {MyToken} from "../src/MyToken.sol";

contract MyTokenTest is Test {
    uint256 initialSupply = 420000;

    MyToken public token;
    address ownerAddress = makeAddr("owner");
    address randomUserAddress = makeAddr("user");

    function setUp() public {
        vm.prank(ownerAddress);
        token = new MyToken(initialSupply);
    }

    /*
        Test general ERC-20 token properties
    */
    function test_tokenProps() public view {
        assertEq(token.name(), "MyToken");
        assertEq(token.symbol(), "MyT");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), initialSupply);
        assertEq(token.balanceOf(address(0)), 0);
        assertEq(token.balanceOf(ownerAddress), initialSupply);
    }

    /*
        Test Revert transfer to sender with insufficient balance
    */
    function test_transferRevertInsufficientBalance() public {
        vm.prank(randomUserAddress);
        vm.expectRevert(
            abi.encodeWithSignature(
                "ERC20InsufficientBalance(address,uint256,uint256)",
                randomUserAddress,
                0,
                42
            )
        );
        token.transfer(ownerAddress, 42);
    }

    /*
        Test transfer
    */
    function test_transfer() public {
        vm.prank(ownerAddress);
        assertEq(token.transfer(randomUserAddress, 42), true);
        assertEq(token.balanceOf(randomUserAddress), 42);
        assertEq(token.balanceOf(ownerAddress), initialSupply - 42);
    }

    /*
        Test transferFrom with approval
    */
    function test_transferFrom() public {
        vm.prank(ownerAddress);
        token.approve(randomUserAddress, 69);

        uint256 initialRandomUserBalance = token.balanceOf(randomUserAddress);
        uint256 initialOwnerBalance = token.balanceOf(ownerAddress);

        vm.prank(randomUserAddress);
        assertEq(token.transferFrom(ownerAddress, randomUserAddress, 42), true);
        assertEq(
            token.balanceOf(randomUserAddress),
            initialRandomUserBalance + 42
        );
        assertEq(token.balanceOf(ownerAddress), initialOwnerBalance - 42);
        assertEq(token.allowance(ownerAddress, randomUserAddress), 69 - 42);
    }
}
