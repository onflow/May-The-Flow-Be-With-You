// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import {OAppSender, MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import { OptionsBuilder } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";
import { OAppCore } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppCore.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @notice THIS IS AN EXAMPLE CONTRACT. DO NOT USE THIS CODE IN PRODUCTION.
 */

contract SourceOApp is OAppSender {
    using OptionsBuilder for bytes;

    event MessageSent(string message, uint32 dstEid);

    /// The `_options` variable is typically provided as an argument to both the `_quote` and `_lzSend` functions.
    /// In this example, we demonstrate how to generate the `bytes` value for `_options` and pass it manually.
    /// The `OptionsBuilder` is used to create new options and add an executor option for `LzReceive` with specified parameters.
    /// An off-chain equivalent can be found under 'Message Execution Options' in the LayerZero V2 Documentation.
    bytes _options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(50000, 0);

    /**
     * @notice Initializes the OApp with the source chain's endpoint address.
     * @param _endpoint The endpoint address.
     */
    constructor(address _endpoint) OAppCore(_endpoint, /*owner*/msg.sender) Ownable(msg.sender) {}

    /**
     * @dev Converts an address to bytes32.
     * @param _addr The address to convert.
     * @return The bytes32 representation of the address.
     */
    function addressToBytes32(address _addr) public pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    /**
     * @dev Converts bytes32 to an address.
     * @param _b The bytes32 value to convert.
     * @return The address representation of bytes32.
     */
    function bytes32ToAddress(bytes32 _b) public pure returns (address) {
        return address(uint160(uint256(_b)));
    }

    /**
     * @dev Quotes the gas needed to pay for the full omnichain transaction in native gas or ZRO token.
     * @param _dstEid Destination chain's endpoint ID.
     * @param _message The message.
     * @param _payInLzToken Whether to return fee in ZRO token.
     * @notice _options variable is typically provided as an argument and not hard-coded.
     */
    function quote(
        uint32 _dstEid,
        string memory _message,
        bool _payInLzToken
    ) public view returns (MessagingFee memory fee) {
        bytes memory payload = abi.encode(_message);
        fee = _quote(_dstEid, payload, _options, _payInLzToken);
    }

    /**
     * @dev Sends a message from the source to destination chain.
     * @param _dstEid Destination chain's endpoint ID.
     * @param _message The message to send.
     * @notice _options variable is typically provided as an argument and not hard-coded.
     * @notice see your LayerZero transaction by pasting the hash in https://testnet.layerzeroscan.com/
     */
    function send(
        uint32 _dstEid,
        string memory _message
    ) external payable {
        // Encodes the message before invoking _lzSend.
        bytes memory _encodedMessage = abi.encode(_message);
        _lzSend(
            _dstEid,
            _encodedMessage,
            _options,
            // Fee in native gas and ZRO token.
            MessagingFee(msg.value, 0),
            // Refund address in case of failed source message.
            payable(msg.sender) 
        );

        emit MessageSent(_message, _dstEid);
    }
}