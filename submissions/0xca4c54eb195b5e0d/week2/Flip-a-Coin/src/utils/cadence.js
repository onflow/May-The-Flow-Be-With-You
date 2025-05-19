// Cadence Scripts
export const FLIP_COIN_SCRIPT = `
  import CoinFlip from 0xCoinFlip

  pub fun main(player: Address): Bool {
    return CoinFlip.flipCoin(player: player)
  }
`;

export const GET_PLAYER_STATS_SCRIPT = `
  import CoinFlip from 0xCoinFlip

  pub fun main(player: Address): {String: UInt64} {
    let stats = CoinFlip.getPlayerStats(player: player)
    return {
      "totalFlips": stats?.totalFlips ?? 0,
      "wins": stats?.wins ?? 0,
      "currentStreak": stats?.currentStreak ?? 0,
      "bestStreak": stats?.bestStreak ?? 0
    }
  }
`;

export const GET_PLAYER_HISTORY_SCRIPT = `
  import CoinFlip from 0xCoinFlip

  pub fun main(player: Address): [Bool] {
    let stats = CoinFlip.getPlayerStats(player: player)
    return stats?.recentFlips ?? []
  }
`;

// Cadence Transactions
export const PLACE_BET_TRANSACTION = `
  import FungibleToken from 0xFungibleToken
  import FlowToken from 0xFlowToken
  import CoinFlip from 0xCoinFlip

  transaction(amount: UFix64) {
    let payment: @FungibleToken.Vault
    
    prepare(signer: AuthAccount) {
      self.payment <- signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)!
        .withdraw(amount: amount) as! @FungibleToken.Vault
    }

    execute {
      CoinFlip.placeBet(payment: <-self.payment)
    }
  }
`; 