access(all) contract Random {

    access(all) var lastRandom: UInt64

    access(all) event RandomNumberGenerated(randomNumber: UInt64)

    init() {
        self.lastRandom = 0
    }

    access(all) fun generate() {
        let rand: UInt64 = revertibleRandom<UInt64>() % 50
        self.lastRandom = rand
        emit RandomNumberGenerated(randomNumber: rand)
    }
    
    view access(all) fun getLastRandom(): UInt64 {
        return self.lastRandom
    }
}
