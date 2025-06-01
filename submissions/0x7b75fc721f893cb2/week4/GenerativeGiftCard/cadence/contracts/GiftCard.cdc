import "FungibleToken"
import "FlowToken"

access(all) contract GiftCard {
    // Events
    access(all) event GiftCardCreated(id: UInt64, recipient: Address, value: UFix64)
    access(all) event GiftCardWithdrawn(id: UInt64, recipient: Address, value: UFix64)

    // Status enum for gift cards
    access(all) enum Status: UInt8 {
        access(all) case allocated 
        access(all) case withdrawn
    }       

    // Gift card struct to store all gift card data
    access(all) struct GiftCardData {
        access(all) let id: UInt64
        access(all) let value: UFix64
        access(all) let message: String
        access(all) let imageURL: String
        access(all) var status: Status
        access(all) let recipient: Address

        init(
            id: UInt64,
            value: UFix64,
            message: String,
            imageURL: String,
            recipient: Address
        ) {
            self.id = id
            self.value = value
            self.message = message
            self.imageURL = imageURL
            self.status = Status.allocated
            self.recipient = recipient
        }

        access(all) fun markAsWithdrawn() {
            self.status = Status.withdrawn
        }
    }

    // Storage paths
    access(all) let GiftCardStoragePath: StoragePath
    access(all) let GiftCardPublicPath: PublicPath

    // Contract state
    access(self) var giftCards: @{UInt64: FlowToken.Vault}
    access(self) var giftCardData: {UInt64: GiftCardData}
    access(self) var nextGiftCardID: UInt64
    access(self) var recipientGiftCards: {Address: [UInt64]}

    access(all) resource interface GiftCardPublic {
        access(all) fun getGiftCardsForAddress(address: Address): [GiftCardData]
        access(all) fun getGiftCardById(id: UInt64): GiftCardData?
        access(all) fun createGiftCard(
            recipient: Address,
            value: UFix64,
            message: String,
            imageURL: String,
            payment: @{FungibleToken.Vault}
        )
        access(all) fun withdrawGiftCard(id: UInt64): @{FungibleToken.Vault}
    }

    access(all) resource GiftCardManager: GiftCardPublic {
        // Create a new gift card
        access(all) fun createGiftCard(
            recipient: Address,
            value: UFix64,
            message: String,
            imageURL: String,
            payment: @{FungibleToken.Vault}
        ) {
            pre {
                payment.balance == value: "Payment value must match gift card value"
            }

            let id = GiftCard.nextGiftCardID

            // Store the vault
            GiftCard.giftCards[id] <-! payment as! @FlowToken.Vault

            // Create and store the gift card data
            let giftCardData = GiftCardData(
                id: id,
                value: value,
                message: message,
                imageURL: imageURL,
                recipient: recipient
            )
            GiftCard.giftCardData[id] = giftCardData

            // Add to recipient's gift cards
            if GiftCard.recipientGiftCards[recipient] == nil {
                GiftCard.recipientGiftCards[recipient] = []
            }
            GiftCard.recipientGiftCards[recipient]!.append(id)

            // Increment the ID counter
            GiftCard.nextGiftCardID = GiftCard.nextGiftCardID + 1

            emit GiftCardCreated(id: id, recipient: recipient, value: value)
        }

        // Withdraw a gift card
        access(all) fun withdrawGiftCard(id: UInt64): @{FungibleToken.Vault} {
            pre {
                GiftCard.giftCards[id] != nil: "Gift card does not exist"
                GiftCard.giftCardData[id] != nil: "Gift card data does not exist"
                GiftCard.giftCardData[id]!.status == Status.allocated: "Gift card has already been withdrawn"
            }

            let giftCardData = &GiftCard.giftCardData[id]! as &GiftCardData
            giftCardData.markAsWithdrawn()

            let vault <- GiftCard.giftCards.remove(key: id)!
            emit GiftCardWithdrawn(id: id, recipient: giftCardData.recipient, value: giftCardData.value)
            
            return <-vault
        }

        access(all) fun getGiftCardsForAddress(address: Address): [GiftCardData] {
            if let ids = GiftCard.recipientGiftCards[address] {
                let giftCards: [GiftCardData] = []
                for id in ids {
                    if let data = GiftCard.giftCardData[id] {
                        giftCards.append(data)
                    }
                }
                return giftCards
            }
            return []
        }

        access(all) fun getGiftCardById(id: UInt64): GiftCardData? {
            return GiftCard.giftCardData[id]
        }
    }

    init() {
        self.GiftCardStoragePath = /storage/GiftCardManager
        self.GiftCardPublicPath = /public/GiftCardManager

        self.giftCards <- {}
        self.giftCardData = {}
        self.nextGiftCardID = 1
        self.recipientGiftCards = {}

        // Create admin resource
        let manager <- create GiftCardManager()
        
        // Save the manager resource to storage using the new syntax
        self.account.storage.save(<-manager, to: self.GiftCardStoragePath)
        
        // Create public capability with proper type restriction
        //self.account.capabilities.publish(
        //    self.account.capabilities.storage.borrow<&{GiftCardPublic}>(
        //        from: self.GiftCardStoragePath
        //    ) ?? panic("Could not borrow GiftCardManager reference"),
        //    at: self.GiftCardPublicPath
        //)

        let managerCap = self.account.capabilities.storage.issue<&{GiftCard.GiftCardPublic}>(self.GiftCardStoragePath)
        self.account.capabilities.publish(managerCap, at: self.GiftCardPublicPath)
    }
} 