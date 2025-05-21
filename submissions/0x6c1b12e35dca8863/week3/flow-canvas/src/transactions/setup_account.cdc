// setup_account.cdc
import FlowCanvas from 0x01 // Replace with your actual contract address when deployed
import NonFungibleToken from 0x631e88ae7f1d7c20 // Testnet address

transaction {
    prepare(signer: AuthAccount) {
        // Return early if the account already has a collection
        if signer.borrow<&FlowCanvas.Collection>(from: FlowCanvas.CollectionStoragePath) != nil {
            return
        }
        
        // Create a new empty collection
        let collection <- FlowCanvas.createEmptyCollection()
        
        // Save it to the account
        signer.save(<-collection, to: FlowCanvas.CollectionStoragePath)
        
        // Create a public capability for the collection
        signer.link<&{NonFungibleToken.CollectionPublic, FlowCanvas.FlowCanvasCollectionPublic}>(
            FlowCanvas.CollectionPublicPath,
            target: FlowCanvas.CollectionStoragePath
        )
        
        log("FlowCanvas Collection created for account")
    }
}