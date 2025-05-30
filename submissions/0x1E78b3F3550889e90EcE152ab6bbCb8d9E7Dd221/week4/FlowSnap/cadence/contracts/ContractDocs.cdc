access(all) contract ContractDocs {
    // Event for when a new contract documentation is added
    access(all) event ContractDocAdded(contractAddress: Address, docHash: String)
    
    // Event for when a risk assessment is updated
    access(all) event RiskAssessmentUpdated(contractAddress: Address, riskLevel: UInt8)
    
    // Structure to store contract documentation
    access(all) struct ContractDocumentation {
        access(all) let contractAddress: Address
        access(all) let docHash: String
        access(all) let timestamp: UFix64
        access(all) let riskLevel: UInt8
        access(all) let description: String
        
        init(contractAddress: Address, docHash: String, description: String, riskLevel: UInt8) {
            self.contractAddress = contractAddress
            self.docHash = docHash
            self.timestamp = getCurrentBlock().timestamp
            self.description = description
            self.riskLevel = riskLevel
        }
    }
    
    // Dictionary to store contract documentation
    access(all) var contractDocs: {Address: ContractDocumentation}
    
    init() {
        self.contractDocs = {}
    }
    
    // Function to add or update contract documentation
    access(all) fun addContractDoc(contractAddress: Address, docHash: String, description: String, riskLevel: UInt8) {
        let newDoc = ContractDocumentation(
            contractAddress: contractAddress,
            docHash: docHash,
            description: description,
            riskLevel: riskLevel
        )
        
        self.contractDocs[contractAddress] = newDoc
        
        emit ContractDocAdded(contractAddress: contractAddress, docHash: docHash)
        emit RiskAssessmentUpdated(contractAddress: contractAddress, riskLevel: riskLevel)
    }
    
    // Function to get contract documentation
    access(all) fun getContractDoc(contractAddress: Address): ContractDocumentation? {
        return self.contractDocs[contractAddress]
    }
    
    // Function to get all documented contracts
    access(all) fun getAllDocumentedContracts(): [Address] {
        return self.contractDocs.keys
    }
} 