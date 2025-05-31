// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {QuizResults} from "../src/QuizResults.sol";

contract QuizResultsTest is Test {
    QuizResults public quizResults;
    address public user1;
    address public user2;

    // Define events for testing
    event ResultSaved(address indexed user, uint256 score, uint256 timestamp);
    event HighestScoreUpdated(address indexed user, uint256 newHighestScore);

    function setUp() public {
        quizResults = new QuizResults();
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
    }

    function test_SaveResult() public {
        vm.startPrank(user1);
        quizResults.saveResult(80);

        QuizResults.Result[] memory results = quizResults.getResults(user1);
        assertEq(results.length, 1);
        assertEq(results[0].score, 80);
        vm.stopPrank();
    }

    function test_HighestScore() public {
        vm.startPrank(user1);

        // First score
        quizResults.saveResult(80);
        assertEq(quizResults.highestScore(user1), 80);

        // Lower score shouldn't update highest
        quizResults.saveResult(70);
        assertEq(quizResults.highestScore(user1), 80);

        // Higher score should update highest
        quizResults.saveResult(90);
        assertEq(quizResults.highestScore(user1), 90);

        vm.stopPrank();
    }

    function test_MultipleUsers() public {
        // User 1 scores
        vm.startPrank(user1);
        quizResults.saveResult(80);
        quizResults.saveResult(90);
        vm.stopPrank();

        // User 2 scores
        vm.startPrank(user2);
        quizResults.saveResult(85);
        quizResults.saveResult(95);
        vm.stopPrank();

        // Check highest scores
        assertEq(quizResults.highestScore(user1), 90);
        assertEq(quizResults.highestScore(user2), 95);

        // Check results arrays
        QuizResults.Result[] memory user1Results = quizResults.getResults(
            user1
        );
        QuizResults.Result[] memory user2Results = quizResults.getResults(
            user2
        );

        assertEq(user1Results.length, 2);
        assertEq(user2Results.length, 2);
        assertEq(user1Results[0].score, 80);
        assertEq(user1Results[1].score, 90);
        assertEq(user2Results[0].score, 85);
        assertEq(user2Results[1].score, 95);
    }

    function test_Events() public {
        vm.startPrank(user1);

        // Test ResultSaved event
        vm.expectEmit(true, false, false, true);
        emit ResultSaved(user1, 80, block.timestamp);
        quizResults.saveResult(80);

        // Test HighestScoreUpdated event
        vm.expectEmit(true, false, false, true);
        emit HighestScoreUpdated(user1, 90);
        quizResults.saveResult(90);

        // Should not emit HighestScoreUpdated for lower score
        vm.expectEmit(true, false, false, true);
        emit ResultSaved(user1, 70, block.timestamp);
        quizResults.saveResult(70);

        vm.stopPrank();
    }
}
