// scripts/get_game_details.cdc
// A script to retrieve the public details of a specific game by its ID.

import ElementalStrikers from "../contracts/ElementalStrikers.cdc"

// This script takes one argument: the ID of the game
access(all) fun main(gameId: UInt64): ElementalStrikers.GameDetails? {
    // Get the game details using the public view function
     return ElementalStrikers.getGamePublicDetails(gameId: gameId)
} 