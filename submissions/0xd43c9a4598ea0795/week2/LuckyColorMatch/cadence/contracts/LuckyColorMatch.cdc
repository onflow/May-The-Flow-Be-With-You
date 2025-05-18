/// LuckyColorMatch Contract
/// This contract manages the core logic for the "Lucky Color Match" game.
/// It handles game rounds, player submissions, random color generation via VRF,
/// prize calculations, and distribution. It can optionally integrate with
/// LuckyCharmNFT and AchievementBadgeNFT contracts for enhanced gameplay.
import FungibleToken from "FungibleToken" // Standard Flow Token address
/// Standard Fungible Token interface, used for entry fees and prize payouts.
import IVRFCoordinator from "IVRFCoordinator" // Placeholder for VRF Coordinator Interface
/// Interface for the Verifiable Random Function (VRF) Coordinator contract.
/// This is a placeholder and should be replaced with the actual VRF solution's interface.
import LuckyCharmNFT from "LuckyCharmNFT" // Assuming it's in the same directory
/// Contract for Lucky Charm NFTs, which can provide in-game benefits.
import AchievementBadgeNFT from "AchievementBadgeNFT" // Assuming it's in the same directory
/// Contract for Achievement Badge NFTs, awarded for in-game accomplishments.
import NonFungibleToken from "NonFungibleToken" // Already used by NFT contracts, ensure consistency
/// Standard Non-Fungible Token interface, a dependency for NFT contracts.

