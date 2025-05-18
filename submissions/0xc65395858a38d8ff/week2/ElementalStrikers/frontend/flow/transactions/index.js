import * as fcl from '@onflow/fcl';

// Transacción para configurar la cuenta de usuario
export const setupAccount = async () => {
  const transactionId = await fcl.mutate({
    cadence: `
      import ElementalStrikers from 0xElementalStrikers

      transaction {
        prepare(signer: auth(Save, Capabilities) &Account) {
          // Check if the PlayerAgent is already stored
          if signer.storage.type(at: ElementalStrikers.PlayerVaultStoragePath) == nil {
            // Create a new PlayerAgent resource and save it to account storage
            let agent <- ElementalStrikers.createPlayerAgent(account: signer)
            signer.storage.save(<-agent, to: ElementalStrikers.PlayerVaultStoragePath)

            // Unpublish any existing capability at the public path to avoid collision
            // before publishing the new one.
            signer.capabilities.unpublish(ElementalStrikers.GamePlayerPublicPath)
            
            // Publish a capability to the PlayerAgent resource, restricted to the GamePlayer interface
            signer.capabilities.publish(
              signer.capabilities.storage.issue<&ElementalStrikers.PlayerAgent>(
                ElementalStrikers.PlayerVaultStoragePath
              ),
              at: ElementalStrikers.GamePlayerPublicPath
            )
            
            log("PlayerAgent created and stored. Public capability published.")
          } else {
            log("PlayerAgent already exists in storage.")
            // Optionally, ensure the public capability is correctly published if the agent exists
            // This handles cases where the agent might exist but the capability was unpublished or is incorrect.
            if signer.capabilities.get<&{ElementalStrikers.GamePlayer}>(ElementalStrikers.GamePlayerPublicPath) == nil {
              // Unpublish any existing capability at the public path just in case it's a different type
              signer.capabilities.unpublish(ElementalStrikers.GamePlayerPublicPath)
              // Publish the capability
              signer.capabilities.publish(
                signer.capabilities.storage.issue<&ElementalStrikers.PlayerAgent>(
                  ElementalStrikers.PlayerVaultStoragePath
                ),
                at: ElementalStrikers.GamePlayerPublicPath
              )
              log("PlayerAgent existed, public capability was missing and has been published.")
            } else {
              log("PlayerAgent existed and public capability is correctly published.")
            }
          }
        }

        execute {
          log("Account setup for ElementalStrikers finished.")
        }
      } 
    `,
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 100
  });

  return transactionId;
};

// Transacción para crear un juego PvE (práctica)
export const createPracticeGame = async (playerChoice) => {
  if (!playerChoice || !["Fuego", "Agua", "Planta"].includes(playerChoice)) {
    throw new Error("Elección inválida. Debe ser 'Fuego', 'Agua' o 'Planta'");
  }

  const transactionId = await fcl.mutate({
    cadence: `
      import ElementalStrikers from 0xElementalStrikers

      transaction(player1Choice: String) {
        // Reference to the signer's PlayerAgent resource, to get their address
        // and to potentially call practice game creation through agent in future.
        let playerAgentRef: &ElementalStrikers.PlayerAgent
        let playerAddress: Address

        prepare(signer: auth(BorrowValue) &Account) {
          self.playerAgentRef = signer.storage.borrow<&ElementalStrikers.PlayerAgent>(
            from: ElementalStrikers.PlayerVaultStoragePath
          ) ?? panic("Could not borrow a reference to PlayerAgent. Did you run setup_account.cdc?")
          
          self.playerAddress = signer.address
          log("PlayerAgent borrowed, player address obtained.")
        }

        execute {
          let gameId = ElementalStrikers.createPracticeGame(
            player1Address: self.playerAddress,
            player1Choice: player1Choice
          )
          log("Practice game created with ID: ".concat(gameId.toString()).concat(" for player ").concat(self.playerAddress.toString()).concat(" with choice: ".concat(player1Choice)))
          log("This game is now awaiting randomness. Call 'reveal_outcome' transaction to see the result.")
        }
      }
    `,
    args: (arg, t) => [
      arg(playerChoice, t.String)
    ],
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 100
  });

  // En un sistema real, deberíamos escuchar los eventos del blockchain para obtener el gameId
  // Para simplificar, simulamos un gameId fijo
  return transactionId;
};

