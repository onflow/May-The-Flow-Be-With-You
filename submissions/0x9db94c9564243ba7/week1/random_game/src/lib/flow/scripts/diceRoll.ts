export const diceRollScript = `
access(all) fun main(): [UInt8] {
    // Generate first dice roll (1-6)
    let firstRoll = revertibleRandom<UInt8>(modulo: 6) + 1
    
    // Generate second dice roll (1-6)
    let secondRoll = revertibleRandom<UInt8>(modulo: 6) + 1
    
    // Return both rolls as an array
    return [firstRoll, secondRoll]
}
`; 