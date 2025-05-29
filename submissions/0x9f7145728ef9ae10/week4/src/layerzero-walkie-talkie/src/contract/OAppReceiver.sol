// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import { OAppReceiver, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppReceiver.sol";
import { OAppCore } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppCore.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @notice THIS IS AN EXAMPLE CONTRACT. DO NOT USE THIS CODE IN PRODUCTION.
 */

contract DestinationOApp is OAppReceiver {

    string public data = "Nothing received yet";  // Our data, in this case a string.

    
    /// @notice Emitted when a message is received through _lzReceive.
    /// @param message The content of the received message.
    /// @param senderEid What LayerZero Endpoint sent the message.
    /// @param sender The sending OApp's address.
    /// @param nonce The nonce of the message.
    event MessageReceived(string message, uint32 senderEid, bytes32 sender, uint64 nonce);

    /**
     * @notice Initializes the OApp with the source chain's endpoint address.
     * @param _endpoint The endpoint address.
     */
    constructor(address _endpoint) OAppCore(_endpoint, /*owner*/msg.sender) Ownable(msg.sender) {}
    
    /**
     * @dev Called when the Executor executes EndpointV2.lzReceive. It overrides the equivalent function in the parent OApp contract.
     * Protocol messages are defined as packets, comprised of the following parameters.
     * @param _origin A struct containing information about where the packet came from.
     * _guid A global unique identifier for tracking the packet.
     * @param message Encoded message.
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 /*_guid*/,
        bytes calldata message,
        address /*executor*/,  // Executor address as specified by the OApp.
        bytes calldata /*_extraData*/  // Any extra data or options to trigger on receipt.
    ) internal override {
        // Decode the payload to get the message
        data = abi.decode(message, (string));
        // Emit the event with the decoded message and sender's EID
        emit MessageReceived(data, _origin.srcEid, _origin.sender, _origin.nonce);
    }
}