import * as fcl from "@onflow/fcl";

export async function createGiftCard(
  recipientAddress: string,
  value: number,
  message: string,
  imageURL: string
) {
  const transactionId = await fcl.mutate({
    cadence: `
      import FungibleToken from 0x9a0766d93b6608b7
      import FlowToken from 0x7e60df042a9c0868
      import GiftCard from 0x2196c8fac03820bf

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

            let giftCardAccount = getAccount(0x2196c8fac03820bf)

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
    `,
    args: (arg: any, t: any) => [
      arg(recipientAddress, t.Address),
      arg(value.toFixed(8), t.UFix64),
      arg(message, t.String),
      arg(imageURL, t.String),
    ],
    payer: fcl.currentUser,
    proposer: fcl.currentUser,
    authorizations: [fcl.currentUser]
  });

  return transactionId;
}

export async function getGiftCardsForAddress(address: string) {
  const result = await fcl.query({
    cadence: `
      import GiftCard from 0x2196c8fac03820bf

      access(all) fun main(address: Address): [GiftCard.GiftCardData] {
          let giftCardAccount = getAccount(0x2196c8fac03820bf)

          let giftCardReference = giftCardAccount
              .capabilities
              .borrow<&{GiftCard.GiftCardPublic}>(GiftCard.GiftCardPublicPath)
              ?? panic("Could not borrow a reference to the GiftCardPublic capability")

          let giftCardData = giftCardReference.getGiftCardsForAddress(address: address)

          return giftCardData
      } 
    `,
    args: (arg: any, t: any) => [arg(address, t.Address)],
  });

  return result;
} 