import * as fcl from "@onflow/fcl";
import * as t from "@onflow/types";
import "../flow/config"; // Your FCL config file

// --- Authentication ---
export const getCurrentUser = async () => {
  try {
    await fcl.currentUser.onceReady(); // Ensure FCL is initialized
    return fcl.currentUser.snapshot();
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const logIn = async () => {
  try {
    await fcl.logIn();
    // You might want to subscribe to user changes here or in a global context
    // fcl.currentUser.subscribe(setUser); // setUser would be a state setter
  } catch (error) {
    console.error("Error logging in:", error);
  }
};

export const logOut = () => {
  fcl.unauthenticate();
  // You might want to update user state here as well
};

// --- Read-Only Scripts (Queries) ---

// Generic script execution function
const executeScript = async (cadence, args = []) => {
  try {
    const result = await fcl.query({ cadence, args });
    return result;
  } catch (error) {
    console.error("Error executing script:", { cadence, args, error });
    throw error;
  }
};

export const getLuckyColorMatchEntryFee = async () => {
  const cadence = `
    import LuckyColorMatch from "LuckyColorMatch"
    pub fun main(): UFix64 {
      return LuckyColorMatch.getEntryFee()
    }
  `;
  return executeScript(cadence);
};

export const getAvailableColors = async () => {
  const cadence = `
    import LuckyColorMatch from "LuckyColorMatch"
    pub fun main(): [String] {
      return LuckyColorMatch.getAvailableColors()
    }
  `;
  return executeScript(cadence);
};

export const getCombinationLength = async () => {
  const cadence = `
    import LuckyColorMatch from "LuckyColorMatch"
    pub fun main(): Int {
      return LuckyColorMatch.getCombinationLength()
    }
  `;
  return executeScript(cadence);
};

export const getCurrentRoundID = async () => {
  const cadence = `
    import LuckyColorMatch from "LuckyColorMatch"
    pub fun main(): UInt64 {
      return LuckyColorMatch.getCurrentRoundID()
    }
  `;
  return executeScript(cadence);
};

export const getRoundStatus = async (roundID) => {
  const cadence = `
    import LuckyColorMatch from "LuckyColorMatch"
    pub fun main(roundID: UInt64): LuckyColorMatch.RoundStatus? {
      return LuckyColorMatch.getRoundStatus(roundID: roundID)
    }
  `;
  const fclArgs = (arg, t) => [arg(roundID, t.UInt64)];
  return executeScript(cadence, fclArgs);
};

export const getCurrentPrizePool = async (roundID) => {
  const cadence = `
    import LuckyColorMatch from "LuckyColorMatch"
    pub fun main(roundID: UInt64): UFix64 {
      return LuckyColorMatch.getCurrentPrizePool(roundID: roundID)
    }
  `;
  const fclArgs = (arg, t) => [arg(roundID, t.UInt64)];
  return executeScript(cadence, fclArgs);
};

export const getPlayerRoundDetails = async (roundID, playerAddress) => {
  const cadence = `
    import LuckyColorMatch from "LuckyColorMatch"
    pub fun main(roundID: UInt64, playerAddress: Address): LuckyColorMatch.PlayerBet? {
      return LuckyColorMatch.getPlayerRoundDetails(roundID: roundID, playerAddress: playerAddress)
    }
  `;
  const fclArgs = (arg, t) => [arg(roundID, t.UInt64), arg(playerAddress, t.Address)];
  return executeScript(cadence, fclArgs);
};

export const getWinningCombination = async (roundID) => {
  const cadence = `
    import LuckyColorMatch from "LuckyColorMatch"
    pub fun main(roundID: UInt64): LuckyColorMatch.ColorCombination? {
      return LuckyColorMatch.getWinningCombination(roundID: roundID)
    }
  `;
  const fclArgs = (arg, t) => [arg(roundID, t.UInt64)];
  return executeScript(cadence, fclArgs);
};

export const getGameDetails = async (roundID) => {
  const cadence = `
    import LuckyColorMatch from "LuckyColorMatch"
    pub fun main(roundID: UInt64): LuckyColorMatch.GameRoundInfo? {
      return LuckyColorMatch.getGameDetails(roundID: roundID)
    }
  `;
  const fclArgs = (arg, t) => [arg(roundID, t.UInt64)];
  return executeScript(cadence, fclArgs);
};


// --- Transactions (Mutations) ---

// Generic transaction execution function
const executeTransaction = async (cadence, fclArgs, gasLimit = 999) => {
  try {
    const transactionId = await fcl.mutate({
      cadence,
      args: fclArgs,
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: gasLimit,
    });
    console.log("Transaction Sent:", transactionId);
    // Wait for the transaction to be sealed
    const txStatus = await fcl.tx(transactionId).onceSealed();
    console.log("Transaction Sealed:", txStatus);
    if (txStatus.status === 4 && txStatus.errorMessage) { // 4 is an error status
        throw new Error(`Transaction Error: ${txStatus.errorMessage}`);
    }
    return { transactionId, status: txStatus };
  } catch (error) {
    console.error("Error executing transaction:", { cadence, fclArgs, error });
    throw error;
  }
};

export const setupAccount = async () => {
  const cadence = `
    import FungibleToken from "FungibleToken"
    import NonFungibleToken from "NonFungibleToken"
    import LuckyCharmNFT from "LuckyCharmNFT"
    import AchievementBadgeNFT from "AchievementBadgeNFT"

    transaction {
      prepare(signer: AuthAccount) {
        // Set up FungibleToken Vault if it doesn't exist
        if signer.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault) == nil {
          signer.save(<-FungibleToken.createEmptyVault(), to: /storage/flowTokenVault)
          signer.link<&FungibleToken.Vault{FungibleToken.Receiver, FungibleToken.Balance}>(
            /public/flowTokenReceiver,
            target: /storage/flowTokenVault
          )
        }

        // Set up LuckyCharmNFT Collection if it doesn't exist
        if signer.borrow<&LuckyCharmNFT.Collection>(from: LuckyCharmNFT.CollectionStoragePath) == nil {
          signer.save(<-LuckyCharmNFT.createEmptyCollection(), to: LuckyCharmNFT.CollectionStoragePath)
          signer.link<&LuckyCharmNFT.Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(
            LuckyCharmNFT.CollectionPublicPath,
            target: LuckyCharmNFT.CollectionStoragePath
          )
        }

        // Set up AchievementBadgeNFT Collection if it doesn't exist
        if signer.borrow<&AchievementBadgeNFT.Collection>(from: AchievementBadgeNFT.CollectionStoragePath) == nil {
          signer.save(<-AchievementBadgeNFT.createEmptyCollection(), to: AchievementBadgeNFT.CollectionStoragePath)
          signer.link<&AchievementBadgeNFT.Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(
            AchievementBadgeNFT.CollectionPublicPath,
            target: AchievementBadgeNFT.CollectionStoragePath
          )
        }
      }
      execute {
        log("Account setup complete or already set up.")
      }
    }
  `;
  return executeTransaction(cadence, (arg, t) => []);
};


export const submitPlayerColors = async (chosenColors, luckyCharmID) => {
  const cadence = `
    import FungibleToken from "FungibleToken"
    import LuckyColorMatch from "LuckyColorMatch"
    import LuckyCharmNFT from "LuckyCharmNFT" // Needed if charm details are checked in TX

    transaction(chosenColors: [String], luckyCharmID: UInt64?) {
      let feeVault: @FungibleToken.Vault
      // No need for gameContract reference if submitColors is public and handles deposits itself

      prepare(signer: AuthAccount) {
        var feeToPay = LuckyColorMatch.getEntryFee()
        var discountApplied = false

        if luckyCharmID != nil {
            // Attempt to borrow the LuckyCharmNFT collection
            if let charmCollectionRef = signer.borrow<&LuckyCharmNFT.Collection{LuckyCharmNFT.CollectionPublic}>(from: LuckyCharmNFT.CollectionStoragePath) {
                // Check if the player owns the charm and it's a FeeDiscount type
                if let charmRef = charmCollectionRef.borrowNFT(id: luckyCharmID!) {
                    let charm = charmRef as! &LuckyCharmNFT.NFT // Cast to concrete type to access fields
                    if charm.charmType == "FeeDiscount" && charm.benefitValue > 0.0 && charm.benefitValue <= 1.0 {
                        let discount = feeToPay * charm.benefitValue
                        feeToPay = feeToPay - discount
                        discountApplied = true
                        log("Lucky Charm discount applied!")
                    }
                }
            }
        }

        let mainVault = signer.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault)
          ?? panic("Cannot borrow FlowToken vault from account storage. Please run setupAccount first.")

        self.feeVault <- mainVault.withdraw(amount: feeToPay)
      }

      execute {
        LuckyColorMatch.submitColors(
            chosenColors: chosenColors,
            feePayment: <-self.feeVault,
            luckyCharmID: luckyCharmID
        )
        log("Colors submitted successfully!")
      }
    }
  `;
  const fclArgs = (arg, t) => [
    arg(chosenColors, t.Array(t.String)),
    arg(luckyCharmID, t.Optional(t.UInt64)),
  ];
  return executeTransaction(cadence, fclArgs);
};

// --- Admin Transactions (Example - typically not called from general user frontend) ---
// export const adminStartNewRound = async () => {
//   const cadence = `
//     import LuckyColorMatch from "LuckyColorMatch"
//     transaction {
//       prepare(admin: AuthAccount) {
//         // Ensure admin is the game admin if contract has such checks
//       }
//       execute {
//         LuckyColorMatch.startNewRound()
//         log("New round started by admin.")
//       }
//     }
//   `;
//   return executeTransaction(cadence, (arg, t) => []);
// };