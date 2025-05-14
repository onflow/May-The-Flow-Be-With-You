import RandomNumberGenerator from "../contracts/RandomNumberGenerator.cdc"

access(all) fun main(): UInt64 {
    let min: UInt64 = 1
    let max: UInt64 = 1000
    let seed: String = "unique_seed_".concat(getCurrentBlock().height.toString())
    
    return RandomNumberGenerator.generateRandomNumberWithSeed(min: min, max: max, seed: seed)
} 