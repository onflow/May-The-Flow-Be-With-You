import RandomNumberGenerator from "../contracts/RandomNumberGenerator.cdc"

transaction(min: UInt64, max: UInt64, seed: String) {
    execute {
        let random = RandomNumberGenerator.generateRandomNumberWithSeed(min: min, max: max, seed: seed)
        log("Random number: ".concat(random.toString()))
    }
} 