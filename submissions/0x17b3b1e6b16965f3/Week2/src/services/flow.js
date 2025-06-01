import * as fcl from "@onflow/fcl";

// Configure FCL
fcl.config({
  "app.detail.title": "Flow RPS Game",
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "0xRockPaperScissors": "0xYourContractAddress"
});

export const getPlayerStats = async (address) => {
  try {
    return await fcl.query({
      cadence: `
        import RockPaperScissors from 0xRockPaperScissors
        pub fun main(address: Address): RockPaperScissors.PlayerStats? {
          return RockPaperScissors.getPlayerStats(player: address)
        }
      `,
      args: (arg, t) => [arg(address, t.Address)]
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
};

export const getPlayerHistory = async (address) => {
  try {
    return await fcl.query({
      cadence: `
        import RockPaperScissors from 0xRockPaperScissors
        pub fun main(address: Address): [RockPaperScissors.GameResult]? {
          return RockPaperScissors.getPlayerHistory(player: address)
        }
      `,
      args: (arg, t) => [arg(address, t.Address)]
    });
  } catch (error) {
    console.error('Error fetching player history:', error);
    return [];
  }
};

export const getTopPlayers = async () => {
  try {
    return await fcl.query({
      cadence: `
        import RockPaperScissors from 0xRockPaperScissors
        pub fun main(): [Address] {
          return RockPaperScissors.getTopPlayers()
        }
      `
    });
  } catch (error) {
    console.error('Error fetching top players:', error);
    return [];
  }
};

export const getMoveStats = async () => {
  try {
    return await fcl.query({
      cadence: `
        import RockPaperScissors from 0xRockPaperScissors
        pub fun main(): {UInt8: UInt64} {
          return RockPaperScissors.getMoveStats()
        }
      `
    });
  } catch (error) {
    console.error('Error fetching move stats:', error);
    return null;
  }
};

export const getTotalGames = async () => {
  try {
    return await fcl.query({
      cadence: `
        import RockPaperScissors from 0xRockPaperScissors
        pub fun main(): UInt64 {
          return RockPaperScissors.getTotalGames()
        }
      `
    });
  } catch (error) {
    console.error('Error fetching total games:', error);
    return 0;
  }
};

export const playGame = async (playerMove, computerMove) => {
  try {
    const transactionId = await fcl.mutate({
      cadence: `
        import RockPaperScissors from 0xRockPaperScissors

        transaction(playerMove: UInt8, computerMove: UInt8) {
          prepare(acct: AuthAccount) {
            RockPaperScissors.playGame(
              playerMove: RockPaperScissors.Move(rawValue: playerMove),
              computerMove: RockPaperScissors.Move(rawValue: computerMove)
            )
          }
        }
      `,
      args: (arg, t) => [
        arg(playerMove, t.UInt8),
        arg(computerMove, t.UInt8)
      ],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 999
    });

    return await fcl.tx(transactionId).onceSealed();
  } catch (error) {
    console.error('Error playing game:', error);
    throw error;
  }
}; 