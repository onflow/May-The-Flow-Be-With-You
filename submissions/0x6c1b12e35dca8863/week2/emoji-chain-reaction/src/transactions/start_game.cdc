// start_game.cdc

import EmojiChainGame from 0x01 // Replace with your actual contract address when deployed

transaction {
    prepare(signer: AuthAccount) {
        // Start a new game session for the player
        EmojiChainGame.startGame(player: signer.address)
        
        log("New game started!")
    }
}