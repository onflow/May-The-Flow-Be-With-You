// Memory VRF Contract
// Provides verifiable random number generation for memory games

import RandomBeaconHistory from 0x8c5303eaa26202d6

access(all) contract MemoryVRF {
    
    // Events
    access(all) event RandomnessRequested(requestId: String, requester: Address, timestamp: UFix64)
    access(all) event RandomnessRevealed(requestId: String, seed: UInt64, blockHeight: UInt64)
    
    // Paths
    access(all) let ConsumerStoragePath: StoragePath
    access(all) let ConsumerPublicPath: PublicPath
    
    // VRF Request structure
    access(all) struct VRFRequest {
        access(all) let id: String
        access(all) let requester: Address
        access(all) let commitValue: String
        access(all) let timestamp: UFix64
        access(all) var isRevealed: Bool
        access(all) var seed: UInt64?
        access(all) var blockHeight: UInt64?
        
        init(id: String, requester: Address, commitValue: String) {
            self.id = id
            self.requester = requester
            self.commitValue = commitValue
            self.timestamp = getCurrentBlock().timestamp
            self.isRevealed = false
            self.seed = nil
            self.blockHeight = nil
        }
        
        access(contract) fun reveal(seed: UInt64, blockHeight: UInt64) {
            self.seed = seed
            self.blockHeight = blockHeight
            self.isRevealed = true
        }
    }
    
    // Consumer interface for games to request randomness
    access(all) resource interface ConsumerPublic {
        access(all) fun getRequest(requestId: String): VRFRequest?
        access(all) fun getRandomResult(requestId: String): UInt64?
    }
    
    // Consumer resource for managing VRF requests
    access(all) resource Consumer: ConsumerPublic {
        access(self) var requests: {String: VRFRequest}
        access(self) var commitSecrets: {String: String}
        
        init() {
            self.requests = {}
            self.commitSecrets = {}
        }
        
        // Submit commit for randomness request
        access(all) fun submitCommit(requestId: String, commitValue: String) {
            pre {
                self.requests[requestId] == nil: "Request already exists"
            }
            
            let request = VRFRequest(
                id: requestId,
                requester: self.owner?.address ?? panic("No owner"),
                commitValue: commitValue
            )
            
            self.requests[requestId] = request
            
            emit RandomnessRequested(
                requestId: requestId,
                requester: request.requester,
                timestamp: request.timestamp
            )
        }
        
        // Submit reveal to generate randomness
        access(all) fun submitReveal(requestId: String, revealValue: UInt64) {
            pre {
                self.requests[requestId] != nil: "Request not found"
                self.requests[requestId]!.isRevealed == false: "Request already revealed"
            }
            
            let request = self.requests[requestId]!
            
            // Use Flow's native randomness combined with reveal value
            let blockHeight = getCurrentBlock().height
            let randomSource = RandomBeaconHistory.sourceOfRandomness(atBlockHeight: blockHeight)
            
            // Combine random source with reveal value for additional entropy
            let combinedSeed = UInt64(randomSource.toBigEndianBytes()[0]) ^ revealValue
            
            // Update request with result
            request.reveal(seed: combinedSeed, blockHeight: blockHeight)
            self.requests[requestId] = request
            
            emit RandomnessRevealed(
                requestId: requestId,
                seed: combinedSeed,
                blockHeight: blockHeight
            )
        }
        
        // Get request details
        access(all) fun getRequest(requestId: String): VRFRequest? {
            return self.requests[requestId]
        }
        
        // Get random result if available
        access(all) fun getRandomResult(requestId: String): UInt64? {
            if let request = self.requests[requestId] {
                return request.seed
            }
            return nil
        }
        
        // Clean up old requests (optional)
        access(all) fun cleanupOldRequests(olderThan: UFix64) {
            let currentTime = getCurrentBlock().timestamp
            let requestIds = self.requests.keys
            
            for requestId in requestIds {
                if let request = self.requests[requestId] {
                    if request.timestamp < currentTime - olderThan {
                        self.requests.remove(key: requestId)
                    }
                }
            }
        }
    }
    
    // Create a new consumer resource
    access(all) fun createConsumer(): @Consumer {
        return <- create Consumer()
    }
    
    // Public function to get random result (for external queries)
    access(all) fun getRandomResult(address: Address, requestId: String): UInt64? {
        if let consumerRef = getAccount(address).capabilities.borrow<&Consumer>(MemoryVRF.ConsumerPublicPath) {
            return consumerRef.getRandomResult(requestId: requestId)
        }
        return nil
    }
    
    // Utility function to generate deterministic sequence from seed
    access(all) fun generateSequence(seed: UInt64, count: Int): [UInt64] {
        let sequence: [UInt64] = []
        var currentSeed = seed
        
        var i = 0
        while i < count {
            // Simple linear congruential generator for deterministic sequence
            currentSeed = (currentSeed * 1103515245 + 12345) % 2147483648
            sequence.append(currentSeed)
            i = i + 1
        }
        
        return sequence
    }
    
    // Utility function to generate random number in range
    access(all) fun randomInRange(seed: UInt64, min: UInt64, max: UInt64): UInt64 {
        pre {
            max > min: "Max must be greater than min"
        }
        
        let range = max - min
        return min + (seed % range)
    }
    
    init() {
        self.ConsumerStoragePath = /storage/memoryVRFConsumer
        self.ConsumerPublicPath = /public/memoryVRFConsumer
        
        // Create and store a consumer for the contract account
        let consumer <- create Consumer()
        self.account.storage.save(<-consumer, to: self.ConsumerStoragePath)
        
        // Link public capability
        let consumerCap = self.account.capabilities.storage.issue<&Consumer>(self.ConsumerStoragePath)
        self.account.capabilities.publish(consumerCap, at: self.ConsumerPublicPath)
    }
}
