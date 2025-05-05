// The contract is used to store the leaderboard data

access(all)
contract Leaderboard {

    access(all) entitlement AdminEntitlement

    // Checklist configuration for a period
    access(all) struct ChecklistConfig {
        access(all) let items: {String: UInt}
        init(items: {String: UInt}) {
            self.items = items
        }
    }

    // Admin resource, holds all global configuration
    access(all) resource Admin {
        access(all) var currentPeriod: UInt
        access(all) var periodChecklists: {UInt: ChecklistConfig}

        init() {
            self.currentPeriod = 1
            self.periodChecklists = {}
        }

        access(AdminEntitlement)
        fun setChecklistForPeriod(period: UInt, items: {String: UInt}) {
            self.periodChecklists[period] = ChecklistConfig(items: items)
        }
        access(AdminEntitlement)
        fun startNewPeriod(period: UInt) {
            self.currentPeriod = period
        }
        access(all)
        fun getCurrentPeriod(): UInt {
            return self.currentPeriod
        }
        access(all)
        fun getChecklistForPeriod(period: UInt): {String: UInt} {
            if let config = self.periodChecklists[period] {
                return config.items
            }
            return {}
        }
    }

    // Total leaderboard: address string => total score
    access(all) var totalScores: {String: UInt}

    // Period leaderboard: period => (address string => score)
    access(all) var periodScores: {UInt: {String: UInt}}

    // Event emitted when a checklist is submitted
    access(all) event ChecklistSubmitted(address: String, period: UInt, score: UInt)

    // User score resource
    access(all) resource Score {
        access(all) var totalScore: UInt
        access(all) var periodScores: {UInt: UInt}
        access(all) var submittedChecklists: {UInt: [String]} // Record submitted checklist items for each period

        init() {
            self.totalScore = 0
            self.periodScores = {}
            self.submittedChecklists = {}
        }

        access(all)
        fun submitChecklist(admin: &Admin, completed: [String]) {
            let period = admin.getCurrentPeriod()
            let configItems = admin.getChecklistForPeriod(period: period)
            var score: UInt = 0
            for item in completed {
                if let itemScore = configItems[item] {
                    score = score + itemScore
                }
            }
            self.totalScore = self.totalScore + score
            let prevPeriod = self.periodScores[period] ?? 0
            self.periodScores[period] = prevPeriod + score
            self.submittedChecklists[period] = completed
        }

        access(all)
        fun getTotalScore(): UInt {
            return self.totalScore
        }

        access(all)
        fun getPeriodScore(period: UInt): UInt {
            return self.periodScores[period] ?? 0
        }
    }

    // User claim score resource
    access(all) fun createScoreResource(): @Score {
        return <- create Score()
    }

    // Create admin resource
    access(all) fun createAdmin(): @Admin {
        return <- create Admin()
    }

    init() {
        self.totalScores = {}
        self.periodScores = {}
    }
}