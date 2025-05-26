# Craps Contract Pseudocode & Data Structure Plan

## 1. Current Implementation Status

### Implemented
- Basic contract structure
- Game and Bet structs
- GameState enum
- Storage for userGames and allowedBets
- Initial allowed bets configuration:
  - COMEOUT: ["PASS", "FIELD"]
  - POINT: ["COME", "FIELD", "CRAPS", "YO", "2", "3", "4", "5", "6", "8", "9", "10", "11", "12", "Odds"]
- CrapsAdmin resource structure
- Token vaults storage for multiple fungible tokens

### Next Steps

1. **Bet Management**
   - Implement bet validation
   - Add bet resolution rules
   - Create payout calculation logic

2. **Admin Resource Implementation**
   - Implement CrapsAdmin functions:
     - Transfer coins from Craps Vault
     - Add new token vaults
     - Add new bet types
   - Complete access control implementation

3. **User Info Storage**
   - Implement commented userInfo storage
   - Add UserInfo struct for tracking:
     - User statistics
     - Balance history
     - Game history

4. **Testing & Validation**
   - Create test cases for all game states
   - Implement bet validation tests
   - Add integration tests

## 1. Main Data Structures

### Game Struct
```
struct Game {
    state: GameState           // Enum: NoBets, ComeOut, Point, Resolved
    point: Optional<Int>       // The current point (if any)
    pointAmount: Optional<UFix64> // Amount for point bet
    come: Optional<Int>        // Come bet point value
    bets: {String: Bet}        // Dictionary of bet type to Bet struct
}
```

### Bet Struct
```
struct Bet {
    betType: String            // e.g., "PASS", "FIELD", etc.
    amount: UFix64
}
```

### GameState Enum
```
enum GameState: UInt8 {
    NOBETS     // No Bets currently
    COMEOUT    // COMEOUT Bets
    POINT      // POINT Bets
    RESOLVED   // TBD State
}
```

---

## 2. Storage

### User Games
```
var userGames: {Address: Game}   // Maps user address to their current game state
```

### Allowed Bets
```
var allowedBets: {GameState: [String]}   // Maps game state to allowed bet types
```

### Token Vaults
```
var tokenVaults: @{String: {FungibleToken.Vault}}   // Multiple fungible token vaults
```

---

## 3. Access Control Plan
- CrapsAdmin resource for contract management
- Admin functions for:
  - Transferring coins from Craps Vault
  - Adding new token vaults
  - Adding new bet types
- User authentication for game actions
- Role-based access control

---

## 4. Extensibility
- Structure allows for easy addition of new bet types
- Game state system supports future game phases
- Modular design for adding new features
- Support for multiple fungible tokens

---

## Summary Table

| Component         | Type/Structure                | Status      | Next Steps                    |
|-------------------|------------------------------|-------------|------------------------------|
| Game              | struct                       | Implemented | Add game logic functions     |
| Bet               | struct                       | Implemented | Add bet resolution logic     |
| GameState         | enum                         | Implemented | Complete state transitions   |
| userGames         | {Address: Game}              | Implemented | Add game management          |
| allowedBets       | {GameState: [String]}        | Implemented | Add new bet types            |
| userInfo          | {Address: UserInfo}          | Pending     | Implement storage            |
| Admin Resource    | resource                     | Implemented | Complete admin functions     |
| Token Vaults      | {String: {Vault}}            | Implemented | Add token management         |