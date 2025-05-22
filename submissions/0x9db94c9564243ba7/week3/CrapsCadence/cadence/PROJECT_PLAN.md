# Craps Contract Project Plan

## Overview
This project implements a craps game as a smart contract in Cadence. The game logic follows the standard flow of craps, allowing users to place bets, roll dice, and resolve outcomes according to the rules of the game.

---

## Game Flow

### 1. Game Start
- Prompt the user to place a bet.

### 2. User Has No Bets
- User can place one or more of the following bets:
  - Pass Line
  - Don't Pass Line
  - Field
  - (Other bets may be added later)

### 3. Come Out Roll (First Roll)
- If user bets Pass Line:
  - Roll dice.
    - If roll is 7 or 11: User wins (payout, game resets)
    - If roll is 2, 3, or 12 (Craps): User loses (payout, game resets)
    - If roll is 4, 5, 6, 8, 9, or 10: That number becomes the "Point"

### 4. Point Phase
- While the Point is active:
  - User can place additional bets:
    - Backing bet (Odds)
    - Come bet
    - Hardways
    - Field bet
  - Roll dice repeatedly until:
    - If roll matches the Point: User wins (payout, game resets)
    - If roll is 7: User loses (payout, game resets)
    - Other numbers: Continue rolling

### 5. Other Bets
- Don't Pass Line: Similar flow, but win/lose conditions are reversed for some rolls.
- Field, Hardways, etc.: Resolved according to their own rules, possibly in parallel with main Pass/Don't Pass flow.

---

## Key States
- No Bets: User must place a bet to start.
- Come Out Roll: First roll after bet.
- Point Established: If come out roll is 4, 5, 6, 8, 9, or 10.
- Point Phase: User can place more bets, rolls continue until Point or 7 is rolled.
- Resolution: Payouts and game resets after win/loss.

---

## Main Actions
- Place bet (Pass Line, Don't Pass, Field, etc.)
- Roll dice
- Establish Point (if needed)
- Allow additional bets (Odds, Come, Hardways, Field)
- Roll until Point or 7
- Payout and reset

---

## Next Steps
- Implement remove bets & clear table logic
- Implement payout and reset logic
- Add support for additional bet types 