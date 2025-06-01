// get_game_session.cdc

import EmojiChainGame from 0x01 // Replace with your actual contract address when deployed

pub struct GameSessionView {
    pub let level: UInt64
    pub let score: UInt64
    pub let hasPowerUp: Bool
    pub let sequenceLength: Int
    
    init(level: UInt64, score: UInt64, hasPowerUp: Bool, sequenceLength: Int) {
        self.level = level
        self.score = score
        self.hasPowerUp = hasPowerUp
        self.sequenceLength = sequenceLength
    }
}

pub fun main(player: Address): GameSessionView? {
    let session = EmojiChainGame.getGameSession(player: player)
    
    if session == nil {
        return nil
    }
    
    return GameSessionView(
        level: session!.level,
        score: session!.score,
        hasPowerUp: session!.hasPowerUp,
        sequenceLength: session!.currentSequence.length
    )
}