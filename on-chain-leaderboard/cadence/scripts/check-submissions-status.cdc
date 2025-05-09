import "Leaderboard"

access(all) struct TopicResult {
  access(all) let admin: Address
  access(all) let periodAlias: String
  access(all) let topic: String
  access(all) let isSubmitted: Bool

  init(_ admin: Address, _ periodAlias: String, _ topic: String, _ isSubmitted: Bool) {
    self.admin = admin
    self.periodAlias = periodAlias
    self.topic = topic
    self.isSubmitted = isSubmitted
  }
}

access(all)
fun main(
  adminAddress: Address,
  userOwner: Address,
  userId: String,
  periodAlias: String,
  topics: [String]
): [TopicResult]? {
  if let adminRef = Leaderboard.borrowLeaderboardAdmin(adminAddress) {
    if adminRef.borrowPeriodByName(periodAlias) == nil {
      return nil
    }
  }
  let results: [TopicResult] = []
  if let userProfile = Leaderboard.borrowUserScoringProfile(userOwner, userId) {
    for topic in topics {
      if let isSubmitted = userProfile.isTopicSubmitted(adminAddress, periodAlias, topic) {
        results.append(TopicResult(adminAddress, periodAlias, topic, isSubmitted))
      }
    }
  } else {
    for topic in topics {
      results.append(TopicResult(adminAddress, periodAlias, topic, false))
    }
  }
  return results
}