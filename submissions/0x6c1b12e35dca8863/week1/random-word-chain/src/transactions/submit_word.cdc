// submit_word.cdc

import WordChainGame from 0x01 // Replace with your actual contract address when deployed

transaction(word: String) {
    prepare(signer: AuthAccount) {
        // Submit the word
        let success = WordChainGame.submitWord(player: signer.address, word: word)
        
        if success {
            log("Word submitted successfully!")
        } else {
            log("Invalid word or insufficient letters")
        }
    }
}