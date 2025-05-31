// Test script to verify MemoryVRF contract deployment
import MemoryVRF from "MemoryVRF"

access(all) fun main(account: Address): {String: AnyStruct} {
    // Get account reference
    let accountRef = getAccount(account)

    // Check if consumer exists
    let consumerCap = accountRef.capabilities.get<&MemoryVRF.Consumer>(MemoryVRF.ConsumerPublicPath)
    let hasConsumer = consumerCap.check()

    var result: {String: AnyStruct} = {
        "account": account.toString(),
        "hasConsumer": hasConsumer,
        "contractDeployed": true
    }

    // If consumer exists, get some info
    if hasConsumer {
        if let consumer = consumerCap.borrow() {
            // Try to get a test request (this will likely be nil for new accounts)
            let testResult = consumer.getRandomResult(requestId: "test-request")
            result["testResult"] = testResult?.toString() ?? "No test result"
        }
    }

    return result
}
