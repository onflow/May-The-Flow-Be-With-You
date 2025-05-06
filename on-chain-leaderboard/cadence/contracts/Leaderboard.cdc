// The contract is used to store the leaderboard data

access(all)
contract Leaderboard {

    // Event emitted when a checklist is submitted
    access(all) event ChecklistSubmitted(
        leaderboard: Address,
        participant: String,
        period: UInt64,
        score: UInt64
    )

    // Admin entitlement
    access(all) entitlement Admin
    access(all) entitlement UserWrite

    // Checklist configuration for a period
    access(all) struct ChecklistConfig {
        access(all) let items: {String: UInt64}

        view init(_ items: {String: UInt64}) {
            self.items = items
        }

        access(all) view
        fun getItems(): {String: UInt64} {
            return self.items
        }

        access(all) view
        fun getItemKeys(): [String] {
            return self.items.keys
        }
    }

    access(all) struct ScoreRecord {
        access(all) let participant: String
        access(all) var score: UInt64

        view init(_ participant: String, _ score: UInt64?) {
            self.participant = participant
            self.score = score ?? 0
        }

        access(contract)
        fun addScore(_ score: UInt64) {
            self.score = self.score + score
        }
    }

    access(all) struct PeriodStatus {
        access(all) let admin: Address
        access(all) let id: UInt
        access(all) let useChecklist: String
        access(all) let startAt: UFix64 
        access(all) let endAt: UFix64
        access(all) let participants: [String]
        access(all) let leaderboard: [ScoreRecord]

        view init(
            _ admin: Address,
            _ id: UInt,
            _ useChecklist: String,
            _ startAt: UFix64,
            _ endAt: UFix64,
        ) {
            self.admin = admin
            self.id = id
            self.useChecklist = useChecklist
            self.startAt = startAt
            self.endAt = endAt
            self.participants = []
            self.leaderboard = []
        }

        access(all) view
        fun isActive(): Bool {
            let now = getCurrentBlock().timestamp
            return self.startAt <= now && self.endAt >= now
        }

        access(all) view
        fun getParticipantAmount(): Int {
            return self.participants.length
        }

        access(contract)
        fun addParticipant(_ participant: String) {
            pre {
                self.isActive(): "Period is not active"
            }
            if self.participants.contains(participant) {
                return
            }
            self.participants.append(participant)
        }

        access(contract)
        fun onParticipantScoreUpdated(_ participant: String) {
            pre {
                self.isActive(): "Period is not active"
            }
            if !self.participants.contains(participant) {
                return
            }
            // TODO: update total score
        }
    }

    // Admin resource, holds all global configuration
    access(all) resource LeaderboardAdmin {
        access(all) let checklists: {String: ChecklistConfig}
        access(all) var currentPeriod: UInt
        access(all) var periods: [PeriodStatus]
        access(all) var leaderboard: [ScoreRecord]

        init() {
            self.checklists = {}
            self.periods = []
            self.currentPeriod = 0
            self.leaderboard = []
        }

        access(Admin)
        fun setChecklist(name: String, items: {String: UInt64}) {
            pre {
                name != "": "Name cannot be empty which is the default checklist"
            }
            self.checklists[name] = ChecklistConfig(items)
        }

        access(Admin)
        fun startNewPeriod(_ useChecklist: String, _ startAt: UFix64, _ endAt: UFix64) {
            pre {
                self.currentPeriod == 0 || (self.currentPeriod > 0 && self.borrowCurrentPeriod()?.isActive() == false): "Current period is still active"
                self.borrowChecklist(useChecklist) != nil: "Checklist not found"
            }
            self.currentPeriod = self.currentPeriod + 1
            self.periods.append(PeriodStatus(
                self.owner?.address ?? panic("Owner not found"),
                UInt(self.currentPeriod),
                useChecklist,
                startAt,
                endAt,
            ))
        }

        access(all) view
        fun isCurrentPeriodActive(): Bool {
            if let period = self.borrowCurrentPeriod() {
                return period.isActive()
            }
            return false
        }

        access(all) view
        fun getChecklistForPeriod(): {String: UInt64} {
            if let period = self.borrowCurrentPeriod() {
                if let config = self.borrowChecklist(period.useChecklist) {
                    return config.getItems()
                }
            }
            return {}
        }

        access(all) view
        fun borrowCurrentPeriod(): &PeriodStatus? {
            if self.currentPeriod == 0 {
                return nil
            }
            return &self.periods[self.currentPeriod - 1] as &PeriodStatus
        }

        access(all) view
        fun borrowPeriod(_ id: UInt): &PeriodStatus? {
            if id > self.currentPeriod {
                return nil
            }
            return &self.periods[id - 1] as &PeriodStatus
        }

        access(all)
        fun generateLeaderboardByPeriod(_ id: UInt): [ScoreRecord] {
            if id == 0 {
                return self.leaderboard
            }
            if let period = self.borrowPeriod(id) {
                let result: [ScoreRecord] = []
                for i, scoreRecord in period.leaderboard {
                    result.append(ScoreRecord(scoreRecord.participant, scoreRecord.score))
                }
                return result
            }
            return []
        }

        access(self) view
        fun borrowChecklist(_ name: String): &ChecklistConfig? {
            return &self.checklists[name]
        }
    }

    access(all) struct UserScore {
        access(all) let admin: Address
        access(all) let period: UInt
        access(all) let participant: String
        access(all) var score: UInt64

        view init(_ admin: Address, _ period: UInt, _ participant: String) {
            self.admin = admin
            self.period = period
            self.participant = participant
            self.score = 0
        }

        access(contract)
        fun addScore(_ score: UInt64) {
            self.score = self.score + score
        }
    }

    // User scoring profile resource
    access(all) resource UserScoringProfile {
        access(all) let id: String
        access(all) let scores: {Address: [UserScore]}

        init(_ id: String) {
            self.id = id
            self.scores = {}
        }

        access(UserWrite)
        fun submitChecklist(_ admin: Address, completed: [String]) {
            let adminRef = Leaderboard.borrowLeaderboardAdmin(admin)
                ?? panic("Admin not found for address: ".concat(admin.toString()))
            let periodRef = adminRef.borrowCurrentPeriod()
                ?? panic("Current period not found")
            
            assert(periodRef.isActive(), message: "Period is not active")

            // TODO: Calculate score
        }

        access(all) view
        fun getTotalScore(_ admin: Address): UInt64 {
            if let scoreRecord = self.borrowUserScore(admin, 0) {
                return scoreRecord.score
            }
            return 0
        }

        access(all) view
        fun getPeriodScore(_ admin: Address, _ period: UInt64): UInt64 {
            pre {
                period > 0: "Period must be greater than 0"
            }
            if let scoreRecord = self.borrowUserScore(admin, period) {
                return scoreRecord.score
            }
            return 0
        }

        access(all) view
        fun borrowUserScore(_ admin: Address, _ period: UInt64): &UserScore? {
            if let scores = self.borrowUserScoreSet(admin) {
                return scores[period]
            }
            return nil
        }

        access(all) view
        fun borrowUserScoreSet(_ admin: Address): &[UserScore]? {
            return &self.scores[admin]
        }
    }

    // ------- Public functions -------

    access(all) view
    fun getPathPrefix(): String {
        return "Leaderboard_".concat(self.account.address.toString())
    }

    access(all) view
    fun getAdminStoragePath(): StoragePath {
        return StoragePath(identifier: self.getPathPrefix().concat("_Admin"))!
    }

    access(all) view
    fun getAdminPublicPath(): PublicPath {
        return PublicPath(identifier: self.getPathPrefix().concat("_Admin"))!
    }

    access(all) view
    fun getUserProfileStoragePath(_ id: String): StoragePath {
        return StoragePath(identifier: self.getPathPrefix().concat("_User_".concat(id)))!
    }

    access(all) view
    fun getUserProfilePublicPath(_ id: String): PublicPath {
        return PublicPath(identifier: self.getPathPrefix().concat("_User_".concat(id)))!
    }

    // Create admin resource
    access(all)
    fun createAdmin(): @LeaderboardAdmin {
        return <- create LeaderboardAdmin()
    }

    access(all) view
    fun borrowLeaderboardAdmin(_ admin: Address): &LeaderboardAdmin? {
        return getAccount(admin).capabilities
            .get<&LeaderboardAdmin>(self.getAdminPublicPath())
            .borrow()
    }

    // User claim score resource
    access(all)
    fun createUserScoringProfile(_ id: String): @UserScoringProfile {
        return <- create UserScoringProfile(id)
    }

    access(all) view
    fun borrowUserScoringProfile(_ user: Address, _ id: String): &UserScoringProfile? {
        return getAccount(user).capabilities
            .get<&UserScoringProfile>(self.getUserProfilePublicPath(id))
            .borrow()
    }
}