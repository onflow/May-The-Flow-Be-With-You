import FrogDash from 0x33fbabd18734ed44
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868


transaction(id:UInt64, amount:UFix64) {
    let user: Address

    prepare(signer: auth(BorrowValue) &Account) {
        self.user = signer.address
    }
    execute{
        FrogDash.claim_reward(id: id, addr: self.user)
    }
}