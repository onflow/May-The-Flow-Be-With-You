import "EggWisdom"

// This transaction is for the admin to create a new phrase struct
// and store it in the EggWisdom smart contract

transaction(
    phrase: String,
    base64Img: String,
    namesOnScreen: [String],
    catsOnScreen: [String],
    background: String) {

    let Admin: &EggWisdom.Admin

    prepare(admin: auth(BorrowValue) &Account) {
        self.Admin = admin.storage.borrow<&EggWisdom.Admin>(from: EggWisdom.AdministratorStoragePath)!
    }
    execute {
        let newCardID = self.Admin.createPhrase(
            phrase: phrase,
            base64Img: base64Img,
            namesOnScreen: namesOnScreen,
            catsOnScreen: catsOnScreen,
            background: background
            )
    }
}