// Transacción para revelar el resultado de un juego
export const revealOutcome = async (gameId) => {
  // Si gameId es null, usamos un valor predeterminado para la demo
  const safeGameId = gameId || 1;

  const transactionId = await fcl.mutate({
    cadence: `
      import ElementalStrikers from 0xElementalStrikers

      transaction(gameId: UInt64) {
        // Reference to the signer's PlayerAgent resource
        let playerAgentRef: &ElementalStrikers.PlayerAgent

        prepare(signer: auth(BorrowValue) &Account) {
          self.playerAgentRef = signer.storage.borrow<&ElementalStrikers.PlayerAgent>(
            from: ElementalStrikers.PlayerVaultStoragePath
          ) ?? panic("Could not borrow a reference to PlayerAgent. Did you run setup_account.cdc?")
          
          log("PlayerAgent borrowed.")
        }

        execute {
          self.playerAgentRef.revealOutcome(gameId: gameId)
          log("Revealed outcome for game ID: ".concat(gameId.toString()))
          
          // Get updated game details to log
          let gameDetails = self.playerAgentRef.getGameDetails(gameId: gameId)
          if let details = gameDetails {
            log("Winner: ".concat(details.winner != nil ? details.winner!.toString() : "None (Draw)"))
          } else {
            log("Game not found after reveal.")
          }
        }
      }
    `,
    args: (arg, t) => [
      arg(safeGameId.toString(), t.UInt64)
    ],
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 100
  });

  // Para fines de demostración, simulamos un resultado 
  // En un sistema real, obtendrías los detalles del juego desde la blockchain después de la transacción
  const simulatedResult = {
    gameId: safeGameId,
    mode: "PvEPractice",
    player1Move: ["Fuego", "Agua", "Planta"][Math.floor(Math.random() * 3)],
    computerMove: ["Fuego", "Agua", "Planta"][Math.floor(Math.random() * 3)],
    environmentalModifier: ["None", "Día Soleado", "Lluvia Torrencial", "Tierra Fértil"][Math.floor(Math.random() * 4)],
    criticalHitTypePlayer1: ["None", "Critical", "Partial"][Math.floor(Math.random() * 3)],
    criticalHitTypeP2OrComputer: ["None", "Critical", "Partial"][Math.floor(Math.random() * 3)],
  };

  // Determinar ganador (lógica simplificada)
  const elements = {"Fuego": "Planta", "Planta": "Agua", "Agua": "Fuego"};
  if (simulatedResult.player1Move === simulatedResult.computerMove) {
    // Empate
    simulatedResult.winner = null;
  } else if (elements[simulatedResult.player1Move] === simulatedResult.computerMove) {
    // El jugador gana
    simulatedResult.winner = fcl.currentUser().addr;
  } else {
    // La IA gana
    simulatedResult.winner = "0xAI_OPPONENT";
  }

  return simulatedResult;
};

// Transacción para crear un juego PvP con apuestas
export const createPvPGame = async (stakeAmount) => {
  const transactionId = await fcl.mutate({
    cadence: `
      import ElementalStrikers from 0xElementalStrikers
      import FungibleToken from 0xFungibleToken
      import FlowToken from 0xFlowToken

      transaction(stakeAmount: UFix64) {
        let flowVault: @FungibleToken.Vault
        
        prepare(signer: auth(BorrowValue) &Account) {
          // Borrow a reference to the signer's FlowToken vault
          let flowTokenVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
          ) ?? panic("Could not borrow a reference to the Flow Token vault")
          
          // Withdraw the stake amount
          self.flowVault <- flowTokenVault.withdraw(amount: stakeAmount) as! @FlowToken.Vault
        }

        execute {
          // Create the game with the stake
          let gameId = ElementalStrikers.createGame(
            player1StakeVault: <-self.flowVault,
            initialStakeAmount: stakeAmount
          )
          
          log("PvP game created with ID: ".concat(gameId.toString()).concat(" and stake amount: ").concat(stakeAmount.toString()))
        }
      }
    `,
    args: (arg, t) => [
      arg(stakeAmount.toString(), t.UFix64)
    ],
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 100
  });

  return transactionId;
}; 