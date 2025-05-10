access(all) contract WheelOfFortuneV2 {

    access(all) event WheelSpun(player: Address, prize: String, timestamp: UFix64)

    access(all) struct WheelSegment {
        access(all) let prize: String
        access(all) let weight: UInt32

        init(prize: String, weight: UInt32) {
            self.prize = prize
            self.weight = weight
        }
    }

    access(all) var segments: [WheelSegment]

    init() {
        self.segments = [
            WheelSegment(prize: "100 FLOW", weight: 5),
            WheelSegment(prize: "50 FLOW", weight: 10),
            WheelSegment(prize: "25 FLOW", weight: 15),
            WheelSegment(prize: "10 FLOW", weight: 20),
            WheelSegment(prize: "5 FLOW", weight: 25),
            WheelSegment(prize: "Try Again", weight: 25)
        ]
    }

    access(all) fun spinWheel(caller: Address): String {
        let randomNumber = self.getRandomNumber()

        var totalWeight: UInt32 = 0
        for segment in self.segments {
            totalWeight = totalWeight + segment.weight
        }

        var currentWeight: UInt32 = 0
        for segment in self.segments {
            currentWeight = currentWeight + segment.weight
            if randomNumber <= currentWeight {
                emit WheelSpun(player: caller, prize: segment.prize, timestamp: getCurrentBlock().timestamp)
                return segment.prize
            }
        }

        return "Try Again"
    }

    access(self) fun getRandomNumber(): UInt32 {
        let randomNumber = UInt32(getCurrentBlock().timestamp)
        return randomNumber % 100
    }
}
