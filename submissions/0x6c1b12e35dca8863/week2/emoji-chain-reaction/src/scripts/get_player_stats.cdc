// get_player_stats.cdc

import EmojiChainGame from 0x01 // Replace with your actual contract address when deployed

pub struct PlayerStatsView {
    pub let highScore: UInt64
    pub let gamesPlayed: UInt64
    pub let totalScore: UInt64
    pub let currentLevel: UInt64
    pub let averageScore: UInt64
    
    init(
        highScore: UInt64,
        gamesPlayed: UInt64,
        totalScore: UInt64,
        currentLevel: UInt64
    ) {
        self.highScore = highScore
        self.gamesPlayed = gamesPlayed
        self.totalScore = totalScore
        self.currentLevel = currentLevel
        
        // Calculate average score (avoid division by zero)
        self.averageScore = gamesPlayed > 0 
            ? totalScore / gamesPlayed 
            : 0
    }
}

pub fun main(player: Address): PlayerStatsView? {
    let stats = EmojiChainGame.getPlayerStats(player: player)
    
    if stats == nil {
        return nil
    }
    
    return PlayerStatsView(
        highScore: stats!.highScore,
        gamesPlayed: stats!.gamesPlayed,
        totalScore: stats!.totalScore,
        currentLevel: stats!.currentLevel
    )
}