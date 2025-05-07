import "Leaderboard"

transaction() {
    let leaderboardAdmin: auth(Leaderboard.Admin) &Leaderboard.LeaderboardAdmin

    prepare(signer: auth(Storage, Capabilities) &Account) {
      // ------ Initialize the leaderboard if not initialized - Start ------
      let storagePath = Leaderboard.getAdminStoragePath()
      if signer.storage.borrow<&Leaderboard.LeaderboardAdmin>(from: storagePath) == nil{
        signer.storage.save(<-Leaderboard.createAdmin(), to: storagePath)

        // init capabilities
        let adminCapability = signer.capabilities
          .storage.issue<&Leaderboard.LeaderboardAdmin>(storagePath)
        signer.capabilities.publish(adminCapability, at: Leaderboard.getAdminPublicPath())
      }
      // ------ Initialize the leaderboard if not initialized - End ------

      self.leaderboardAdmin = signer.storage.borrow<auth(Leaderboard.Admin) &Leaderboard.LeaderboardAdmin>(from: storagePath)
        ?? panic("Leaderboard admin not found")
    }

    execute {
      // Check if the default checklist is initialized
      let defaultChecklistName = "default"
      let checklistConfigRef = self.leaderboardAdmin.borrowChecklist(defaultChecklistName)
      if checklistConfigRef == nil {
        self.leaderboardAdmin.setChecklist(name: defaultChecklistName, items: {
          "readme-exists": 5,
          "readme-more-than-500-words": 15,
          "readme-more-than-2500-words": 10,
          "includes-flow-json": 5,
          "includes-package-json": 5,
          "includes-frontend-framework": 5,
          "contract-cadence-exists": 10,
          "contract-solidity-exists": 10,
          "use-onflow-fcl": 10,
          "use-onflow-kit": 15,
          "use-onchain-randomness": 15
        })
      }

      // Check if current period is active
      if !self.leaderboardAdmin.isCurrentPeriodActive() {
        // Start a new period
        let now = getCurrentBlock().timestamp
        let oneWeek = UFix64(7 * 24 * 60 * 60)
        self.leaderboardAdmin.startNewPeriod(defaultChecklistName, now, now + oneWeek, 100)
      }
    }
}