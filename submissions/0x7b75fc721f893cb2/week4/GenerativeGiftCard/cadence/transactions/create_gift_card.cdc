import FungibleToken from 0xee82856bf20e2aa6
import FlowToken from 0x0ae53cb6e3f42a79
import GiftCard from 0x179b6b1cb6755e31

transaction(recipient: Address, value: UFix64, message: String, imageURL: String) {
    let paymentVault: @{FungibleToken.Vault}
    let giftCardManager: &{GiftCard.GiftCardPublic}

    prepare(signer: auth(BorrowValue, Storage) &Account) {
        // Get the payment vault
        //let vaultRef = signer.capabilities.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
        //    ?? panic("Could not borrow Flow token vault reference")
        
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("The signer does not store a FlowToken Vault object at the path "
                    .concat("/storage/flowTokenVault. ")
                    .concat("The signer must initialize their account with this vault first!"))

        self.paymentVault <- vaultRef.withdraw(amount: value)

        let giftCardAccount = getAccount(0x179b6b1cb6755e31)

        self.giftCardManager = giftCardAccount
            .capabilities
            .borrow<&{GiftCard.GiftCardPublic}>(GiftCard.GiftCardPublicPath)
            ?? panic("Could not borrow a reference to the GiftCardPublic capability")
    }

    execute {
        self.giftCardManager.createGiftCard(
            recipient: recipient,
            value: value,
            message: message,
            imageURL: imageURL,
            payment: <-self.paymentVault
        )
    }
} 