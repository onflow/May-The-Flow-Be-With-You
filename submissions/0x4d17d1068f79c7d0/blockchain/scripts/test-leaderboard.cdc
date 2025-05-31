import MemoryLeaderboard from 0xb8404e09b36b6623

access(all) fun main(): [MemoryLeaderboard.LeaderboardEntry] {
    return MemoryLeaderboard.getTopScores(gameType: nil, culture: nil, limit: 5)
}
