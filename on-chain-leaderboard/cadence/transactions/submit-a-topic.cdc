import "Leaderboard"

transaction(
  admin: Address,
  userId: String,
  periodAlias: String,
  topic: String,
  completed: [String]
) {
    let userProfile: auth(Leaderboard.UserWrite) &Leaderboard.UserScoringProfile

    prepare(signer: auth(Storage, Capabilities) &Account) {
      // ------ Initialize the leaderboard if not initialized - Start ------
      let storagePath = Leaderboard.getUserProfileStoragePath(userId)
      if signer.storage.borrow<&Leaderboard.UserScoringProfile>(from: storagePath) == nil{
        signer.storage.save(<-Leaderboard.createUserScoringProfile(userId), to: storagePath)

        // init capabilities
        let cap = signer.capabilities
          .storage.issue<&Leaderboard.UserScoringProfile>(storagePath)
        signer.capabilities.publish(cap, at: Leaderboard.getUserProfilePublicPath(userId))
      }
      // ------ Initialize the leaderboard if not initialized - End ------

      self.userProfile = signer.storage.borrow<auth(Leaderboard.UserWrite) &Leaderboard.UserScoringProfile>(from: storagePath)
        ?? panic("User profile not found")
    }

    execute {
      // Check if the topic is already submitted
      if let isSubmitted = self.userProfile.isTopicSubmitted(admin, periodAlias, topic) {
        if isSubmitted {
          panic("Topic already submitted")
        }
      } else {
        panic("No admin or period alias not found")
      }

      // Check if the period is active
      let adminRef = Leaderboard.borrowLeaderboardAdmin(admin)
        ?? panic("Admin not found for address: ".concat(admin.toString()))
      let periodRef = adminRef.borrowPeriodByName(periodAlias)
        ?? panic("Period not found: ".concat(periodAlias))

      // assert(periodRef.isActive(), message: "Period is not active")
      
      // Submit the topic
      self.userProfile.submitChecklist(admin, periodId: periodRef.id, topic: topic, completed: completed)
    }
}