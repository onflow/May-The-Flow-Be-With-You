import ContractDocs from "../contracts/ContractDocs.cdc"

transaction(contractAddress: Address, docHash: String, description: String, riskLevel: UInt8) {
    prepare(signer: &Account) {
        // Get the ContractDocs reference
        let cap = getAccount(0x01).capabilities.get<&ContractDocs>(/public/ContractDocs)
        let contractRef = cap.borrow()
            ?? panic("Could not borrow ContractDocs reference")
        
        // Add the contract documentation
        contractRef.addContractDoc(
            contractAddress: contractAddress,
            docHash: docHash,
            description: description,
            riskLevel: riskLevel
        )
    }
} 