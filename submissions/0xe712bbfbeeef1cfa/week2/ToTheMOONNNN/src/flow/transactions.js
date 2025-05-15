import * as fcl from '@onflow/fcl';

// Script to get player data
export const getPlayerData = async (address) => {
  try {
    const result = await fcl.query({
      cadence: `
        import ClickToMoon from 0xClickToMoon

        pub fun main(address: Address): {String: UFix64}? {
          let account = getAccount(address)
          let capability = account.getCapability<&ClickToMoon.PlayerStorage>(/public/playerStorage)
          let playerStorage = capability.borrow() ?? panic("Could not borrow PlayerStorage")
          
          if let player = playerStorage.player {
            return {
              "thrustPoints": player.thrustPoints,
              "clickMultiplier": player.clickMultiplier,
              "autoThrusters": player.autoThrusters,
              "lastAutoThrustTime": player.lastAutoThrustTime
            }
          }
          return nil
        }
      `,
      args: (arg, t) => [arg(address, t.Address)],
    });
    return result;
  } catch (error) {
    console.error('Error getting player data:', error);
    return null;
  }
};

// Transaction to create a new player
export const createPlayer = async () => {
  try {
    const transactionId = await fcl.mutate({
      cadence: `
        import ClickToMoon from 0xClickToMoon

        transaction {
          prepare(signer: AuthAccount) {
            let capability = signer.getCapability<&ClickToMoon.PlayerStorage>(/public/playerStorage)
            let playerStorage = capability.borrow() ?? panic("Could not borrow PlayerStorage")
            playerStorage.createPlayer()
          }
        }
      `,
    });
    await fcl.tx(transactionId).onceSealed();
    return true;
  } catch (error) {
    console.error('Error creating player:', error);
    return false;
  }
};

// Transaction to generate thrust
export const generateThrust = async () => {
  try {
    const transactionId = await fcl.mutate({
      cadence: `
        import ClickToMoon from 0xClickToMoon

        transaction {
          prepare(signer: AuthAccount) {
            let capability = signer.getCapability<&ClickToMoon.PlayerStorage>(/public/playerStorage)
            let playerStorage = capability.borrow() ?? panic("Could not borrow PlayerStorage")
            
            if let player = playerStorage.player {
              player.generateThrust()
            }
          }
        }
      `,
    });
    await fcl.tx(transactionId).onceSealed();
    return true;
  } catch (error) {
    console.error('Error generating thrust:', error);
    return false;
  }
};

// Transaction to purchase booster
export const purchaseBooster = async () => {
  try {
    const transactionId = await fcl.mutate({
      cadence: `
        import ClickToMoon from 0xClickToMoon

        transaction {
          prepare(signer: AuthAccount) {
            let capability = signer.getCapability<&ClickToMoon.PlayerStorage>(/public/playerStorage)
            let playerStorage = capability.borrow() ?? panic("Could not borrow PlayerStorage")
            
            if let player = playerStorage.player {
              player.purchaseBooster()
            }
          }
        }
      `,
    });
    await fcl.tx(transactionId).onceSealed();
    return true;
  } catch (error) {
    console.error('Error purchasing booster:', error);
    return false;
  }
};

// Transaction to purchase auto-thruster
export const purchaseAutoThruster = async () => {
  try {
    const transactionId = await fcl.mutate({
      cadence: `
        import ClickToMoon from 0xClickToMoon

        transaction {
          prepare(signer: AuthAccount) {
            let capability = signer.getCapability<&ClickToMoon.PlayerStorage>(/public/playerStorage)
            let playerStorage = capability.borrow() ?? panic("Could not borrow PlayerStorage")
            
            if let player = playerStorage.player {
              player.purchaseAutoThruster()
            }
          }
        }
      `,
    });
    await fcl.tx(transactionId).onceSealed();
    return true;
  } catch (error) {
    console.error('Error purchasing auto-thruster:', error);
    return false;
  }
};

// Transaction to set up PlayerStorage for a new user
export const setupPlayerStorage = async () => {
  try {
    const transactionId = await fcl.mutate({
      cadence: `
        import ClickToMoon from 0xClickToMoon

        transaction {
          prepare(signer: AuthAccount) {
            if (!signer.storage.contains(path: /storage/playerStorage)) {
              let playerStorage <- create ClickToMoon.PlayerStorage()
              signer.storage.save(<-playerStorage, to: /storage/playerStorage)
              signer.link<&ClickToMoon.PlayerStorage>(
                /public/playerStorage,
                target: /storage/playerStorage
              )
            }
          }
        }
      `,
    });
    await fcl.tx(transactionId).onceSealed();
    return true;
  } catch (error) {
    console.error('Error setting up PlayerStorage:', error);
    return false;
  }
}; 