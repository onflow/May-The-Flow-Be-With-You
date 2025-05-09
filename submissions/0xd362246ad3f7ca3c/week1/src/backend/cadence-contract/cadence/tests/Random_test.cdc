import Test

access(all) let account = Test.createAccount()

access(all) fun testContract() {
    let err = Test.deployContract(
        name: "Random",
        path: "../contracts/Random.cdc",
        arguments: [],
    )

    Test.expect(err, Test.beNil())
}