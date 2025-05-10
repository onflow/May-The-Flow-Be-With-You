// get_player_stats.cdc

import WordChainGame from 0x01 // Replace with your actual contract address when deployed

pub struct PlayerStats {
    pub let score: UInt64
    pub let wordsSubmitted: UInt64
    pub let letterCount: Int
    
    init(score: UInt64, wordsSubmitted: UInt64, letterCount: Int) {
        self.score = score
        self.wordsSubmitted = wordsSubmitted
        self.letterCount = letterCount
    }
}

pub fun main(player: Address): PlayerStats? {
    let playerInfo = WordChainGame.getPlayerInfo(player: player)
    
    if playerInfo == nil {
        return nil
    }
    
    return PlayerStats(
        score: playerInfo!.score,
        wordsSubmitted: playerInfo!.wordsSubmitted,
        letterCount: playerInfo!.currentLetters.length
    )
}