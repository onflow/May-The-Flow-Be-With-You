access(all) contract WheelOfFortune {
    // Event emitted when a player spins the wheel
    access(all) event WheelSpun(player: Address, prize: String, timestamp: UFix64)
    
    // Struct to store wheel segments
    access(all) struct WheelSegment {
        access(all) let prize: String
        access(all) let weight: UInt32
        
        init(prize: String, weight: UInt32) {
            self.prize = prize
            self.weight = weight
        }
    }
    
    // Array to store wheel segments
    access(all) var segments: [WheelSegment]
    
    init() {
        // Initialize wheel segments with different prizes and weights
        self.segments = [
            WheelSegment(prize: "100 FLOW", weight: 5),
            WheelSegment(prize: "50 FLOW", weight: 10),
            WheelSegment(prize: "25 FLOW", weight: 15),
            WheelSegment(prize: "10 FLOW", weight: 20),
            WheelSegment(prize: "5 FLOW", weight: 25),
            WheelSegment(prize: "Try Again", weight: 25)
        ]
    }
    
    // Function to spin the wheel and get a random prize
    access(all) fun spinWheel(): String {
        // Get a random number using Flow's built-in randomness
        let randomNumber = self.getRandomNumber()
        
        // Calculate total weight
        var totalWeight: UInt32 = 0
        for segment in self.segments {
            totalWeight = totalWeight + segment.weight
        }
        
        // Find the winning segment based on the random number
        var currentWeight: UInt32 = 0
        for segment in self.segments {
            currentWeight = currentWeight + segment.weight
            if randomNumber <= currentWeight {
                // Emit the event
                emit WheelSpun(player: self.account.address, prize: segment.prize, timestamp: getCurrentBlock().timestamp)
                return segment.prize
            }
        }
        
        // Fallback (should never reach here)
        return "Try Again"
    }
    
    // Helper function to get a random number
    access(self) fun getRandomNumber(): UInt32 {
        // Use Flow's built-in randomness
        let randomNumber = UInt32(getCurrentBlock().timestamp)
        return randomNumber % 100
    }
} 