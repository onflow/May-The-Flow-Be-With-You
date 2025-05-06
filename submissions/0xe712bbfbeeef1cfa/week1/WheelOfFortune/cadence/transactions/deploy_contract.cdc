import WheelOfFortune from "../contracts/WheelOfFortune.cdc"

transaction {
    prepare(signer: auth(AddContract) &Account) {
        // Deploy the WheelOfFortune contract
        signer.contracts.add(name: "WheelOfFortune", code: WheelOfFortune.code.toBytes())
    }
} 