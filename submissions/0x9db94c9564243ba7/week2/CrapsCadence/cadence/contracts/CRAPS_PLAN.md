# Craps Contract Pseudocode & Data Structure Plan

## 1. Main Data Structures

### Game Struct
```
struct Game {
    state: GameState           // Enum: NoBets, ComeOut, Point, Resolved
    point: Optional<Int>       // The current point (if any)
    bets: {String: Bet}        // Dictionary of bet type to Bet struct
    history: [RollResult]      // Array of previous rolls (optional, for audit)
}
```

### Bet Struct
```
struct Bet {
    betType: String            // e.g., "PassLine", "Field", etc.
    amount: UFix64
    isActive: Bool
    // Add more fields as needed for bet resolution
}
```

### RollResult Struct (optional, for history/audit)
```
struct RollResult {
    dice1: Int
    dice2: Int
    total: Int
    timestamp: UFix64
}
```

### GameState Enum
```
enum GameState {
    NoBets
    ComeOut
    Point
    Resolved
}
```

---

## 2. Storage

### User Games
```
var userGames: {Address: Game}   // Maps user address to their current game state
```

### User Info (optional, for stats, balances, etc.)
```
var userInfo: {Address: UserInfo}
```

---

## 3. Allowed Bets

### Allowed Bets by State
```
var allowedBets: {GameState: [String]}   // e.g., {ComeOut: ["PassLine", "Field"], Point: ["Odds", "Hardways", ...]}
```
- This allows you to easily add new bet types for each state.

---

## 4. Core Functions (Pseudocode)

### Place Bet
```
function placeBet(user: Address, betType: String, amount: UFix64) {
    let game = userGames[user]
    assert(betType in allowedBets[game.state])
    // Add or update bet in game.bets
}
```

### Roll Dice
```
function rollDice(user: Address) {
    let game = userGames[user]
    // Use VRF or commit-reveal for randomness
    // Update game state and resolve bets as needed
    // If point is established, set game.point
    // If resolved, payout and reset game
}
```

### Add New Bet Type (Admin)
```
function addAllowedBet(state: GameState, betType: String) {
    allowedBets[state].append(betType)
}
```

### Get User Game State
```
function getGameState(user: Address): GameState {
    return userGames[user].state
}
```

---

## 5. Access Control
- Only the user can interact with their own game struct (enforced by checking `msg.sender` or `auth` in Cadence).
- Admin-only functions for adding new bet types.

---

## 6. Extensibility
- To add new bets, just add a new BetType and update the allowedBets mapping.
- You can expand the Bet struct to include more complex bet logic as needed.

---

## Summary Table

| Component         | Type/Structure                | Purpose                                 |
|-------------------|------------------------------|-----------------------------------------|
| Game              | struct                       | Tracks state, point, bets, history      |
| Bet               | struct                       | Represents a single bet                 |
| RollResult        | struct (optional)            | Stores roll outcomes                    |
| GameState         | enum                         | Tracks phase of the game                |
| userGames         | {Address: Game}              | Maps users to their game state          |
| allowedBets       | {GameState: [String]}        | Allowed bets per game phase             |
| userInfo          | {Address: UserInfo} (opt.)   | Stores user stats/info                  |

---

Let me know if you want this mapped to Cadence syntax, or if you want to see how to handle randomness (VRF/commit-reveal) in this structure! 