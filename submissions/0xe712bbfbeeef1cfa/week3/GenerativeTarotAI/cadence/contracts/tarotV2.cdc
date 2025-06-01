access(all) contract TarotV2 {

    access(all) event CardMinted(cardName: String, owner: Address)

    access(self) var cards: {Address: String}

    init() {
        self.cards = {}
    }

    access(all) fun mintCard(cardName: String, owner: Address) {
    self.cards[owner] = cardName
    emit CardMinted(cardName: cardName, owner: owner)
    }

    access(all) fun getCard(owner: Address): String? {
        return self.cards[owner]
    }
}
