// get_current_sequence.cdc

import EmojiChainGame from 0x01 // Replace with your actual contract address when deployed

pub fun main(player: Address): [String]? {
    return EmojiChainGame.getCurrentSequence(player: player)
}