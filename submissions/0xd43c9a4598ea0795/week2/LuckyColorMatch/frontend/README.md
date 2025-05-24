# Lucky Color Match - Frontend

This is the Next.js frontend application for the Lucky Color Match game, a decentralized application (dApp) built on the Flow blockchain.

## Overview

The frontend allows users to:
- Connect their Flow wallet.
- View current game information (entry fee, available colors, combination length, current round ID).
- Set up their account to interact with the game contracts (e.g., create necessary resource storage).
- (Placeholder) Select a combination of colors and submit their entry for the current round.
- (Placeholder) View their past entries and results.

## Project Structure

The main components of the frontend are organized as follows:

-   **`pages/`**: Contains the Next.js page components.
    -   `index.js`: The main landing page and game interface.
-   **`services/`**: Contains services for interacting with external systems.
    -   `flowService.js`: Handles all interactions with the Flow blockchain, including authentication, querying contract data, and sending transactions.
-   **`flow/`**: Contains Flow blockchain related configurations.
    -   `config.js`: Configures the Flow Client Library (FCL) with network details and contract addresses/aliases for the emulator environment.
-   **`public/`**: Static assets.
-   **`components/`**: (If any, for reusable UI elements - currently not explicitly shown but a common Next.js practice).

## Prerequisites

-   Node.js (v16 or later recommended)
-   npm or yarn
-   Flow CLI installed and configured (for local development and emulator)
-   Flow Emulator running
-   FCL Dev Wallet running (for local development)

## Setup and Running Locally

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd <repository-url>/luckycolormatch-frontend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Ensure Flow Emulator is Running:**
    Navigate to the `LuckyColorMatch` project root (the directory containing `flow.json`) and start the emulator:
    ```bash
    flow emulator
    ```
    *Note: Ensure your `flow.json` has the contracts deployed and accounts configured as expected by `luckycolormatch-frontend/flow/config.js`.*

4.  **Ensure FCL Dev Wallet is Running:**
    In a new terminal, start the FCL Dev Wallet:
    ```bash
    fcl-dev-wallet
    ```
    This typically runs on `http://localhost:8701`.

5.  **Configure Contract Addresses (if necessary):**
    The frontend is pre-configured to work with the emulator addresses defined in `luckycolormatch-frontend/flow/config.js`. If your emulator's contract deployment addresses are different, update them in this file:
    ```javascript
    // luckycolormatch-frontend/flow/config.js
    const LUCKY_COLOR_MATCH_ADDRESS = "0xf8d6e0586b0a20c7"; // Update if different
    // ... other addresses
    ```

6.  **Run the Frontend Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application will typically be available at `http://localhost:3000`.

## Interacting with the Game

1.  **Open the Application:** Navigate to `http://localhost:3000` in your browser.
2.  **Log In:** Click the "Log In with Wallet" button. This will redirect you to the FCL Dev Wallet (or your configured wallet provider) to authenticate.
3.  **Set Up Account:** After logging in, if this is your first time or your account isn't fully set up for the game's tokens and NFTs, click the "Setup Account" button. This transaction initializes the necessary storage paths in your Flow account.
4.  **View Game Information:** The main page displays current game details like entry fee, available colors, etc.
5.  **Play the Game (Placeholder):** The UI for selecting colors and submitting an entry is currently a placeholder. Future development will implement this functionality, allowing users to:
    -   Choose the required number of colors from the available options.
    -   Optionally select a Lucky Charm NFT they own to apply potential benefits (e.g., fee discount).
    -   Submit their chosen color combination by sending a transaction, which includes paying the entry fee.

## Frontend-Blockchain Interaction

The frontend interacts with the Flow blockchain via the Flow Client Library (FCL).

-   **Configuration (`flow/config.js`):**
    -   Sets up FCL with the access node API endpoint (e.g., `http://localhost:8888` for the emulator).
    -   Defines the discovery wallet endpoint (e.g., `http://localhost:8701/fcl/authn` for the FCL Dev Wallet).
    -   Maps contract names/aliases to their deployed addresses on the configured network (emulator by default). This allows Cadence scripts and transactions to use imports like `import LuckyColorMatch from "LuckyColorMatch"`.

-   **Service Layer (`services/flowService.js`):**
    -   **Authentication:** Implements `fcl.logIn()`, `fcl.unauthenticate()`, and `fcl.currentUser.snapshot()` for user session management.
    -   **Querying Data (Scripts):**
        -   Uses `fcl.query` to execute read-only Cadence scripts against the Flow blockchain.
        -   Functions like `getLuckyColorMatchEntryFee()`, `getAvailableColors()`, `getCurrentRoundID()`, etc., wrap specific Cadence scripts defined inline.
        -   These scripts fetch data directly from the `LuckyColorMatch` smart contract.
    -   **Sending Transactions (Mutations):**
        -   Uses `fcl.mutate` to send transactions that can change the state on the blockchain.
        -   Functions like `setupAccount()` and `submitPlayerColors()` wrap Cadence transactions.
        -   These transactions require user authorization (via their wallet) and interact with contracts like `FungibleToken`, `NonFungibleToken`, `LuckyCharmNFT`, `AchievementBadgeNFT`, and `LuckyColorMatch`.
        -   The `submitPlayerColors` transaction, for example, handles withdrawing the entry fee from the user's Flow token vault and records their color submission in the `LuckyColorMatch` contract.

## Dependencies

-   **Next.js:** React framework for server-side rendering and static site generation.
-   **React:** JavaScript library for building user interfaces.
-   **@onflow/fcl:** Flow Client Library for interacting with the Flow blockchain.
-   **@onflow/types:** Provides type-checking for arguments passed to Cadence scripts and transactions.

(This list might not be exhaustive. Refer to `package.json` for a full list of dependencies.)