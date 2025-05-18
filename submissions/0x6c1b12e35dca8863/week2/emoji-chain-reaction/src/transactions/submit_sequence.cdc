// submit_sequence.cdc

import EmojiChainGame from 0x01 // Replace with your actual contract address when deployed

transaction(sequence: [String]) {
    prepare(signer: AuthAccount) {
        // Submit the player's sequence attempt
        let success = EmojiChainGame.submitSequence(
            player: signer.address,
            inputSequence: sequence
        )
        
        if success {
            log("Sequence matched successfully! Moving to next level.")
        } else {
            log("Game over! Sequence did not match.")
        }
    }
}