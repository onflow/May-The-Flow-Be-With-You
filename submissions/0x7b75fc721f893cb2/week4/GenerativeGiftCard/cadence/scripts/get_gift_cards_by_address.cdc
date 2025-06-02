import GiftCard from 0x179b6b1cb6755e31

access(all) fun main(address: Address): [GiftCard.GiftCardData] {
    //let giftCardPublic = getAccount(0x179b6b1cb6755e31)
    //    .getCapability(GiftCard.GiftCardPublicPath)
    //    .borrow<&GiftCard.GiftCardManager{GiftCard.GiftCardPublic}>()
    //    ?? panic("Could not borrow gift card public reference")

    let giftCardAccount = getAccount(0x179b6b1cb6755e31)

    let giftCardReference = giftCardAccount
        .capabilities
        .borrow<&{GiftCard.GiftCardPublic}>(GiftCard.GiftCardPublicPath)
        ?? panic("Could not borrow a reference to the GiftCardPublic capability")

    let giftCardData = giftCardReference.getGiftCardsForAddress(address: address)

    return giftCardData
} 