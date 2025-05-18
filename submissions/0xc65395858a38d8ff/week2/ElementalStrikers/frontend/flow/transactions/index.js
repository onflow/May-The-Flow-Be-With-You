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
  // Mapa para convertir nombres de elementos en inglés a español para la blockchain
  const elementMap = {
    "Fire": "Fuego",
    "Water": "Agua",
    "Plant": "Planta"
  };
  
  const translatedChoice = elementMap[playerChoice] || playerChoice;
  
  if (!translatedChoice || !["Fuego", "Agua", "Planta"].includes(translatedChoice)) {
    throw new Error("Invalid choice. Must be 'Fire', 'Water', or 'Plant'");
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
      arg(translatedChoice, t.String)
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

  // Mapa para convertir nombres de elementos del español al inglés
  const elementMapReverse = {
    "Fuego": "Fire",
    "Agua": "Water",
    "Planta": "Plant"
  };

  // Para fines de demostración, simulamos un resultado 
  // En un sistema real, obtendrías los detalles del juego desde la blockchain después de la transacción
  const randomSpanishElement = () => ["Fuego", "Agua", "Planta"][Math.floor(Math.random() * 3)];
  const player1Move = randomSpanishElement();
  const computerMove = randomSpanishElement();
  
  const simulatedResult = {
    gameId: safeGameId,
    mode: "PvEPractice",
    player1Move: elementMapReverse[player1Move] || player1Move,
    computerMove: elementMapReverse[computerMove] || computerMove,
    environmentalModifier: ["None", "Sunny Day", "Heavy Rain", "Fertile Ground"][Math.floor(Math.random() * 4)],
    criticalHitTypePlayer1: ["None", "Critical", "Partial"][Math.floor(Math.random() * 3)],
    criticalHitTypeP2OrComputer: ["None", "Critical", "Partial"][Math.floor(Math.random() * 3)],
  };

  // Determinar ganador (lógica simplificada)
  const elements = {"Fire": "Plant", "Plant": "Water", "Water": "Fire"};
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

// Transacción para crear un juego PvP con apuestas y múltiples rondas
export const createPvPGame = async (stakeAmount, rounds = 3) => {
  // Validar el número de rondas
  if (rounds < 1 || rounds > 10) {
    throw new Error("Number of rounds must be between 1 and 10");
  }

  const transactionId = await fcl.mutate({
    cadence: `
      import ElementalStrikers from 0xElementalStrikers
      import FungibleToken from 0xFungibleToken
      import FlowToken from 0xFlowToken

      transaction(stakeAmount: UFix64, rounds: UInt64) {
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
          // Create the game with the stake and rounds
          let gameId = ElementalStrikers.createGame(
            player1StakeVault: <-self.flowVault,
            initialStakeAmount: stakeAmount,
            numberOfRounds: rounds
          )
          
          log("PvP game created with ID: ".concat(gameId.toString()).concat(" stake amount: ").concat(stakeAmount.toString()).concat(" rounds: ").concat(rounds.toString()))
        }
      }
    `,
    args: (arg, t) => [
      arg(stakeAmount.toString(), t.UFix64),
      arg(rounds.toString(), t.UInt64)
    ],
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 100
  });

  return transactionId;
};

// Transacción para unirse a un juego existente
export const joinGame = async (gameId, stakeAmount) => {
  const transactionId = await fcl.mutate({
    cadence: `
      import ElementalStrikers from 0xElementalStrikers
      import FungibleToken from 0xFungibleToken
      import FlowToken from 0xFlowToken

      transaction(gameId: UInt64, stakeAmount: UFix64) {
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
          // Join the game with the stake
          ElementalStrikers.joinGame(
            gameId: gameId,
            player2StakeVault: <-self.flowVault
          )
          
          log("Joined game with ID: ".concat(gameId.toString()).concat(" with stake amount: ").concat(stakeAmount.toString()))
        }
      }
    `,
    args: (arg, t) => [
      arg(gameId.toString(), t.UInt64),
      arg(stakeAmount.toString(), t.UFix64)
    ],
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 100
  });

  return transactionId;
};

// Transacción para realizar una jugada en un juego
export const makeMove = async (gameId, elementChoice) => {
  // Mapa para convertir nombres de elementos en inglés a español para la blockchain
  const elementMap = {
    "Fire": "Fuego",
    "Water": "Agua",
    "Plant": "Planta"
  };
  
  const translatedChoice = elementMap[elementChoice] || elementChoice;
  
  if (!translatedChoice || !["Fuego", "Agua", "Planta"].includes(translatedChoice)) {
    throw new Error("Invalid choice. Must be 'Fire', 'Water', or 'Plant'");
  }

  const transactionId = await fcl.mutate({
    cadence: `
      import ElementalStrikers from 0xElementalStrikers

      transaction(gameId: UInt64, elementChoice: String) {
        let playerAgentRef: &ElementalStrikers.PlayerAgent
        
        prepare(signer: auth(BorrowValue) &Account) {
          self.playerAgentRef = signer.storage.borrow<&ElementalStrikers.PlayerAgent>(
            from: ElementalStrikers.PlayerVaultStoragePath
          ) ?? panic("Could not borrow a reference to PlayerAgent. Did you run setup_account.cdc?")
        }

        execute {
          self.playerAgentRef.makeMove(gameId: gameId, elementChoice: elementChoice)
          log("Made move in game with ID: ".concat(gameId.toString()).concat(" with element choice: ").concat(elementChoice))
        }
      }
    `,
    args: (arg, t) => [
      arg(gameId.toString(), t.UInt64),
      arg(translatedChoice, t.String)
    ],
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 100
  });

  return transactionId;
};

// Función para obtener una lista de juegos disponibles (simulada)
export const getAvailableGames = async () => {
  // En un caso real, llamaríamos a un script de Flow para obtener estos datos
  // Pero para este ejemplo, simulamos los datos
  return [
    {
      id: 1,
      creator: "0x1234567890abcdef",
      stake: "10.0",
      rounds: 3,
      status: "Waiting for opponent"
    },
    {
      id: 2,
      creator: "0x2345678901abcdef",
      stake: "5.0",
      rounds: 5,
      status: "Waiting for opponent"
    },
    {
      id: 3,
      creator: "0x3456789012abcdef",
      stake: "20.0",
      rounds: 1,
      status: "Waiting for opponent"
    }
  ];
}; 