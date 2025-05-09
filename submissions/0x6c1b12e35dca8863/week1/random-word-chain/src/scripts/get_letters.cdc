// get_letters.cdc

import WordChainGame from 0x01 // Replace with your actual contract address when deployed

pub fun main(player: Address): [String] {
    let playerInfo = WordChainGame.getPlayerInfo(player: player)
    
    if playerInfo == nil {
        return []
    }
    
    return playerInfo!.currentLetters
}