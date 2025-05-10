import "Random"

transaction {

    prepare(acct: &Account) {
        // Authorizes the transaction
    }

    execute {
        // Generate a new random number
        Random.generate()

        // Retrieve the generated random number and log it
        let newRandom = Random.getLastRandom()
        log("New random number generated: ".concat(newRandom.toString()))
    }
}