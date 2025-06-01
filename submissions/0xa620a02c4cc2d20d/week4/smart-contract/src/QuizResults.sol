// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract QuizResults {
    struct Result {
        uint256 score;
        uint256 timestamp;
    }

    mapping(address => Result[]) public userResults;
    mapping(address => uint256) public highestScore;

    event ResultSaved(address indexed user, uint256 score, uint256 timestamp);
    event HighestScoreUpdated(address indexed user, uint256 newHighestScore);

    function saveResult(uint256 score) external {
        userResults[msg.sender].push(Result(score, block.timestamp));
        emit ResultSaved(msg.sender, score, block.timestamp);

        if (score > highestScore[msg.sender]) {
            highestScore[msg.sender] = score;
            emit HighestScoreUpdated(msg.sender, score);
        }
    }

    function getResults(address user) external view returns (Result[] memory) {
        return userResults[user];
    }
}
