// get_leaderboard.cdc

import WordChainGame from 0x01 // Replace with your actual contract address when deployed

pub struct LeaderboardEntry {
    pub let player: Address
    pub let score: UInt64
    pub let wordsSubmitted: UInt64
    
    init(player: Address, score: UInt64, wordsSubmitted: UInt64) {
        self.player = player
        self.score = score
        self.wordsSubmitted = wordsSubmitted
    }
}

pub fun main(limit: Int): [LeaderboardEntry] {
    let topPlayers = WordChainGame.getTopPlayers(limit: limit)
    
    let result: [LeaderboardEntry] = []
    
    for player in topPlayers {
        let playerInfo = WordChainGame.getPlayerInfo(player: player)!
        
        result.append(LeaderboardEntry(
            player: player,
            score: playerInfo.score,
            wordsSubmitted: playerInfo.wordsSubmitted
        ))
    }
    
    return result
}