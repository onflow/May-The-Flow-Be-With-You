// The contract is used to store the leaderboard data

access(all)
contract Leaderboard {
    // Entitlements
    access(all) entitlement Admin
    access(all) entitlement UserWrite

    // Event emitted when a checklist is submitted
    access(all) event ChecklistSubmitted(
        admin: Address,
        userOwner: Address,
        participantId: String,
        period: UInt64,
        scoreAdded: UFix64,
        scoreTotal: UFix64
    )

    access(all) event PeriodAliasSet(
        admin: Address,
        periodName: String,
        periodId: UInt64
    )

    // Event emitted when a period is started
    access(all) event PeriodStarted(
        admin: Address,
        periodId: UInt64,
        useChecklist: String,
        startAt: UFix64,
        endAt: UFix64,
        leaderboardLimit: Int
    )

    // Event emitted when checklist is added to leaderboard
    access(all) event ChecklistAdded(
        admin: Address,
        checklistName: String,
        checklistItems: {String: UInt64}
    )

    // Event emitted when a participant enters the leaderboard
    access(all) event LeaderboardEntered(
        admin: Address,
        participantId: String,
        periodId: UInt64,
        rank: Int,
        score: UFix64
    )

    // Event emitted when a participant leaves the leaderboard
    access(all) event LeaderboardLeft(
        admin: Address,
        participantId: String,
        periodId: UInt64,
        score: UFix64
    )

    // -------- Structs and resources --------

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

        access(all) view
        fun getItemValue(_ key: String): UInt64? {
            return self.items[key]
        }

        access(all) view
        fun getTotalWeight(): UFix64 {
            var totalWeight: UFix64 = 0.0
            for key in self.items.keys {
                if let value = self.getItemValue(key) {
                    totalWeight = totalWeight + UFix64(value)
                }
            }
            return totalWeight
        }

        access(all)
        fun forEachItem(_ f: fun (String): Bool): Void {
            self.items.forEachKey(f)
        }
    }

    access(all) struct ScoreRecord {
        access(all) let participant: String
        access(all) var score: UFix64

        view init(_ participant: String, _ score: UFix64?) {
            self.participant = participant
            self.score = score ?? 0.0
        }

        access(contract)
        fun updateScore(_ score: UFix64) {
            self.score = score
        }
    }

    access(all) struct LeaderboardRecord {
        access(all) let list: [ScoreRecord]
        access(all) let limit: Int

        view init(_ list: [ScoreRecord], _ limit: Int) {
            self.list = list
            self.limit = limit
        }

        access(contract)
        fun onParticipantScoreUpdated(_ userScoreRef: &UserScore) {
            let periodId = userScoreRef.period
            let adminAddress = userScoreRef.admin
            let uid = adminAddress.toString().concat("_").concat(userScoreRef.participant)

            log("onParticipantScoreUpdated - Start - ".concat(uid))
            // remove the address from the top 100
            let listRef = &self.list as &[ScoreRecord]
            var foundIdx = -1
            for i, item in listRef {
                if item.participant == userScoreRef.participant {
                    foundIdx = i
                    break
                }
            }
            let score = userScoreRef.score
            let theUpdatedScoreRecord = foundIdx != -1
                ? listRef.remove(at: foundIdx)
                : ScoreRecord(userScoreRef.participant, 0.0)
            // update the latest score
            theUpdatedScoreRecord.updateScore(score)

            // now address is not in the top, we need to check score and insert it
            var highScoreIdx = 0
            var lowScoreIdx = listRef.length - 1
            // use binary search to find the position
            while lowScoreIdx >= highScoreIdx {
                let midIdx = (lowScoreIdx + highScoreIdx) / 2
                let midScore = listRef[midIdx].score
                // find the position
                if score > midScore {
                    lowScoreIdx = midIdx - 1
                } else if score < midScore {
                    highScoreIdx = midIdx + 1
                } else {
                    break
                }
            }

            // insert the record
            if highScoreIdx < self.limit {
                listRef.insert(at: highScoreIdx, theUpdatedScoreRecord)

                emit LeaderboardEntered(
                    admin: adminAddress,
                    participantId: theUpdatedScoreRecord.participant,
                    periodId: periodId,
                    rank: highScoreIdx,
                    score: theUpdatedScoreRecord.score
                )
            }

            log("onParticipantScoreUpdated - End - ".concat(uid)
                .concat(" score: ").concat(score.toString())
                .concat(" rank: ").concat(highScoreIdx.toString()))

            // remove the last one if the length is greater than 100
            if listRef.length > self.limit {
                let removed = listRef.removeLast()

                emit LeaderboardLeft(
                    admin: adminAddress,
                    participantId: removed.participant,
                    periodId: periodId,
                    score: removed.score
                )
            }
        }
    }

    access(all) struct PeriodStatus {
        access(all) let admin: Address
        access(all) let id: UInt64
        access(all) let useChecklist: String
        access(all) let startAt: UFix64 
        access(all) let endAt: UFix64
        access(all) let participants: [String]
        access(all) let leaderboard: LeaderboardRecord

        view init(
            _ admin: Address,
            _ id: UInt64,
            _ useChecklist: String,
            _ startAt: UFix64,
            _ endAt: UFix64,
            _ leaderboardLimit: Int
        ) {
            self.admin = admin
            self.id = id
            self.useChecklist = useChecklist
            self.startAt = startAt
            self.endAt = endAt
            self.participants = []
            self.leaderboard = LeaderboardRecord([], leaderboardLimit)
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
    }

    // Admin resource, holds all global configuration
    access(all) resource LeaderboardAdmin {
        access(all) let checklists: {String: ChecklistConfig}
        access(all) var currentPeriod: UInt64
        access(all) let periods: [PeriodStatus]
        access(all) let periodAlias: {String: UInt64}
        access(all) let leaderboard: LeaderboardRecord

        init() {
            self.checklists = {}
            self.periods = []
            self.periodAlias = {}
            self.currentPeriod = 0
            self.leaderboard = LeaderboardRecord([], 100)
        }

        access(Admin)
        fun setChecklist(name: String, items: {String: UInt64}) {
            pre {
                name != "": "Name cannot be empty which is the default checklist"
            }
            self.checklists[name] = ChecklistConfig(items)

            let adminAddress = self.owner?.address ?? panic("Owner not found")
            emit ChecklistAdded(
                admin: adminAddress,
                checklistName: name,
                checklistItems: items
            )
        }

        access(Admin)
        fun setPeriodAlias(_ name: String, _ id: UInt64) {
            self.periodAlias[name] = id

            let adminAddress = self.owner?.address ?? panic("Owner not found")
            emit PeriodAliasSet(
                admin: adminAddress,
                periodName: name,
                periodId: id
            )
        }

        access(Admin)
        fun startNewPeriod(_ useChecklist: String, _ startAt: UFix64, _ endAt: UFix64, _ leaderboardLimit: Int) {
            pre {
                self.currentPeriod == 0 || (self.currentPeriod > 0 && self.borrowCurrentPeriod()?.isActive() == false): "Current period is still active"
                self.borrowChecklist(useChecklist) != nil: "Checklist not found"
            }
            self.currentPeriod = self.currentPeriod + 1

            let adminAddress = self.owner?.address ?? panic("Owner not found")

            self.periods.append(PeriodStatus(
                adminAddress,
                UInt64(self.currentPeriod),
                useChecklist,
                startAt,
                endAt,
                leaderboardLimit
            ))

            emit PeriodStarted(
                admin: adminAddress,
                periodId: UInt64(self.currentPeriod),
                useChecklist: useChecklist,
                startAt: startAt,
                endAt: endAt,
                leaderboardLimit: leaderboardLimit
            )
        }

        access(all) view
        fun isCurrentPeriodActive(): Bool {
            if let period = self.borrowCurrentPeriod() {
                return period.isActive()
            }
            return false
        }

        access(all) view
        fun getChecklistForCurrentPeriod(): {String: UInt64} {
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
        fun borrowPeriod(_ id: UInt64): &PeriodStatus? {
            if id > self.currentPeriod {
                return nil
            }
            return &self.periods[id - 1] as &PeriodStatus
        }

        access(all) view
        fun borrowPeriodByName(_ name: String): &PeriodStatus? {
            if let id = self.periodAlias[name] {
                return self.borrowPeriod(id)
            }
            return nil
        }

        access(all)
        fun getLeaderboardByPeriod(_ id: UInt64): [ScoreRecord] {
            if id == 0 {
                return self.leaderboard.list
            }
            if let period = self.borrowPeriod(id) {
                let result: [ScoreRecord] = []
                for i, scoreRecord in period.leaderboard.list {
                    result.append(ScoreRecord(scoreRecord.participant, scoreRecord.score))
                }
                return result
            }
            return []
        }

        access(contract)
        fun onParticipantScoreUpdated(_ owner: Address, _ participant: String) {
            let userScoreProfileRef = Leaderboard.borrowUserScoringProfile(owner, participant)
                ?? panic("User score profile not found")
            
            let adminAddress = self.owner?.address ?? panic("Owner not found")
            // update in global leaderboard
            let totalScoreRef = userScoreProfileRef.borrowUserScore(adminAddress, 0)
                ?? panic("Total score not found")
            self.leaderboard.onParticipantScoreUpdated(totalScoreRef)

            // update in period leaderboard
            let periodScoreRef = userScoreProfileRef.borrowUserScore(adminAddress, self.currentPeriod)
                ?? panic("Period score not found")
            let periodRef = self.borrowPeriod(self.currentPeriod)
                ?? panic("Period not found")
            periodRef.leaderboard.onParticipantScoreUpdated(periodScoreRef)

            // add participant to period
            periodRef.addParticipant(participant)
        }

        access(self) view
        fun borrowChecklist(_ name: String): &ChecklistConfig? {
            return &self.checklists[name]
        }
    }

    access(contract)
    fun updateLeaderboard(list: auth(Mutate) &[ScoreRecord], limit: Int, newUpdatedScore: &UserScore) {
    }

    access(all) struct UserScore {
        access(all) let admin: Address
        access(all) let period: UInt64
        access(all) let participant: String
        access(all) let submittedTopics: [String]
        access(all) var score: UFix64

        view init(_ admin: Address, _ period: UInt64, _ participant: String) {
            self.admin = admin
            self.period = period
            self.participant = participant
            self.score = 0.0
            self.submittedTopics = []
        }

        access(contract)
        fun addScore(_ topic: String, _ score: UFix64) {
            pre {
                !self.isTopicSubmitted(topic): "Topic already submitted"
            }
            self.submittedTopics.append(topic)
            self.score = self.score + score
        }

        access(all) view
        fun isTopicSubmitted(_ topic: String): Bool {
            return self.submittedTopics.contains(topic)
        }
    }

    // User scoring profile resource
    access(all) resource UserScoringProfile {
        access(all) let id: String
        access(all) let scores: {Address: {UInt64: UserScore}}

        init(_ id: String) {
            self.id = id
            self.scores = {}
        }

        access(UserWrite)
        fun submitChecklist(_ admin: Address, topic: String, completed: [String]) {
            let adminRef = Leaderboard.borrowLeaderboardAdmin(admin)
                ?? panic("Admin not found for address: ".concat(admin.toString()))
            let periodRef = adminRef.borrowCurrentPeriod()
                ?? panic("Current period not found")
            
            assert(periodRef.isActive(), message: "Period is not active")

            // Check if the topic is valid
            let scoreRecordRef = self.borrowAndEnsureUserScore(admin, periodRef.id, self.id)
            assert(!scoreRecordRef.isTopicSubmitted(topic), message: "Topic already submitted")

            let totalScoreRef = self.borrowAndEnsureUserScore(admin, 0, self.id)
            let topicInGlobal = periodRef.id.toString().concat("_").concat(topic)
            assert(!totalScoreRef.isTopicSubmitted(topicInGlobal), message: "Topic already submitted in global leaderboard")

            // get checklist config
            let checklistRef = adminRef.borrowChecklist(periodRef.useChecklist)
                ?? panic("Checklist not found")

            let totalWeight: UFix64 = checklistRef.getTotalWeight()
            var completedWeight: UFix64 = 0.0
            for item in completed {
                if let value = checklistRef.getItemValue(item) {
                    completedWeight = completedWeight + UFix64(value)
                }
            }
            // Max score for each submission is 10
            let score = completedWeight / totalWeight * 10.0
            // Add score to user profile
            scoreRecordRef.addScore(topic, score)
            // Add score to global leaderboard
            totalScoreRef.addScore(topicInGlobal, score)

            // Inform the admin that the score has been updated
            let owner = self.owner?.address ?? panic("Owner not found")
            adminRef.onParticipantScoreUpdated(owner, self.id)

            // Emit event
            emit ChecklistSubmitted(
                admin: admin,
                userOwner: owner,
                participantId: self.id,
                period: periodRef.id,
                scoreAdded: score,
                scoreTotal: scoreRecordRef.score
            )
        }

        access(all) view
        fun isTopicSubmitted(_ admin: Address, _ periodAlias: String, _ topic: String): Bool? {
            if let adminRef = Leaderboard.borrowLeaderboardAdmin(admin) {
                if let periodRef = adminRef.borrowPeriodByName(periodAlias) {
                    if let scoreRecordRef = self.borrowUserScore(admin, periodRef.id) {
                        return scoreRecordRef.isTopicSubmitted(topic)
                    } else {
                        return false
                    }
                }
            }
            return nil
        }

        access(all) view
        fun getTotalScore(_ admin: Address): UFix64 {
            if let scoreRecord = self.borrowUserScore(admin, 0) {
                return scoreRecord.score
            }
            return 0.0
        }

        access(all) view
        fun getPeriodScore(_ admin: Address, _ period: UInt64): UFix64 {
            pre {
                period > 0: "Period must be greater than 0"
            }
            if let scoreRecord = self.borrowUserScore(admin, period) {
                return scoreRecord.score
            }
            return 0.0
        }

        access(all) view
        fun borrowUserScore(_ admin: Address, _ period: UInt64): &UserScore? {
            if let scores = self.borrowUserScoreSet(admin) {
                if let score = scores[period] {
                    return score
                }
            }
            return nil
        }

        access(self)
        fun borrowAndEnsureUserScore(_ admin: Address, _ period: UInt64, _ participant: String): &UserScore {
            var scores = self.borrowUserScoreSet(admin)
            if scores == nil {
                self.scores[admin] = {}
                scores = self.borrowUserScoreSet(admin)
            }

            let set = scores ?? panic("User score set not found")
            var score = set[period]
            if score == nil {
                set[period] = UserScore(admin, period, participant)
                score = self.borrowUserScore(admin, period)
            }

            return score ?? panic("User score not found")
        }

        access(self) view
        fun borrowUserScoreSet(_ admin: Address): auth(Mutate) &{UInt64: UserScore}? {
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