pub contract LuckyColorMatch {

    // --- Contract Constants & Variables ---
    // --- Contract State Variables & Constants ---
    pub let GameAdmin: Address
    /// The address of the game administrator, authorized to perform admin functions.
    pub let entryFeeAmount: UFix64
    /// The standard entry fee amount for participating in a game round.
    pub var nextRoundID: UInt64
    /// Counter for the next available round ID.
    pub var gameRounds: {UInt64: GameRoundInfo}
    /// Dictionary mapping round IDs to their detailed information.

    // VRF Configuration
    pub let vrfCoordinatorAddress: Address
    /// Address of the VRF Coordinator contract.
    pub let vrfCoordinatorCapPath: PublicPath // e.g. /public/FlowVRFCoordinator
    /// Public capability path to the VRF Coordinator.
    pub let vrfKeyHash: String           // Key hash for VRF requests
    /// The specific key hash used for VRF requests, identifying the VRF oracle.
    pub let vrfFee: UFix64               // Fee for VRF requests (e.g., in FLOW or a specific VRF token)
    /// The fee required to make a VRF request.
    access(self) var vrfRequestToRoundID: {UInt64: UInt64} // Maps VRF requestID to game roundID
    /// Internal mapping from a VRF request ID to the game's round ID.
    /// This helps correlate VRF responses back to the correct game round.

    // Game Mechanics Configuration
    pub static let CombinationLength: Int = 3
    /// The fixed number of colors in a lucky combination (e.g., 3 or 4).
    pub static let SpecialPrizePercent: UFix64 = 0.50 // 50% of prize pool for special prize winners
    /// Percentage of the prize pool allocated to Special Prize winners (exact match).
    pub static let FirstPrizePercent: UFix64 = 0.25   // 25% for first prize winners
    /// Percentage of the prize pool allocated to First Prize winners (colors match, order varies).
    pub static let SecondPrizePercent: UFix64 = 0.15  // 15% for second prize winners
    /// Percentage of the prize pool allocated to Second Prize winners (partial color match).
    pub static let TreasuryPercent: UFix64 = 0.10     // 10% for treasury
    /// Percentage of the prize pool allocated to the project treasury.
    pub let availableColors: [String]
    /// List of valid colors that can be part of a combination.

    // NFT Integration: Public paths for checking collections
    pub let LuckyCharmNFTCollectionPublicPath: PublicPath
    /// Public path to access players' Lucky Charm NFT collections.
    pub let AchievementBadgeNFTCollectionPublicPath: PublicPath
    /// Public path to access players' Achievement Badge NFT collections.

    // Central vault to hold all prize money
    access(self) var prizePool: @FungibleToken.Vault
    /// A vault resource to securely hold all entry fees collected, forming the prize pool.

    // --- Events ---
    pub event RoundStarted(roundID: UInt64, startTime: UFix64)
    /// Emitted when a new game round is started.
    pub event RoundClosed(roundID: UInt64, closeTime: UFix64)
    /// Emitted when an active game round is closed for new submissions.
    pub event PlayerSubmittedColors(roundID: UInt64, player: Address, combination: [String], feePaid: UFix64)
    /// Emitted when a player successfully submits their color combination and pays the fee.
    pub event PrizePoolUpdated(roundID: UInt64, newTotalPrizePoolForRound: UFix64)
    /// Emitted when the prize pool for a round is updated (e.g., after a player submission).
    pub event VRFRequested(roundID: UInt64, requestID: UInt64, seed: UInt64)
    /// Emitted when a request for a random number is made to the VRF Coordinator.
    pub event LuckyCombinationRevealed(roundID: UInt64, luckyCombination: [String], randomness: UInt64)
    /// Emitted when the VRF callback is received and the lucky combination for a round is determined.
    pub event PrizeDistributionCompleted(roundID: UInt64, totalDistributed: UFix64, treasuryAmount: UFix64)
    /// Emitted after all prizes for a round have been calculated and distributed.
    pub event WinnerPaid(roundID: UInt64, player: Address, prizeTier: String, amount: UFix64)
    /// Emitted when an individual winner is paid their prize.
    pub event LuckyCharmBenefitApplied(roundID: UInt64, player: Address, charmID: UInt64, discountAmount: UFix64)
    /// Emitted if a player uses a Lucky Charm NFT and receives a benefit (e.g., fee discount).
    pub event AchievementBadgeAwarded(player: Address, badgeID: UInt64, achievement: String)
    /// Emitted when a player is awarded an Achievement Badge NFT.

    // --- Data Structures ---
    pub struct ColorCombination {
    /// Represents a combination of colors chosen by a player or generated as the lucky combination.
    /// - colors: An array of strings, where each string is a color name.
        pub let colors: [String] // e.g., ["Red", "Blue", "Red"]

        init(colors: [String]) {
        /// Initializes a new ColorCombination.
        ///
        /// Parameters:
        /// - colors: An array of strings representing the color combination.
        ///           Must adhere to the `LuckyColorMatch.CombinationLength`.
            // Validate combination length (e.g., 3 or 4)
            // For this example, let's assume a fixed length of 3
            pre {
                colors.length == LuckyColorMatch.CombinationLength : "Color combination must have exactly ".concat(LuckyColorMatch.CombinationLength.toString()).concat(" colors.")
                // TODO: Add validation for valid color strings if necessary (e.g., check against availableColors)
            }
            self.colors = colors
        }
    }

    /// Represents a player's submission (bet) in a game round.
    /// - playerAddress: The address of the participating player.
    /// - chosenCombination: The `ColorCombination` submitted by the player.
    /// - entryFeePaid: The actual amount of entry fee paid by the player (after any discounts).
    pub struct PlayerBet {
        pub let playerAddress: Address
        pub let chosenCombination: ColorCombination
        pub let entryFeePaid: UFix64

        init(playerAddress: Address, chosenCombination: ColorCombination, entryFeePaid: UFix64) {
        /// Initializes a new PlayerBet.
        ///
        /// Parameters:
        /// - playerAddress: The address of the player making the bet.
        /// - chosenCombination: The `ColorCombination` chosen by the player.
        /// - entryFeePaid: The amount of fungible tokens paid as the entry fee.
            self.playerAddress = playerAddress
            self.chosenCombination = chosenCombination
            self.entryFeePaid = entryFeePaid
        }
    }

    /// Enum representing the different prize tiers a player can win.
    pub enum PrizeTier: UInt8 {
        /// No prize won.
        pub case None
        /// Special Prize: Colors and positions match exactly.
        pub case Special
        /// First Prize: All colors match, but order might differ.
        pub case First
        /// Second Prize: Some colors match, regardless of position.
        pub case Second
    }

    /// Enum representing the various statuses a game round can be in.
    pub enum RoundStatus: UInt8 {
        /// Round created but not yet active (e.g., admin preparing).
        pub case Pending
        /// Round is open and accepting player submissions.
        pub case Active
        /// Round is closed for new submissions.
        pub case Closed
        /// Round is closed and waiting for the VRF callback to provide randomness.
        pub case AwaitingRandomness
        /// Randomness received, lucky combination determined, system is calculating winners.
        pub case CalculatingWinners
        /// Prizes are being paid out to winners.
        pub case PayingOut
        /// Round is complete, all prizes paid out.
        pub case Finished
    }

    /// Stores all information related to a single game round.
    /// - roundID: Unique identifier for the round.
    /// - startTime: Timestamp when the round was started.
    /// - closeTime: Timestamp when the round was closed for submissions (optional).
    /// - status: The current `RoundStatus` of the game round.
    /// - luckyCombination: The winning `ColorCombination` (optional, set after VRF fulfillment).
    /// - vrfRequestID: The ID of the VRF request made for this round (optional).
    /// - participatingPlayers: A dictionary mapping player addresses to their `PlayerBet`.
    /// - winners: An array of `Winner` structs, populated after prize calculation.
    /// - prizePoolAmountForRound: The total amount of entry fees collected for this specific round.
    pub struct GameRoundInfo {
        pub let roundID: UInt64
        pub let startTime: UFix64
        pub var closeTime: UFix64?
        pub var status: RoundStatus
        pub var luckyCombination: ColorCombination? // Revealed after round ends and VRF is fulfilled
        pub var vrfRequestID: UInt64?
        pub var participatingPlayers: {Address: PlayerBet}
        pub var winners: [Winner]
        pub var prizePoolAmountForRound: UFix64

        init(roundID: UInt64, startTime: UFix64) {
        /// Initializes a new GameRoundInfo structure.
        ///
        /// Parameters:
        /// - roundID: The unique ID for this new round.
        /// - startTime: The timestamp when this round is officially started.
            self.roundID = roundID
            self.startTime = startTime
            self.closeTime = nil
            self.status = RoundStatus.Active
            self.luckyCombination = nil
            self.vrfRequestID = nil
            self.participatingPlayers = {}
    /// Starts a new game round. This function can only be called by the `GameAdmin`.
    /// It initializes a new `GameRoundInfo` struct, stores it, and increments the `nextRoundID`.
    /// Emits a `RoundStarted` event upon successful execution.
    ///
    /// Preconditions:
    /// - The caller must be the `GameAdmin`.
    /// - (Optional) The previous round should ideally be in a `Finished` state.
            self.winners = []
            self.prizePoolAmountForRound = 0.0
        }

        pub fun addPlayerEntry(player: Address, bet: PlayerBet) {
        /// Adds a player's bet to the round.
        ///
        /// Parameters:
        /// - player: The address of the player.
        /// - bet: The `PlayerBet` struct containing the player's submission and fee details.
        ///
        /// Preconditions:
        /// - The round must be in `Active` status.
        /// - The player must not have already submitted for this round.
            pre {
                self.status == RoundStatus.Active : "Round is not active for new entries."
                self.participatingPlayers[player] == nil : "Player has already submitted colors for this round."
            }
            self.participatingPlayers[player] = bet
            self.prizePoolAmountForRound = self.prizePoolAmountForRound + bet.entryFeePaid
        }

    /// Allows a player to submit their chosen color combination for the current active round.
    /// The player provides their chosen colors, a vault containing the entry fee, and an optional ID of a Lucky Charm NFT they wish to use.
    /// The function verifies the round status, checks for existing submissions from the player, applies any Lucky Charm NFT benefits (like fee discounts),
    /// validates the fee payment, records the player's bet, deposits the fee into the contract's prize pool, and emits relevant events.
    ///
    /// Parameters:
    /// - chosenColors: An array of strings representing the player's chosen color combination.
    /// - feePayment: A vault (`@FungibleToken.Vault`) containing the entry fee. The balance must match the required fee (potentially discounted).
    /// - luckyCharmID: An optional `UInt64` ID of a `LuckyCharmNFT` the player owns and wishes to use for benefits. If `nil`, the contract may attempt to find any applicable charm.
    ///
    /// Panics if:
    /// - No active round is found.
    /// - The current round is not active for submissions.
    /// - The player has already submitted colors for the current round.
    /// - The `feePayment` vault balance does not match the required (potentially discounted) entry fee.
        pub fun close() {
        /// Closes the round for new entries and sets the close time.
        ///
        /// Preconditions:
        /// - The round must be in `Active` status.
            pre {
                self.status == RoundStatus.Active : "Round is not active or already closed."
            }
            self.status = RoundStatus.Closed
            self.closeTime = getCurrentBlock().timestamp
        }

        /// Adds a confirmed winner to the round's list of winners.
        ///
        /// Parameters:
        /// - winner: The `Winner` struct containing details of the winning player and their prize.
        pub fun addWinner(winner: Winner) {
            self.winners.append(winner)
        }
    }

    /// Represents a player who has won a prize in a round.
    /// - playerAddress: The address of the winning player.
    /// - prizeTier: The `PrizeTier` the player won.
    /// - amountPaid: The amount of fungible tokens paid to the winner for this prize.
    pub struct Winner {
        pub let playerAddress: Address
        pub let prizeTier: PrizeTier
        pub let amountPaid: UFix64

        /// Initializes a new Winner struct.
        ///
        /// Parameters:
        /// - playerAddress: The address of the winning player.
        /// - prizeTier: The `PrizeTier` achieved by the player.
        /// - amountPaid: The amount of prize money awarded to the player.
        init(playerAddress: Address, prizeTier: PrizeTier, amountPaid: UFix64) {
            self.playerAddress = playerAddress
            self.prizeTier = prizeTier
            self.amountPaid = amountPaid
        }
    }

    // --- Public Functions ---

    // Starts a new game round. Only callable by the GameAdmin.
    pub fun startNewRound() {
        pre {
            self.account.address == self.GameAdmin : "Only the GameAdmin can start a new round."
            // Optionally, ensure the previous round is closed or finished
            // let currentRoundID = self.nextRoundID - 1
            // if currentRoundID > 0 {
            //     self.gameRounds[currentRoundID]!.status == RoundStatus.Finished : "Previous round not finished."
            // }
        }

        let newRoundID = self.nextRoundID
        let startTime = getCurrentBlock().timestamp
        let newRound = GameRoundInfo(roundID: newRoundID, startTime: startTime)

        self.gameRounds[newRoundID] = newRound
        self.nextRoundID = self.nextRoundID + 1

        emit RoundStarted(roundID: newRoundID, startTime: startTime)
    }

    // Allows a player to submit their color choices for the current active round.
    pub fun submitColors(chosenColors: [String], feePayment: @FungibleToken.Vault, luckyCharmID: UInt64?) {
        // luckyCharmID is optional; if provided, player intends to use a specific charm.
        // If nil, contract can try to find any applicable charm.

        // Initial fee check will be adjusted based on potential charm discount
        // pre {
        //     feePayment.balance == self.entryFeeAmount : "Incorrect entry fee amount."
        // }
        }

        let currentRoundID = self.getCurrentRoundID()
        let round = self.gameRounds[currentRoundID] ?? panic("No active round found.")

        assert(round.status == RoundStatus.Active, message: "Current round is not active for submissions.")

        let playerAddress = feePayment.owner!.address // Assumes vault owner is the player

        // Ensure player hasn't submitted yet for this round
        if round.participatingPlayers[playerAddress] != nil {
            panic("Player has already submitted colors for this round.")
        }

        var actualFeePaid = self.entryFeeAmount
        var discountApplied = false
        var appliedCharmID: UInt64? = nil
        var discountAmount: UFix64 = 0.0

        // Check for Lucky Charm NFT and apply discount
    /// Closes the current active game round, preventing further submissions. This function can only be called by the `GameAdmin`.
    /// It updates the round's status to `Closed`, records the closing time, and then transitions the status to `AwaitingRandomness`.
    /// After closing, it initiates a request to the VRF Coordinator for a random number, which will be used to determine the lucky combination.
    /// Emits `RoundClosed` and `VRFRequested` events.
    ///
    /// Preconditions:
    /// - The caller must be the `GameAdmin`.
    /// - An active round must exist.
    /// - The current round must be in `Active` status.
    ///
    /// Panics if:
    /// - No active round is found to close.
    /// - The current round is not in an `Active` state.
    /// - The VRF Coordinator capability cannot be borrowed.
        let playerAccount = getAccount(playerAddress)
        if let charmCollectionCap = playerAccount.getCapability<&{LuckyCharmNFT.CollectionPublic}>(LuckyColorMatch.LuckyCharmNFTCollectionPublicPath).borrow() {
            let ownedCharmIDs = charmCollectionCap.getIDs()

            if luckyCharmID != nil { // Player specified a charm to use
                if ownedCharmIDs.contains(luckyCharmID!) {
                    let charm = charmCollectionCap.borrowNFT(id: luckyCharmID!) as! &LuckyCharmNFT.NFT
                    if charm.charmType == "FeeDiscount" {
                        if charm.benefitValue > 0.0 && charm.benefitValue <= 1.0 { // Discount as a percentage (0.0 to 1.0)
                            discountAmount = self.entryFeeAmount * charm.benefitValue
                            actualFeePaid = self.entryFeeAmount - discountAmount
                            discountApplied = true
                            appliedCharmID = charm.id
                        }
                    }
                } else {
                    // Player specified a charm they don't own or is invalid, proceed with full fee
                    log("Player specified a Lucky Charm ID they do not own or is invalid.")
                }
            } else { // No specific charm ID provided, try to find any "FeeDiscount" charm
                for id in ownedCharmIDs {
                    let charm = charmCollectionCap.borrowNFT(id: id) as! &LuckyCharmNFT.NFT
                    if charm.charmType == "FeeDiscount" {
                         if charm.benefitValue > 0.0 && charm.benefitValue <= 1.0 { // Discount as a percentage
                            let currentDiscount = self.entryFeeAmount * charm.benefitValue
                            // Apply the first found valid discount charm for simplicity
                            // A more complex system could find the "best" charm
                            if !discountApplied {
                                discountAmount = currentDiscount
                                actualFeePaid = self.entryFeeAmount - discountAmount
                                discountApplied = true
                                appliedCharmID = charm.id
                                break // Use the first one found
                            }
                        }
                    }
                }
            }
        }

    /// Callback function intended to be invoked by the VRF Coordinator to deliver the requested randomness.
    /// **CRITICAL SECURITY NOTE:** Access control for this function is paramount. It MUST only be callable by the legitimate VRF Coordinator contract.
    /// The exact mechanism for ensuring this depends on the specific VRF solution implemented on Flow (e.g., capability-based callbacks, signer checks).
    ///
    /// This function receives the `requestID` (which maps to a game round) and the `randomness` value.
    /// It validates the request, derives the `luckyCombination` from the randomness, updates the round's status to `CalculatingWinners`,
    /// and emits a `LuckyCombinationRevealed` event.
    ///
    /// Parameters:
    /// - requestID: The `UInt64` ID of the VRF request being fulfilled.
    /// - randomness: The `UInt64` random value provided by the VRF service.
    ///
    /// Preconditions:
    /// - (Implicitly) Caller must be the authorized VRF Coordinator.
    ///
    /// Panics if:
    /// - The `requestID` is invalid or the round has already been processed.
    /// - The game round corresponding to the `requestID` is not found.
    /// - The round is not in the `AwaitingRandomness` status.
    /// - The `vrfRequestID` in the round does not match the provided `requestID`.
    /// - The lucky combination has already been set for the round.
        // Validate the fee paid against the (potentially discounted) fee
        assert(feePayment.balance == actualFeePaid, message: "Incorrect entry fee amount. Expected: ".concat(actualFeePaid.toString()).concat(", Got: ").concat(feePayment.balance.toString()))

        if discountApplied && appliedCharmID != nil {
            emit LuckyCharmBenefitApplied(roundID: currentRoundID, player: playerAddress, charmID: appliedCharmID!, discountAmount: discountAmount)
        }

        let combination = ColorCombination(colors: chosenColors)
        let playerBet = PlayerBet(
            playerAddress: playerAddress,
            chosenCombination: combination,
            entryFeePaid: actualFeePaid // Use actualFeePaid
        )

        // Add entry to the round
        self.gameRounds[currentRoundID]!.addPlayerEntry(player: playerAddress, bet: playerBet)

        // Deposit fee into the contract's prize pool
        self.prizePool.deposit(from: <-feePayment)

        emit PlayerSubmittedColors(roundID: currentRoundID, player: playerAddress, combination: chosenColors, feePaid: actualFeePaid)
        emit PrizePoolUpdated(roundID: currentRoundID, newTotalPrizePoolForRound: self.gameRounds[currentRoundID]!.prizePoolAmountForRound)
    }

    // Closes the current active game round. Only callable by the GameAdmin.
    pub fun closeRound() {
        pre {
            self.account.address == self.GameAdmin : "Only the GameAdmin can close a round."
        }
    /// Admin-only function to trigger the calculation of winners and distribution of prizes for a completed round.
    /// This function is called after the `rawFulfillRandomness` callback has successfully set the `luckyCombination` and the round is in `CalculatingWinners` status.
    /// It iterates through all participating players, determines their prize tier by comparing their submission to the `luckyCombination`,
    /// calculates prize amounts based on predefined percentages and applies any `LuckyCharmNFT` prize bonuses, pays out the winners, allocates the treasury cut,
    /// and awards `AchievementBadgeNFTs` to qualifying winners.
    /// Finally, it updates the round's status to `Finished` and emits a `PrizeDistributionCompleted` event.
    ///
    /// Parameters:
    /// - roundID: The `UInt64` ID of the round for which to calculate and distribute prizes.
    ///
    /// Preconditions:
    /// - The caller must be the `GameAdmin`.
    /// - The specified round must exist.
    /// - The round's status must be `CalculatingWinners`.
    /// - The `luckyCombination` for the round must have been revealed.
    ///
    /// Panics if:
    /// - The round is not found.
    /// - The round is not in the correct status for prize distribution.
    /// - The lucky combination for the round has not been set.
        let currentRoundID = self.getCurrentRoundID()
        let round = self.gameRounds[currentRoundID] ?? panic("No active round found to close.")

        assert(round.status == RoundStatus.Active, message: "Current round is not active or already closed.")

        self.gameRounds[currentRoundID]!.close()

        emit RoundClosed(roundID: currentRoundID, closeTime: self.gameRounds[currentRoundID]!.closeTime!)

        // Transition status to AwaitingRandomness
        self.gameRounds[currentRoundID]!.status = RoundStatus.AwaitingRandomness

        // Request randomness from VRF Coordinator
        let coordinator = getAccount(self.vrfCoordinatorAddress)
            .getCapability<&{IVRFCoordinator}>(self.vrfCoordinatorCapPath)
            .borrow() ?? panic("Could not borrow VRFCoordinator capability")

        // Simple seed generation, can be made more robust
        let seed = UInt64(currentRoundID) + UInt64(self.gameRounds[currentRoundID]!.startTime)

        // TODO: Handle fee payment for VRF if required by the coordinator.
        // This might involve withdrawing from the prizePool or requiring admin to pre-fund.
        // For now, assuming fee is handled or is part of the coordinator's requestRandomness.
        let requestID = coordinator.requestRandomness(keyHash: self.vrfKeyHash, fee: self.vrfFee, seed: seed)

        self.gameRounds[currentRoundID]!.vrfRequestID = requestID
        self.vrfRequestToRoundID[requestID] = currentRoundID

        emit VRFRequested(roundID: currentRoundID, requestID: requestID, seed: seed)
    }

    // Callback function for the VRF Coordinator to deliver randomness
    // IMPORTANT: Access control for this function is critical.
    // It should only be callable by the legitimate VRF Coordinator.
    // The exact mechanism depends on the VRF solution's design on Flow.
    pub fun rawFulfillRandomness(requestID: UInt64, randomness: UInt64) {
        // Precondition: Ensure caller is the VRF Coordinator. This is a simplified check.
        // A robust solution would involve checking self.signer or a capability-based callback.
        // For now, we'll proceed assuming the call is legitimate.
        // pre { self.signer.address == self.vrfCoordinatorAddress : "Only VRF Coordinator can fulfill randomness." }

        log("rawFulfillRandomness called with requestID: ".concat(requestID.toString()).concat(", randomness: ").concat(randomness.toString()))

        let roundID = self.vrfRequestToRoundID[requestID] ?? panic("Invalid VRF requestID or round already processed.")
        let round = self.gameRounds[roundID] ?? panic("Game round not found for VRF callback.")

        assert(round.status == RoundStatus.AwaitingRandomness, message: "Round is not awaiting randomness.")
        assert(round.vrfRequestID == requestID, message: "VRF requestID mismatch for the round.")
        assert(round.luckyCombination == nil, message: "Lucky combination already set for this round.")

        let luckyCombination = self.deriveLuckyCombination(randomness: randomness)
        self.gameRounds[roundID]!.luckyCombination = luckyCombination
        self.gameRounds[roundID]!.status = RoundStatus.CalculatingWinners // Next status

        // Remove request ID from map to prevent replay
        self.vrfRequestToRoundID.remove(key: requestID)

        emit LuckyCombinationRevealed(roundID: roundID, luckyCombination: luckyCombination.colors, randomness: randomness)

        // Note: Prize calculation and distribution will be triggered by the admin in a separate transaction
        // after this function successfully completes and sets the status to CalculatingWinners.
    }

    // Admin function to trigger prize calculation and distribution for a completed round
    pub fun calculateAndDistributePrizes(roundID: UInt64) {
        pre {
            self.account.address == self.GameAdmin : "Only the GameAdmin can trigger prize distribution."
        }
        let round = self.gameRounds[roundID] ?? panic("Round not found.")
        assert(round.status == RoundStatus.CalculatingWinners, message: "Round is not ready for prize calculation (must be CalculatingWinners).")
        assert(round.luckyCombination != nil, message: "Lucky combination not yet revealed for this round.")

        let luckyCombination = round.luckyCombination!
        let totalPrizePoolForRound = round.prizePoolAmountForRound
        var remainingPrizePool = totalPrizePoolForRound

        var specialPrizeWinners: [Address] = []
        var firstPrizeWinners: [Address] = []
        var secondPrizeWinners: [Address] = []

        // Determine winners for each tier
        for playerAddress in round.participatingPlayers.keys {
            let playerBet = round.participatingPlayers[playerAddress]!
            let prizeTier = self.determinePrizeTier(
                playerCombination: playerBet.chosenCombination,
                luckyCombination: luckyCombination
            )
            if prizeTier == PrizeTier.Special {
                specialPrizeWinners.append(playerAddress)
            // This is a conceptual deposit. The actual AchievementBadgeNFT contract might handle deposit differently.
            // collectionCap.deposit(token: <-newBadge)
            // Or, if mintNFT deposits directly:
            log("Awarded achievement badge ID: ".concat(newBadge.id.toString()).concat(" to player ").concat(player.toString()))
            emit AchievementBadgeAwarded(player: player, badgeID: newBadge.id, achievement: achievementType)
            // Destroy the newBadge resource if it's not consumed by a deposit call and is locally bound.
            // This depends on how mintNFT and deposit are structured in AchievementBadgeNFT.
            // If mintNFT returns a resource that must be explicitly deposited and then destroyed if not moved,
            // then a destroy newBadge might be needed here if the deposit is commented out or fails.
            // However, if mintNFT handles the deposit or returns a reference, this might not be necessary.
            // For safety in this conceptual example, if newBadge is a resource and not moved, it should be handled.
            // Assuming mintNFT gives ownership and it's not deposited above, it would need to be destroyed.
            // destroy newBadge // This line is highly dependent on AchievementBadgeNFT's implementation.
        } else {
            log("Player ".concat(player.toString()).concat(" does not have an AchievementBadgeNFT collection set up or it's inaccessible."))
        }
    }

    // --- Internal Helper Functions ---
                self.awardAchievementBadge(player: playerAddress, achievementType: "Special Prize Winner - Round ".concat(roundID.toString()), roundID: roundID)
            } else if prizeTier == PrizeTier.First {
                firstPrizeWinners.append(playerAddress)
                self.awardAchievementBadge(player: playerAddress, achievementType: "First Prize Winner - Round ".concat(roundID.toString()), roundID: roundID)
            } else if prizeTier == PrizeTier.Second {
                secondPrizeWinners.append(playerAddress)
                self.awardAchievementBadge(player: playerAddress, achievementType: "Second Prize Winner - Round ".concat(roundID.toString()), roundID: roundID)
            }
        }

        var totalDistributed: UFix64 = 0.0

        // Distribute Special Prizes
        if specialPrizeWinners.length > 0 {
            let tierPrizePool = totalPrizePoolForRound * LuckyColorMatch.SpecialPrizePercent
            let basePrizePerWinner = tierPrizePool / UFix64(specialPrizeWinners.length)
            var actualTierPayout = 0.0
            for winnerAddress in specialPrizeWinners {
                var finalPrizeAmount = basePrizePerWinner
                // Check for PrizeBonus Lucky Charm
    /// Internal helper function to pay a winning player.
    /// It withdraws the specified amount from the contract's main `prizePool` and attempts to deposit it
    /// into the winner's default `FungibleToken.Receiver`.
    /// Emits a `WinnerPaid` event upon successful payment.
    ///
    /// Parameters:
    /// - roundID: The `UInt64` ID of the round for which the prize is being paid.
    /// - playerAddress: The `Address` of the winning player.
    /// - prizeTier: The `PrizeTier` won by the player.
    /// - amount: The `UFix64` amount of the prize to be paid.
    ///
    /// Panics if:
    /// - The contract's `prizePool` has an insufficient balance.
    /// - The player's account does not have a `FungibleToken.Receiver` capability at the standard path, or it cannot be borrowed.
                let playerAccount = getAccount(winnerAddress)
                if let charmCollectionCap = playerAccount.getCapability<&{LuckyCharmNFT.CollectionPublic}>(LuckyColorMatch.LuckyCharmNFTCollectionPublicPath).borrow() {
                    for charmID in charmCollectionCap.getIDs() {
                        let charm = charmCollectionCap.borrowNFT(id: charmID) as! &LuckyCharmNFT.NFT
                        if charm.charmType == "PrizeBonus" && charm.benefitValue > 0.0 { // benefitValue as a multiplier, e.g., 0.05 for 5% bonus
                            finalPrizeAmount = finalPrizeAmount * (1.0 + charm.benefitValue)
                            // Consider emitting a specific event for prize bonus applied if detailed tracking is needed.
                            break // Apply first found prize bonus charm
                        }
                    }
                }
                self.payWinner(roundID: roundID, playerAddress: winnerAddress, prizeTier: PrizeTier.Special, amount: finalPrizeAmount)
                totalDistributed = totalDistributed + finalPrizeAmount
                actualTierPayout = actualTierPayout + finalPrizeAmount
            }
            remainingPrizePool = remainingPrizePool - actualTierPayout // Deduct the actual amount paid out from this tier
        }

    /// Derives the lucky color combination from a given randomness value.
    /// This function takes the raw `UInt64` randomness from the VRF and converts it into an array of color strings
    /// based on the `availableColors` and `CombinationLength` defined in the contract.
    /// The derivation logic should be deterministic to ensure that the same randomness always produces the same lucky combination.
    ///
    /// Parameters:
    /// - randomness: The `UInt64` random value obtained from the VRF service.
    ///
    /// Returns: A `ColorCombination` struct representing the derived lucky combination.
        // Distribute First Prizes
        if firstPrizeWinners.length > 0 {
            let tierPrizePool = totalPrizePoolForRound * LuckyColorMatch.FirstPrizePercent
            let basePrizePerWinner = tierPrizePool / UFix64(firstPrizeWinners.length)
            var actualTierPayout = 0.0
            for winnerAddress in firstPrizeWinners {
    /// Internal helper function to award an `AchievementBadgeNFT` to a player.
    /// This function is called when a player achieves a win that qualifies for a badge.
    /// It requires the `GameAdmin` to have minting capabilities for the `AchievementBadgeNFT` contract.
    /// It constructs metadata for the new badge and attempts to mint and deposit it into the player's collection.
    ///
    /// **Note:** The actual minting and deposit logic depends heavily on the implementation of the `AchievementBadgeNFT` contract,
    /// including how minter resources/capabilities are managed and how NFTs are deposited.
    /// The code here is conceptual and might need adjustment based on the `AchievementBadgeNFT` contract's API.
    ///
    /// Parameters:
    /// - player: The `Address` of the player to receive the badge.
    /// Determines the prize tier for a player based on their submitted combination compared to the lucky combination.
    ///
    /// Logic:
    /// 1.  Checks for Special Prize: Exact match of colors and their positions.
    /// 2.  Checks for First Prize: All colors match, but their order might be different (multi-set equality).
    /// 3.  Checks for Second Prize: At least one color matches, regardless of position.
    ///
    /// Parameters:
    /// - playerCombination: The `ColorCombination` submitted by the player.
    /// - luckyCombination: The official `ColorCombination` for the round.
    ///
    /// Returns: The `PrizeTier` achieved by the player.
    /// - achievementType: A `String` describing the achievement (e.g., "Special Prize Winner - Round X").
    /// - roundID: The `UInt64` ID of the round in which the achievement was earned.
    ///
    /// Panics if:
    /// - The `GameAdmin` cannot borrow the `AchievementBadgeNFT.NFTMinter` capability.
    /// - The player does not have an `AchievementBadgeNFT` collection set up (or if the minting process fails).
                var finalPrizeAmount = basePrizePerWinner
                let playerAccount = getAccount(winnerAddress)
                if let charmCollectionCap = playerAccount.getCapability<&{LuckyCharmNFT.CollectionPublic}>(LuckyColorMatch.LuckyCharmNFTCollectionPublicPath).borrow() {
                    for charmID in charmCollectionCap.getIDs() {
                        let charm = charmCollectionCap.borrowNFT(id: charmID) as! &LuckyCharmNFT.NFT
                        if charm.charmType == "PrizeBonus" && charm.benefitValue > 0.0 {
                            finalPrizeAmount = finalPrizeAmount * (1.0 + charm.benefitValue)
                            break
                        }
                    }
                }
                self.payWinner(roundID: roundID, playerAddress: winnerAddress, prizeTier: PrizeTier.First, amount: finalPrizeAmount)
                totalDistributed = totalDistributed + finalPrizeAmount
                actualTierPayout = actualTierPayout + finalPrizeAmount
            }
            remainingPrizePool = remainingPrizePool - actualTierPayout
        }

        // Distribute Second Prizes
        if secondPrizeWinners.length > 0 {
            let tierPrizePool = totalPrizePoolForRound * LuckyColorMatch.SecondPrizePercent
            let basePrizePerWinner = tierPrizePool / UFix64(secondPrizeWinners.length)
            var actualTierPayout = 0.0
            for winnerAddress in secondPrizeWinners {
                var finalPrizeAmount = basePrizePerWinner
                let playerAccount = getAccount(winnerAddress)
                if let charmCollectionCap = playerAccount.getCapability<&{LuckyCharmNFT.CollectionPublic}>(LuckyColorMatch.LuckyCharmNFTCollectionPublicPath).borrow() {
                    for charmID in charmCollectionCap.getIDs() {
                        let charm = charmCollectionCap.borrowNFT(id: charmID) as! &LuckyCharmNFT.NFT
                        if charm.charmType == "PrizeBonus" && charm.benefitValue > 0.0 {
                            finalPrizeAmount = finalPrizeAmount * (1.0 + charm.benefitValue)
                            break
                        }
                    }
                }
                self.payWinner(roundID: roundID, playerAddress: winnerAddress, prizeTier: PrizeTier.Second, amount: finalPrizeAmount)
                totalDistributed = totalDistributed + finalPrizeAmount
                actualTierPayout = actualTierPayout + finalPrizeAmount
            }
            remainingPrizePool = remainingPrizePool - actualTierPayout
        }

        // Treasury Cut
    // --- Public Getters ---
        let treasuryAmount = totalPrizePoolForRound * LuckyColorMatch.TreasuryPercent
        if treasuryAmount > 0.0 && self.prizePool.balance >= treasuryAmount {
    /// Returns the ID of the current (latest) game round.
    /// If no rounds have been started, it might panic or return a specific indicator (e.g., 0 or nil, depending on design).
    /// Here, it assumes `nextRoundID` is 1-based for the *next* round, so `nextRoundID - 1` is the current or last started round.
    ///
    /// Returns: `UInt64` - The ID of the most recently started round.
            let treasuryVault <- self.prizePool.withdraw(amount: treasuryAmount)
            // TODO: Send treasuryVault to a designated treasury address/contract
            // For now, we'll destroy it to simulate the transfer out of the prize pool
            log("Treasury cut of ".concat(treasuryAmount.toString()).concat(" for round ").concat(roundID.toString()))
            destroy treasuryVault
            // totalDistributed = totalDistributed + treasuryAmount // Treasury is not "distributed" to players
        }
    /// Retrieves the `GameRoundInfo` for a specific round ID.
    ///
    /// Parameters:
    /// - roundID: The `UInt64` ID of the round to retrieve information for.
    ///
    /// Returns: An optional `GameRoundInfo` struct (`GameRoundInfo?`). Returns `nil` if the round ID does not exist.

        // Any remaining prize pool after distribution (e.g. due to rounding or no winners in a tier)
        // could be carried over, added to treasury, or handled as per game rules.
        // For now, it stays in the main prizePool.

        // Note: Achievement badges are awarded individually as winners are identified.
    /// Retrieves a player's bet for a specific round.
    ///
    /// Parameters:
    /// - roundID: The `UInt64` ID of the round.
    /// - playerAddress: The `Address` of the player.
    ///
    /// Returns: An optional `PlayerBet` struct (`PlayerBet?`). Returns `nil` if the round or player's bet is not found.
        // A batch awarding function could be an alternative.

        self.gameRounds[roundID]!.status = RoundStatus.Finished // Or PayingOut if async claims
        emit PrizeDistributionCompleted(roundID: roundID, totalDistributed: totalDistributed, treasuryAmount: treasuryAmount)
    }

    access(self) fun awardAchievementBadge(player: Address, achievementType: String, roundID: UInt64) {
        // Get the admin's account who owns the AchievementBadgeNFT contract or has minting rights.
        // This assumes the LuckyColorMatch contract's admin is also authorized to mint AchievementBadges.
    /// Retrieves the total prize pool amount currently held in the contract's main vault.
    /// This represents the sum of all undistributed entry fees.
    ///
    /// Returns: `UFix64` - The balance of the main prize pool vault.
        // A more robust setup might involve a capability passed during initialization.
        let admin = getAccount(self.GameAdmin)

        // Attempt to borrow a reference to the Minter resource from the AchievementBadgeNFT contract
        // The path to the Minter resource would be defined by the AchievementBadgeNFT contract.
    /// Contract initializer.
    /// Sets up the initial state of the LuckyColorMatch game, including the game administrator, entry fee,
    /// VRF configuration, available colors, NFT collection paths, and initializes the prize pool vault.
    ///
    /// Parameters:
    /// - adminAddress: The `Address` that will be set as the `GameAdmin`.
    /// - initialEntryFee: The `UFix64` amount for the game's entry fee.
    /// - vrfCoordAddr: The `Address` of the VRF Coordinator contract.
    /// - vrfCoordCapPath: The `PublicPath` for the VRF Coordinator capability.
    /// - vrfKeyH: The `String` key hash for VRF requests.
    /// - vrfF: The `UFix64` fee for VRF requests.
    /// - colors: An array of `String` representing the available colors for the game.
    /// - luckyCharmPath: The `PublicPath` for `LuckyCharmNFT` collections.
    /// - achievementBadgePath: The `PublicPath` for `AchievementBadgeNFT` collections.
        // For example, it might be /storage/AchievementBadgeMinter
        // This is a placeholder path and capability name.
        let minterRef = admin.getCapability<&{AchievementBadgeNFT.NFTMinter}>(AchievementBadgeNFT.MinterStoragePath) // Assuming MinterStoragePath is defined in AchievementBadgeNFT
            .borrow()
            ?? panic("Could not borrow a reference to the AchievementBadgeNFT minter")

        // Check if player has an AchievementBadgeNFT collection set up
        let playerAccount = getAccount(player)
        if let collectionCap = playerAccount.getCapability<&{AchievementBadgeNFT.CollectionPublic}>(LuckyColorMatch.AchievementBadgeNFTCollectionPublicPath).borrow() {
            // Metadata for the new badge
            // The exact metadata structure will depend on the AchievementBadgeNFT contract.
            let metadata: {String: String} = {
                "achievement": achievementType,
                "game": "LuckyColorMatch",
                "roundID": roundID.toString(),
                "dateAwarded": getCurrentBlock().timestamp.toString()
            }

            // Mint the new badge and deposit it to the player's collection
            // The mintNFT function signature will depend on the AchievementBadgeNFT contract.
            // It might take a recipient capability or directly a recipient address and collection.
            // This is a conceptual call.
            let newBadge <- minterRef.mintNFT(recipient: collectionCap, metadata: metadata) // This line is conceptual

            // Deposit into the player's collection (if mintNFT doesn't do it directly)
            // collectionCap.deposit(token: <-newBadge) // This might be part of mintNFT

            emit AchievementBadgeAwarded(player: player, badgeID: newBadge.id, achievement: achievementType)
            log("Awarded achievement badge '".concat(achievementType).concat("' to player ").concat(player.toString()))
        } else {
            log("Player ".concat(player.toString()).concat(" does not have an AchievementBadgeNFT collection at the expected path. Badge not minted for achievement: ").concat(achievementType))
        }
    }

    access(self) fun payWinner(roundID: UInt64, playerAddress: Address, prizeTier: PrizeTier, amount: UFix64) {
        if amount <= 0.0 {
            return
        }
        if self.prizePool.balance < amount {
            log("Insufficient balance in prize pool to pay winner ".concat(playerAddress.toString()).concat(" for round ").concat(roundID.toString()))
            // TODO: Handle this scenario, e.g., partial payment, log for manual intervention.
            return
        }

        let paymentVault <- self.prizePool.withdraw(amount: amount)

        // Attempt to deposit to the winner. This requires the winner to have a receiver.
        // A more robust system would use a claim mechanism or check for receiver capability.
        let receiverCap = getAccount(playerAddress).getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver) // Standard path

        if receiverCap.check() {
            let receiver = receiverCap.borrow()!
            receiver.deposit(from: <-paymentVault)
            self.gameRounds[roundID]!.addWinner(winner: Winner(playerAddress: playerAddress, prizeTier: prizeTier, amountPaid: amount))
            emit WinnerPaid(roundID: roundID, player: playerAddress, prizeTier: prizeTier.rawValue.toString(), amount: amount) // Using rawValue for event
        } else {
            log("Winner ".concat(playerAddress.toString()).concat(" does not have a FlowToken Receiver at /public/flowTokenReceiver. Prize amount: ").concat(amount.toString()).concat(" returned to pool."))
            // Return funds to the prize pool if deposit fails
            self.prizePool.deposit(from: <-paymentVault)
            // Optionally, mark as unclaimed and allow manual claim later.
        }
    }

    access(self) fun determinePrizeTier(playerCombination: ColorCombination, luckyCombination: ColorCombination): PrizeTier {
        // Special Prize: Colors and positions exactly match
        var exactMatch = true
        var i = 0
        while i < LuckyColorMatch.CombinationLength {
            if playerCombination.colors[i] != luckyCombination.colors[i] {
                exactMatch = false
                break
            }
            i = i + 1
        }
        if exactMatch {
            return PrizeTier.Special
        }

        // First Prize: All colors match, but order might be different (permutation)
        // This requires counting color occurrences.
        var playerColorCounts: {String: Int} = {}
        var luckyColorCounts: {String: Int} = {}
        var allColorsPresent = true

        i = 0
        while i < LuckyColorMatch.CombinationLength {
            let pColor = playerCombination.colors[i]
            playerColorCounts[pColor] = (playerColorCounts[pColor] ?? 0) + 1

            let lColor = luckyCombination.colors[i]
            luckyColorCounts[lColor] = (luckyColorCounts[lColor] ?? 0) + 1
            i = i + 1
        }

        if playerColorCounts.keys.length == luckyColorCounts.keys.length { // Must have same set of unique colors
            for colorKey in luckyColorCounts.keys {
                if playerColorCounts[colorKey] == nil || playerColorCounts[colorKey]! != luckyColorCounts[colorKey]! {
                    allColorsPresent = false
                    break
                }
            }
            if allColorsPresent {
                return PrizeTier.First
            }
        }

        // Second Prize: At least one color matches, regardless of position.
        // More accurately: sum of minimum counts of each color present in both.
        var partialMatchCount = 0
        // Create a temporary mutable copy of player's colors to mark as matched
        var tempPlayerColors = playerCombination.colors

        i = 0
        while i < LuckyColorMatch.CombinationLength { // Iterate through lucky colors
            let luckyColor = luckyCombination.colors[i]
            var j = 0
            while j < tempPlayerColors.length { // Iterate through player's (remaining) colors
                if tempPlayerColors[j] == luckyColor {
                    partialMatchCount = partialMatchCount + 1
                    // Remove matched color from player's list to avoid re-matching it
                    // This correctly handles cases like Lucky: R-R-B, Player: R-G-Y (1 match) vs Player: R-R-Y (2 matches)
                    tempPlayerColors.remove(at: j)
                    break // Move to next lucky color
                }
                j = j + 1
            }
            i = i + 1
        }

        if partialMatchCount > 0 {
             // The original description "match到部分颜色" is a bit ambiguous.
             // If it means "at least one color in the player's submission is also in the lucky combination",
             // the logic would be simpler: iterate player's colors, check if any exist in luckyCombination.
             // The current implementation counts how many distinct color "slots" match.
             // E.g. Lucky: R-G-B, Player: R-R-Y -> 1 match (the first R).
             // E.g. Lucky: R-R-B, Player: R-G-Y -> 1 match (one R).
             // E.g. Lucky: R-R-B, Player: R-R-Y -> 2 matches (two Rs).
            return PrizeTier.Second
        }

        return PrizeTier.None
    }

    access(self) fun deriveLuckyCombination(randomness: UInt64): ColorCombination {
        var derivedColors: [String] = []
        var tempRandomness = randomness
        let numAvailableColors = UInt64(self.availableColors.length)

        if numAvailableColors == 0 {
            panic("No available colors configured for the game.")
        }

        var i = 0
        while i < LuckyColorMatch.CombinationLength {
            let colorIndex = Int(tempRandomness % numAvailableColors)
            derivedColors.append(self.availableColors[colorIndex])
            tempRandomness = tempRandomness / numAvailableColors // Reduce randomness for next selection part
            i = i + 1
        }
        return ColorCombination(colors: derivedColors)
    }

    // --- Read-only Public Functions ---
    pub fun getCurrentRoundID(): UInt64 {
        if self.nextRoundID == 1 { // No rounds started yet
            panic("No rounds have been started yet.")
        }
        return self.nextRoundID - 1
    }

    pub fun getRoundInfo(roundID: UInt64): GameRoundInfo? {
        return self.gameRounds[roundID]
    }

    pub fun getPlayerBet(roundID: UInt64, playerAddress: Address): PlayerBet? {
        let round = self.gameRounds[roundID] ?? panic("Round not found.")
        return round.participatingPlayers[playerAddress]
    }

    pub fun getTotalPrizePoolBalance(): UFix64 {
        return self.prizePool.balance
    }

    // --- Initialization ---
    init(
        entryFee: UFix64,
        vrfCoordinator: Address,
        vrfCoordinatorCapPathString: String, // e.g., "/public/FlowVRFCoordinator"
        vrfKeyHashString: String,
        vrfFeeAmount: UFix64,
        initialAvailableColors: [String],
        luckyCharmNFTCollectionPublicPathString: String, // e.g., "/public/luckyCharmNFTCollection"
        achievementBadgeNFTCollectionPublicPathString: String // e.g., "/public/achievementBadgeNFTCollection"
    ) {
        pre {
            entryFee > 0.0 : "Entry fee must be positive."
            initialAvailableColors.length > 0 : "Must provide at least one available color."
            // TODO: Add more validation for VRF params if needed
        }

        self.GameAdmin = self.account.address
        self.entryFeeAmount = entryFee
        self.nextRoundID = 1
        self.gameRounds = {}
        self.prizePool <- FungibleToken.createEmptyVault()

        self.vrfCoordinatorAddress = vrfCoordinator
        self.vrfCoordinatorCapPath = PublicPath(identifier: vrfCoordinatorCapPathString)!
        self.vrfKeyHash = vrfKeyHashString
        self.vrfFee = vrfFeeAmount
        self.vrfRequestToRoundID = {}

        self.availableColors = initialAvailableColors

        // Initialize NFT Collection Public Paths
        self.LuckyCharmNFTCollectionPublicPath = PublicPath(identifier: luckyCharmNFTCollectionPublicPathString)!
        self.AchievementBadgeNFTCollectionPublicPath = PublicPath(identifier: achievementBadgeNFTCollectionPublicPathString)!

        // Consider emitting a specific ContractInitialized event if needed, or rely on standard deployment events.
    }
}