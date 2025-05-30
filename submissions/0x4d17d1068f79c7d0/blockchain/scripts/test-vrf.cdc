// Test transaction for MemoryVRF contract
import MemoryVRF from 0xf8d6e0586b0a20c7

transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Create a VRF consumer if one doesn't exist
        if signer.storage.borrow<&MemoryVRF.Consumer>(from: MemoryVRF.ConsumerStoragePath) == nil {
            let consumer <- MemoryVRF.createConsumer()
            signer.storage.save(<-consumer, to: MemoryVRF.ConsumerStoragePath)

            let consumerCap = signer.capabilities.storage.issue<&MemoryVRF.Consumer>(MemoryVRF.ConsumerStoragePath)
            signer.capabilities.publish(consumerCap, at: MemoryVRF.ConsumerPublicPath)
        }

        // Get the consumer reference
        let consumerRef = signer.storage.borrow<&MemoryVRF.Consumer>(from: MemoryVRF.ConsumerStoragePath)!

        // Submit a commit for randomness
        let requestId = "test-request-1"
        let commitValue = "my-secret-commit"

        consumerRef.submitCommit(requestId: requestId, commitValue: commitValue)

        // Submit reveal to generate randomness
        let revealValue: UInt64 = 12345
        consumerRef.submitReveal(requestId: requestId, revealValue: revealValue)

        // Get the result
        if let result = consumerRef.getRandomResult(requestId: requestId) {
            log("Random result: ".concat(result.toString()))
        } else {
            log("No result found")
        }
    }
}
