import "Leaderboard"

access(all)
fun main(
  admin: Address,
  periodAlias: String?,
): [Leaderboard.ScoreRecord] {
  if let adminRef = Leaderboard.borrowLeaderboardAdmin(admin) {
    return adminRef.getLeaderboardByPeriodAlias(periodAlias)
  }
  return []
}