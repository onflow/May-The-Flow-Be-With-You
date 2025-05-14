import RandomNumberGenerator from "../contracts/RandomNumberGenerator.cdc"

access(all) fun main(): UInt64 {
    let min: UInt64 = 1
    let max: UInt64 = 1000
    
    // First request a random number
    let requestId = RandomNumberGenerator.requestRandomNumber(min: min, max: max)
    
    // Then reveal it
    return RandomNumberGenerator.revealRandomNumber(requestId: requestId)
} 