// get_leaderboard.cdc

import EmojiChainGame from 0x01 // Replace with your actual contract address when deployed

pub struct LeaderboardEntry {
    pub let player: Address
    pub let highScore: UInt64
    pub let rank: Int
    
    init(player: Address, highScore: UInt64, rank: Int) {
        self.player = player
        self.highScore = highScore
        self.rank = rank
    }
}

pub fun main(limit: Int): [LeaderboardEntry] {
    let topScores = EmojiChainGame.getTopPlayerScores(limit: limit)
    let result: [LeaderboardEntry] = []
    
    var rank = 1
    for player in EmojiChainGame.topPlayers {
        if rank > limit {
            break
        }
        
        result.append(LeaderboardEntry(
            player: player,
            highScore: topScores[player]!,
            rank: rank
        ))
        
        rank = rank + 1
    }
    
    return result
}