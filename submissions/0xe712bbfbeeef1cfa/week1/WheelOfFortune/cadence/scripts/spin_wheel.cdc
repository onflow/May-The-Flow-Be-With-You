import WheelOfFortune from "../contracts/WheelOfFortune.cdc"

access(all) fun main(): String {
    // Get the wheel contract
    let wheel = getAccount(0x01).contracts.borrow<&WheelOfFortune>(name: "WheelOfFortune")
        ?? panic("WheelOfFortune contract not found")
    
    // Spin the wheel and return the result
    return wheel.spinWheel()
} 