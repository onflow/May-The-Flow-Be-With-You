// setup_account.cdc

import WordChainGame from 0x01 // Replace with your actual contract address when deployed

transaction {
    prepare(signer: AuthAccount) {
        // Register the player
        WordChainGame.registerPlayer(player: signer.address)
        
        log("Player registered successfully")
    }
}