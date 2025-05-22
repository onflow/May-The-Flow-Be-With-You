import IdentitySystem from "../contracts/IdentitySystem.cdc"

transaction {
    prepare(signer: auth(AddContract) &Account) {
        signer.contracts.add(name: "IdentitySystem", code: IdentitySystem.code)
    }
} 