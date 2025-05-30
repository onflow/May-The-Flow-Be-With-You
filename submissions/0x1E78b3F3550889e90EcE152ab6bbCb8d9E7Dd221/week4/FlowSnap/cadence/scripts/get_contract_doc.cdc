import ContractDocs from "../contracts/ContractDocs.cdc"

access(all) fun main(contractAddress: Address): ContractDocs.ContractDocumentation? {
    let cap = getAccount(0x01).capabilities.get<&ContractDocs>(/public/ContractDocs)
    let contractRef = cap.borrow()
        ?? panic("Could not borrow ContractDocs reference")
    
    return contractRef.getContractDoc(contractAddress: contractAddress)
} 