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
        let keyTimestamps = [
          1746316800.0, // 2025-05-04
          1746921600.0, // 2025-05-11
          1747526400.0, // 2025-05-18
          1748131200.0, // 2025-05-25
          1748736000.0 // 2025-06-01
        ]
        // Start a new period
        let now = getCurrentBlock().timestamp
        var startAt = keyTimestamps[0]
        var endAt = keyTimestamps[1]
        var i = 1
        while endAt < now && i < keyTimestamps.length {
          startAt = endAt
          endAt = keyTimestamps[i + 1]
          i = i + 1
        }
        if now < endAt {
          self.leaderboardAdmin.startNewPeriod(defaultChecklistName, startAt, endAt, 100)
        }
      }
    }
}