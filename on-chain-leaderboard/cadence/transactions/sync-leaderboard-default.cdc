import "Leaderboard"

transaction() {
    let leaderboardAdmin: auth(Leaderboard.Admin) &Leaderboard.LeaderboardAdmin

    prepare(signer: auth(Storage, Capabilities) &Account) {
      let storagePath = Leaderboard.getAdminStoragePath()
      self.leaderboardAdmin = signer.storage.borrow<auth(Leaderboard.Admin) &Leaderboard.LeaderboardAdmin>(from: storagePath)
        ?? panic("Leaderboard admin not found")
    }

    execute {
      // Check if the default checklist is initialized
      let defaultChecklistName = "default"

      // Check if current period is active
      if !self.leaderboardAdmin.isCurrentPeriodActive() {
        // Start a new period
        let now = getCurrentBlock().timestamp
        let oneWeek = UFix64(7 * 24 * 60 * 60)
        self.leaderboardAdmin.startNewPeriod(defaultChecklistName, now, now + oneWeek, 100)
      }
    }
}