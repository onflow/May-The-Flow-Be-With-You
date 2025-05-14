import RandomNumberGenerator from "../contracts/RandomNumberGenerator.cdc"

transaction(min: UInt64, max: UInt64) {
    execute {
        // Request a random number
        let requestId = RandomNumberGenerator.requestRandomNumber(min: min, max: max)
        log("Requested random number with ID: ".concat(requestId.toString()))
    }
} 