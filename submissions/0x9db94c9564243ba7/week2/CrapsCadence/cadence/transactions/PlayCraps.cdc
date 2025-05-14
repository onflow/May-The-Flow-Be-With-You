import "OnchainCraps"

transaction {

    var crapsGameRef: &OnchainCraps.Game?

    prepare(acct: auth(BorrowValue, SaveValue) &Account) {
        self.crapsGameRef = acct.storage.borrow<&OnchainCraps.Game>(from: OnchainCraps.GameStoragePath)

        if(self.crapsGameRef == nil) {
            log("new account")
            acct.storage.save(<-OnchainCraps.createDiceGame(), to: OnchainCraps.GameStoragePath)
            self.crapsGameRef = acct.storage.borrow<&OnchainCraps.Game>(from: OnchainCraps.GameStoragePath)
        }
    }

    execute {
        self.crapsGameRef?.rollDice() ?? panic("cannot access onchain dice resource")
    }
}