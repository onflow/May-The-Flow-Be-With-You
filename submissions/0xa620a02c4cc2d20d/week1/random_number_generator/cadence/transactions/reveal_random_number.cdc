import RandomNumberGenerator from "../contracts/RandomNumberGenerator.cdc"

transaction(requestId: UInt64) {
    execute {
        // Reveal the random number
        let randomNumber = RandomNumberGenerator.revealRandomNumber(requestId: requestId)
        log("Revealed random number: ".concat(randomNumber.toString()))
    }
} 