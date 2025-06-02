import FungibleToken from 0xee82856bf20e2aa6
import FlowToken from 0x0ae53cb6e3f42a79
import GiftCard from 0x179b6b1cb6755e31

transaction(giftCardId: UInt64) {
    let giftCardManager: &{GiftCard.GiftCardPublic}
    let recipientCapability: &{FungibleToken.Receiver}

    prepare(signer: auth(BorrowValue, Storage) &Account) {
        let giftCardAccount = getAccount(0x179b6b1cb6755e31)
        // Get the gift card manager
        self.giftCardManager = giftCardAccount
            .capabilities
            .borrow<&{GiftCard.GiftCardPublic}>(GiftCard.GiftCardPublicPath)
            ?? panic("Could not borrow a reference to the GiftCardPublic capability")

        self.recipientCapability = signer
            .capabilities.borrow<&{FungibleToken.Receiver}>(
                /public/flowTokenReceiver
            ) ?? panic("Could not borrow recipient's FlowToken Receiver capability.")
    }

    execute {
        // Withdraw the gift card and deposit the tokens
        let withdrawnVault <- self.giftCardManager.withdrawGiftCard(id: giftCardId)

        // Deposit the withdrawn tokens into the recipient's vault
        self.recipientCapability.deposit(from: <-withdrawnVault)
    }
} 