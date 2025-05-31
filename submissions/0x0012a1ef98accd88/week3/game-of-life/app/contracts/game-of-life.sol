// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {CadenceRandomConsumer} from "@onflow/flow-sol-utils/src/random/CadenceRandomConsumer.sol";

contract GameOfLife is CadenceRandomConsumer {

    function getRandomNumber() public view returns (uint64) {
        uint64 _randomNumber =  _getRevertibleRandomInRange(1, 10);

        return _randomNumber;
    }
    
}