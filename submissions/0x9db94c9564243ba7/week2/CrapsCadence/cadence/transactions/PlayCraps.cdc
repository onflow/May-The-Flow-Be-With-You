import "OnchainCraps"

transaction(betName: String, amount: UFix64) {

    var crapsGameRef: &OnchainCraps.Game?
    let accountAddress: Address

    prepare(acct: auth(BorrowValue, SaveValue) &Account) {
        self.crapsGameRef = acct.storage.borrow<&OnchainCraps.Game>(from: OnchainCraps.GameStoragePath)
        self.accountAddress = acct.address

        if(self.crapsGameRef == nil) {
            acct.storage.save(<-OnchainCraps.createDiceGame(), to: OnchainCraps.GameStoragePath)
            self.crapsGameRef = acct.storage.borrow<&OnchainCraps.Game>(from: OnchainCraps.GameStoragePath)
        }
    }

    execute {
        let bets = { betName : amount}
        let result = self.crapsGameRef?.rollDice(userAddress: self.accountAddress, newBets: bets ) ?? panic("cannot access onchain dice resource")
        log(result)
    }
}