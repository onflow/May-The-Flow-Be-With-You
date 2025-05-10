import "EggWisdom"


/// Retrieves the saved Receipt and redeems it to reveal the cards
///
transaction(amount: Int) {

    prepare(signer: auth(BorrowValue, LoadValue) &Account) {
        // get ref to ReceiptStorage
        let storageRef = signer.storage.borrow<&EggWisdom.EggStorage>(from: EggWisdom.EggStoragePath)
            ?? panic("Cannot borrow a reference to the recipient's EggWisdom EggStorage")


        var counter = 0
        
        while counter < amount {
            // Load my receipt from storage
            let receipt <- storageRef.withdraw()

            // Reveal by redeeming my receipt - fingers crossed!
            EggWisdom.revealPhrase(receipt: <- receipt, minter: signer.address)

            counter = counter + 1
        }
    }
}