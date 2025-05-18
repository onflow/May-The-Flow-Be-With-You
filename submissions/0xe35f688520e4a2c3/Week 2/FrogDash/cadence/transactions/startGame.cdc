import FrogDash from 0x34a43e3b12517b72

transaction(id:UInt64) {
    let user: Address
    prepare(signer: &Account) {
    self.user = signer.address
    }

    execute {
        FrogDash.start_game(id: id, addr: self.user)
    }
}