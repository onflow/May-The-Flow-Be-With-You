// scripts/get_game_details.cdc
// Fetches and returns the details of a specific game.

import ElementalStrikers from "../contracts/ElementalStrikers.cdc"

// Script parameters:
// gameId: The ID of the game to fetch details for.

pub fun main(gameId: UInt64): ElementalStrikers.GameDetails? {
    // Access the public function on the contract to get game details.
    // If the PlayerAgent resource had a getGameDetails function that didn't require auth,
    // we could also call it via a capability if we knew a player's address.
    // However, for general game lookup by ID, calling a public contract function is common if available,
    // or if GameDetails was a public struct on the game resource accessible via a public getter.

    // Our current getGameDetails is on the PlayerAgent, which requires an agent.
    // For a general script, we need a way to see any game. 
    // Let's assume we want to query the GameDetails via a player who might be in that game,
    // or if not, we need to enhance the contract with a public getter for GameDetails if that's desired.

    // For now, this script will assume you know an account that has a PlayerAgent
    // and will try to get details through it. This is not ideal for a generic game inspector.
    // A better approach for a generic inspector is a public mapping or a public getter on the contract for GameDetails.

    // Let's pivot: The contract could have a public function to expose GameDetails.
    // We will add one to the contract for this script to work generically.
    // For now, this script won't work without that contract change or by providing an account address.

    // --- MODIFICATION NEEDED IN ElementalStrikers.cdc --- 
    // Add the following public function to ElementalStrikers contract:
    // pub fun getGamePublicDetails(gameId: UInt64): GameDetails? {
    //     if let gameRef = self.games[gameId] {
    //         return GameDetails(gameRef: gameRef)
    //     }
    //     return nil
    // }
    // --- END MODIFICATION NEEDED --- 

    // Assuming the above function is added to the contract:
    // return ElementalStrikers.getGamePublicDetails(gameId: gameId)

    // Since we can't modify the contract *from here* directly, this script will be a template.
    // To make it runnable NOW, it would need an address of an account with a PlayerAgent.
    // Let's write it assuming you provide an account address that *might* be in the game,
    // and it will try to use that account's PlayerAgent.

    log("This script ideally uses a public function on the contract like getGamePublicDetails(gameId).")
    log("As a fallback, if you provide an accountAddress that has set up a PlayerAgent, it can try that.")
    log("For a true generic inspector, modify the contract to add a public details getter.")
    
    // This script will be more of a placeholder until the contract has a direct public getter for any gameId.
    // For now, it just returns nil and logs a message.
    // To use it effectively, you'd call playerAgent.getGameDetails(gameId) from within a transaction 
    // or a script that has access to a specific player's PlayerAgent capability.

    // To make it somewhat useful if one knows a player in the game:
    // pub fun main(gameId: UInt64, playerAddress: Address): ElementalStrikers.GameDetails? {
    //     let account = getAccount(playerAddress)
    //     let agentCapability = account.capabilities.get<&ElementalStrikers.PlayerAgent{ElementalStrikers.GamePlayer}>(
    //         ElementalStrikers.GamePlayerPublicPath
    //     )
    //     if let agent = agentCapability.borrow() {
    //         return agent.getGameDetails(gameId: gameId)
    //     }
    //     log("Could not borrow PlayerAgent for the provided address.")
    //     return nil
    // }
    // For a simple version that expects the contract to be augmented:
     return ElementalStrikers.getGamePublicDetails(gameId: gameId)
} 