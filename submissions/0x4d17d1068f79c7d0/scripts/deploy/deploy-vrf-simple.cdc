transaction {
    prepare(signer: AuthAccount) {
        let contractCode = """
import RandomBeaconHistory from 0x8c5303eaa26202d6

access(all) contract MemoryVRF {
    access(all) event RandomnessRequested(requestId: String, requester: Address, timestamp: UFix64)
    access(all) event RandomnessRevealed(requestId: String, seed: UInt64, blockHeight: UInt64)
    
    access(all) let ConsumerStoragePath: StoragePath
    access(all) let ConsumerPublicPath: PublicPath
    
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
    
    access(all) resource interface ConsumerPublic {
        access(all) fun getRequest(requestId: String): VRFRequest?
        access(all) fun getRandomResult(requestId: String): UInt64?
    }
    
    access(all) resource Consumer: ConsumerPublic {
        access(self) var requests: {String: VRFRequest}
        access(self) var commitSecrets: {String: String}
        
        init() {
            self.requests = {}
            self.commitSecrets = {}
        }
        
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
        
        access(all) fun submitReveal(requestId: String, revealValue: UInt64) {
            pre {
                self.requests[requestId] != nil: "Request not found"
                self.requests[requestId]!.isRevealed == false: "Request already revealed"
            }
            
            let request = self.requests[requestId]!
            let blockHeight = getCurrentBlock().height
            let randomSource = RandomBeaconHistory.sourceOfRandomness(atBlockHeight: blockHeight)
            let combinedSeed = UInt64(randomSource.toBigEndianBytes()[0]) ^ revealValue
            
            request.reveal(seed: combinedSeed, blockHeight: blockHeight)
            self.requests[requestId] = request
            
            emit RandomnessRevealed(
                requestId: requestId,
                seed: combinedSeed,
                blockHeight: blockHeight
            )
        }
        
        access(all) fun getRequest(requestId: String): VRFRequest? {
            return self.requests[requestId]
        }
        
        access(all) fun getRandomResult(requestId: String): UInt64? {
            if let request = self.requests[requestId] {
                return request.seed
            }
            return nil
        }
    }
    
    access(all) fun createConsumer(): @Consumer {
        return <- create Consumer()
    }
    
    access(all) fun getRandomResult(address: Address, requestId: String): UInt64? {
        if let consumerRef = getAccount(address).capabilities.borrow<&Consumer>(MemoryVRF.ConsumerPublicPath) {
            return consumerRef.getRandomResult(requestId: requestId)
        }
        return nil
    }
    
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
        
        let consumer <- create Consumer()
        self.account.storage.save(<-consumer, to: self.ConsumerStoragePath)
        
        let consumerCap = self.account.capabilities.storage.issue<&Consumer>(self.ConsumerStoragePath)
        self.account.capabilities.publish(consumerCap, at: self.ConsumerPublicPath)
    }
}
"""
        
        signer.contracts.add(name: "MemoryVRF", code: contractCode.utf8)
    }
}
