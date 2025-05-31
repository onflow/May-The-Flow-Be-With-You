// Test transaction for MemoryVRF contract
import MemoryVRF from "MemoryVRF"

transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        log("🧪 Testing MemoryVRF contract...")
        
        // Create a VRF consumer if one doesn't exist
        if signer.storage.borrow<&MemoryVRF.Consumer>(from: MemoryVRF.ConsumerStoragePath) == nil {
            log("📦 Creating VRF consumer...")
            let consumer <- MemoryVRF.createConsumer()
            signer.storage.save(<-consumer, to: MemoryVRF.ConsumerStoragePath)

            let consumerCap = signer.capabilities.storage.issue<&MemoryVRF.Consumer>(MemoryVRF.ConsumerStoragePath)
            signer.capabilities.publish(consumerCap, at: MemoryVRF.ConsumerPublicPath)
            log("✅ VRF consumer created and published")
        } else {
            log("✅ VRF consumer already exists")
        }

        // Get the consumer reference
        let consumerRef = signer.storage.borrow<&MemoryVRF.Consumer>(from: MemoryVRF.ConsumerStoragePath)!

        // Generate a unique request ID
        let timestamp = getCurrentBlock().timestamp
        let requestId = "test-".concat(timestamp.toString())
        
        log("🎲 Submitting VRF request: ".concat(requestId))

        // Submit a commit for randomness
        let commitValue = "commit-".concat(timestamp.toString())
        consumerRef.submitCommit(requestId: requestId, commitValue: commitValue)
        log("📝 Commit submitted")

        // Submit reveal to generate randomness
        let revealValue: UInt64 = UInt64(timestamp) % 1000000
        consumerRef.submitReveal(requestId: requestId, revealValue: revealValue)
        log("🔓 Reveal submitted with value: ".concat(revealValue.toString()))

        // Get the result
        if let result = consumerRef.getRandomResult(requestId: requestId) {
            log("🎉 Random result generated: ".concat(result.toString()))
            
            // Test the utility function
            let randomInRange = MemoryVRF.randomInRange(seed: result, min: 1, max: 10)
            log("🎯 Random in range [1-10]: ".concat(randomInRange.toString()))
        } else {
            log("❌ No result found")
        }
        
        log("✨ VRF test completed successfully!")
    }
}
