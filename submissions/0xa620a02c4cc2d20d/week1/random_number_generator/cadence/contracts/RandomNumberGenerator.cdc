/// A simple contract that generates random numbers within a specified range
/// using Flow's secure randomness
access(all) contract RandomNumberGenerator {
    // Event emitted when a random number is generated
    access(all) event RandomNumberGenerated(min: UInt64, max: UInt64, randomNumber: UInt64)

    /// Generates a random number between min and max (inclusive)
    /// @param min The minimum value (inclusive)
    /// @param max The maximum value (inclusive)
    /// @return A random number between min and max (inclusive)
    access(all) fun generateRandomNumber(min: UInt64, max: UInt64): UInt64 {
        pre {
            min <= max: "Minimum value must be less than or equal to maximum value"
        }
        
        // Get a random number from Flow's secure randomness beacon
        let randomValue = revertibleRandom<UInt64>()
        
        // Calculate the range size
        let range = max - min + 1
        
        // Map the random value to our desired range
        let randomNumber = min + (randomValue % range)
        
        emit RandomNumberGenerated(
            min: min,
            max: max,
            randomNumber: randomNumber
        )
        
        return randomNumber
    }

    /// Generates a random number between min and max (inclusive) using a seed
    /// @param min The minimum value (inclusive)
    /// @param max The maximum value (inclusive)
    /// @param seed A string to use as additional entropy
    /// @return A random number between min and max (inclusive)
    access(all) fun generateRandomNumberWithSeed(min: UInt64, max: UInt64, seed: String): UInt64 {
        pre {
            min <= max: "Minimum value must be less than or equal to maximum value"
        }
        
        // Get a random number from Flow's secure randomness beacon
        let randomValue = revertibleRandom<UInt64>()
        
        // Calculate the range size
        let range = max - min + 1
        
        // Use both the random value and seed to generate a number
        let seedValue = randomValue + UInt64(seed.utf8[0])
        let randomNumber = min + (seedValue % range)
        
        emit RandomNumberGenerated(
            min: min,
            max: max,
            randomNumber: randomNumber
        )
        
        return randomNumber
    }
} 