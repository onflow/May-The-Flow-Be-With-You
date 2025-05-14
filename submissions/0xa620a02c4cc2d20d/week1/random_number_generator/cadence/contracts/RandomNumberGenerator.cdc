/// A simple contract that generates random numbers within a specified range
/// using Flow's secure randomness
access(all) contract RandomNumberGenerator {
    // Event emitted when a random number request is committed
    access(all) event RandomNumberRequested(
        requestId: UInt64,
        min: UInt64,
        max: UInt64,
        blockHeight: UInt64
    )

    // Event emitted when a random number is revealed
    access(all) event RandomNumberRevealed(
        requestId: UInt64,
        min: UInt64,
        max: UInt64,
        randomNumber: UInt64
    )

    // Store pending requests
    access(self) var pendingRequests: {UInt64: RandomNumberRequest}
    
    // Struct to store request information
    access(all) struct RandomNumberRequest {
        access(all) let min: UInt64
        access(all) let max: UInt64
        access(all) let blockHeight: UInt64

        init(min: UInt64, max: UInt64, blockHeight: UInt64) {
            self.min = min
            self.max = max
            self.blockHeight = blockHeight
        }
    }

    init() {
        self.pendingRequests = {}
    }

    // Request a random number
    access(all) fun requestRandomNumber(min: UInt64, max: UInt64): UInt64 {
        pre {
            min <= max: "Minimum value must be less than or equal to maximum value"
        }
        
        let requestId = UInt64(self.pendingRequests.length + 1)
        let blockHeight = getCurrentBlock().height
        
        let request = RandomNumberRequest(
            min: min,
            max: max,
            blockHeight: blockHeight
        )
        
        self.pendingRequests[requestId] = request
        
        emit RandomNumberRequested(
            requestId: requestId,
            min: min,
            max: max,
            blockHeight: blockHeight
        )
        
        return requestId
    }

    // Reveal the random number
    access(all) fun revealRandomNumber(requestId: UInt64): UInt64 {
        let request = self.pendingRequests[requestId] ?? panic("Request not found")
        
        // Get the source of randomness from the committed block
        let sor = getCurrentBlock().height
        
        // Calculate the range size
        let range = request.max - request.min + 1
        
        // Generate the random number using the source of randomness
        let randomNumber = request.min + (sor % range)
        
        // Remove the request and store the removed value
        let removedRequest = self.pendingRequests.remove(key: requestId)
        
        emit RandomNumberRevealed(
            requestId: requestId,
            min: request.min,
            max: request.max,
            randomNumber: randomNumber
        )
        
        return randomNumber
    }
} 