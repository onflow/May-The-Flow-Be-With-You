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

### Next Steps

1. **Admin Resource Implementation**
   - Create Admin resource for managing contract
   - Add admin-only functions for bet management
   - Implement access control

2. **Core Game Functions**
   - Implement placeBet function
   - Add rollDice function with randomness
   - Create bet resolution logic
   - Add game state transition logic

3. **User Info Storage**
   - Implement commented userInfo storage
   - Add UserInfo struct for tracking:
     - User statistics
     - Balance history
     - Game history

4. **Bet Management**
   - Implement bet validation
   - Add bet resolution rules
   - Create payout calculation logic

5. **Testing & Validation**
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

---

## 3. Access Control Plan
- Implement Admin resource for contract management
- Add user authentication for game actions
- Create role-based access control

---

## 4. Extensibility
- Structure allows for easy addition of new bet types
- Game state system supports future game phases
- Modular design for adding new features

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
| Admin Resource    | resource                     | Pending     | Create and implement         |

---

Let me know if you want to focus on implementing any specific component from the next steps! 