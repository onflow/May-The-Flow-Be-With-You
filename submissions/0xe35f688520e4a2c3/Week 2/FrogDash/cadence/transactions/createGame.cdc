import FrogDash from 0x33fbabd18734ed44

transaction() {
    let adminRef: &FrogDash.Admin

    prepare(signer: auth(BorrowValue) &Account) {
        self.adminRef = signer.storage.borrow<&FrogDash.Admin>(from: /storage/FrogDashStorage)
            ?? panic("Object not found")
    }

    execute {
        self.adminRef.create_game()
    }
}