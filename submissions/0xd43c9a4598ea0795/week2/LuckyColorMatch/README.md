# Lucky Color Match &amp; Full Project Guide

## Table of Contents
- [Lucky Color Match \& Full Project Guide](#lucky-color-match--full-project-guide)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Features](#features)
  - [Local Development Setup](#local-development-setup)
    - [Prerequisites for Local Development](#prerequisites-for-local-development)
    - [Installation for Local Development](#installation-for-local-development)
    - [Running the Application Locally (Usage)](#running-the-application-locally-usage)
  - [Deployment](#deployment)
    - [1. Flow Contracts Deployment](#1-flow-contracts-deployment)
      - [Prerequisites for Contract Deployment](#prerequisites-for-contract-deployment)
      - [Understanding flow.json](#understanding-flowjson)
      - [Deployment to Flow Emulator (Contracts)](#deployment-to-flow-emulator-contracts)
      - [Deployment to Flow Testnet (Contracts)](#deployment-to-flow-testnet-contracts)
      - [Deployment to Flow Mainnet (Contracts)](#deployment-to-flow-mainnet-contracts)
      - [Updating Deployed Contracts](#updating-deployed-contracts)
      - [Troubleshooting Common Contract Deployment Issues](#troubleshooting-common-contract-deployment-issues)
    - [2. Frontend Application Deployment](#2-frontend-application-deployment)
      - [Prerequisites for Frontend Deployment](#prerequisites-for-frontend-deployment)
      - [Deployment to Vercel (Recommended)](#deployment-to-vercel-recommended)
        - [Step 1: Sign Up/Log In to Vercel](#step-1-sign-uplog-in-to-vercel)
        - [Step 2: Import Your Project](#step-2-import-your-project)
        - [Step 3: Configure Your Project](#step-3-configure-your-project)
        - [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
        - [Step 5: Deploy](#step-5-deploy)
        - [Step 6: Access Your Deployed Site](#step-6-access-your-deployed-site)
      - [Alternative Frontend Deployment Options](#alternative-frontend-deployment-options)
      - [Post-Deployment (Frontend)](#post-deployment-frontend)
      - [Troubleshooting Common Frontend Deployment Issues](#troubleshooting-common-frontend-deployment-issues)
  - [Project Structure (Frontend)](#project-structure-frontend)
  - [Frontend-Blockchain Interaction](#frontend-blockchain-interaction)
  - [Key Dependencies](#key-dependencies)
  - [Contributing](#contributing)
  - [License](#license)

---

## Project Overview

Welcome to Lucky Color Match, an engaging decentralized application (dApp) built on the robust and scalable Flow blockchain! This project provides a transparent, fair, and exciting gaming experience where players test their luck and intuition by predicting a secret combination of colors.

**What is Lucky Color Match?**

Lucky Color Match is more than just a game; it's a demonstration of the power and potential of Web3 technologies. Users can connect their existing Flow wallets (or create new ones) to seamlessly interact with the game's smart contracts. The core gameplay revolves around rounds, where a secret color combination is determined (potentially using a Verifiable Random Function - VRF for on-chain randomness, ensuring fairness). Players submit their chosen color combinations by paying an entry fee in FLOW tokens. At the end of each round, the winning combination is revealed, and prizes are distributed among the winners.

**Our Vision:**

We aim to create a fun, accessible, and provably fair gaming platform that showcases the unique capabilities of the Flow blockchain, such as its resource-oriented programming model with Cadence, easy user onboarding with FCL (Flow Client Library), and the potential for rich NFT integrations. This frontend application serves as the primary user interface for interacting with the Lucky Color Match ecosystem.

**Key Aspects of the dApp:**

*   **Decentralized Gameplay:** All core game logic, including round management, entry submissions, and prize distribution, is handled by smart contracts deployed on the Flow blockchain. This ensures transparency and immutability.
*   **User-Friendly Interface:** The Next.js frontend is designed to be intuitive, allowing users to easily connect their wallets, understand game rules, view game status, and participate in rounds.
*   **NFT Integration:** The game plans to incorporate Non-Fungible Tokens (NFTs) to enhance the player experience:
    *   **Lucky Charm NFTs:** These NFTs might offer players certain advantages, such as entry fee discounts or bonus multipliers.
    *   **Achievement Badge NFTs:** Players can earn unique, non-transferable badges for reaching milestones or achievements within the game, showcasing their prowess and engagement.
*   **Community Focus:** (Future) We envision a vibrant community around Lucky Color Match, with potential for leaderboards, special events, and governance features.

This README will guide you through understanding the project's architecture, features, setup, usage, and how you can contribute to its development.

---

## Features

Lucky Color Match offers a range of features designed to provide an engaging and seamless Web3 gaming experience.

**Core Gameplay Features:**

*   **Wallet Integration:**
    *   Connect and authenticate with various Flow-compatible wallets using FCL (e.g., Blocto, Lilico, FCL Dev Wallet for local development).
    *   Persistent user sessions.
*   **Account Setup:**
    *   One-click account initialization to set up necessary storage resources for game tokens (e.g., FLOW for entry fees) and NFTs (Lucky Charms, Achievement Badges) within the user's Flow account.
*   **Game Information Display:**
    *   Real-time display of current game parameters fetched directly from the smart contract:
        *   Current Round ID
        *   Entry Fee (in FLOW tokens)
        *   List of Available Colors for selection
        *   Required Length of the Color Combination
        *   Current Prize Pool
        *   Round Status (e.g., Open for entries, Closed, Calculating Winners, Ended)
*   **Color Combination Submission:**
    *   Intuitive interface for players to select their desired color combination from the available options.
    *   Secure submission of the chosen combination along with the entry fee via a Flow transaction.
    *   (Planned) Integration with Lucky Charm NFTs to apply benefits during submission.
*   **Round Mechanics:**
    *   Clearly defined game rounds with distinct phases (entry, processing, results).
    *   (Planned) Transparent determination of winning color combinations, potentially leveraging on-chain randomness solutions.
*   **Prize Distribution:**
    *   (Planned) Automated and transparent distribution of the prize pool to winners at the end of each round, managed by the smart contract.
*   **Player History:**
    *   (Placeholder/Planned) Ability for players to view their past entries, the outcomes of those rounds, and any prizes won.

**NFT-Related Features:**

*   **Lucky Charm NFTs:**
    *   (Planned) View owned Lucky Charm NFTs within the dApp.
    *   (Planned) Select and apply a Lucky Charm NFT during entry submission for potential benefits (e.g., reduced entry fee, increased prize share).
    *   (Planned) Information on how to acquire Lucky Charm NFTs.
*   **Achievement Badge NFTs:**
    *   (Planned) View earned Achievement Badges.
    *   (Planned) Milestones and conditions for earning different badges. These are non-transferable and serve as a testament to a player's accomplishments.

**User Experience &amp; Interface:**

*   **Responsive Design:** The frontend is designed to be accessible and usable across various devices (desktop, tablet, mobile).
*   **Real-time Updates:** Key game information and user balances are updated in real-time by querying the Flow blockchain.
*   **Clear Transaction Feedback:** Users receive clear notifications about the status of their transactions (e.g., pending, successful, failed).
*   **Error Handling:** Graceful handling of common errors and informative messages to guide users.

**Administrative Features (via Smart Contracts, potentially with a separate admin UI in the future):**

*   **Game Management:**
    *   Start new game rounds.
    *   Close rounds for entry.
    *   Trigger prize calculation and distribution.
    *   Update game parameters (e.g., entry fee, available colors) if designed to be configurable.

**Future/Planned Features:**

*   **Enhanced NFT Utility:** More diverse effects and interactions for Lucky Charm and Achievement Badge NFTs.
*   **Leaderboards:** Global and potentially time-based leaderboards to foster competition.
*   **Social Sharing:** Allow users to share their achievements or game results.
*   **Advanced Game Modes:** Introduction of new game modes with different rules or challenges.
*   **Tutorials &amp; Onboarding:** In-dApp guides for new users to understand Web3 concepts and game mechanics.
*   **Referral System:** Reward users for bringing new players to the platform.

---

## Local Development Setup

This section guides you through setting up the entire Lucky Color Match project, including both the Flow smart contracts and the Next.js frontend, for local development.

### Prerequisites for Local Development

Before you begin setting up and running the Lucky Color Match frontend locally, ensure you have the following software and tools installed and configured on your system:

*   **Node.js:**
    *   Version: v16.x or later is recommended (v18.x or v20.x are also suitable).
    *   Purpose: Node.js is a JavaScript runtime environment that allows you to run JavaScript code outside of a web browser. It's essential for running the Next.js development server and managing project dependencies.
    *   Installation: Download from [nodejs.org](https://nodejs.org/).
*   **Package Manager (npm or yarn):**
    *   **npm:** Typically comes bundled with Node.js.
    *   **yarn:** Can be installed via npm (`npm install --global yarn`).
    *   Purpose: Used for installing and managing project dependencies listed in `package.json`.
*   **Git:**
    *   Purpose: Version control system used for cloning the project repository and managing code changes.
    *   Installation: Download from [git-scm.com](https://git-scm.com/).
*   **Flow CLI:**
    *   Purpose: The command-line interface for interacting with the Flow blockchain. It's crucial for local development, including running the Flow Emulator, deploying contracts, executing scripts, and sending transactions.
    *   Installation: Follow the official installation guide at [Flow Developer Portal - CLI Installation](https://developers.flow.com/tools/flow-cli/install).
    *   Verification: After installation, run `flow version` in your terminal to ensure it's correctly installed.
*   **Flow Emulator:**
    *   Purpose: A local development server that simulates the Flow blockchain environment. It allows you to deploy contracts, create accounts, and test your dApp without interacting with a live network or incurring real transaction fees.
    *   Usage: Started via the Flow CLI (`flow emulator`). This requires a `flow.json` project configuration file, which is typically located in the `LuckyColorMatch/` (contracts) directory.
*   **FCL Dev Wallet:**
    *   Purpose: A local wallet provider that integrates with FCL (Flow Client Library) for development purposes. It allows you to simulate user authentication and transaction signing without needing a real hardware wallet or browser extension during local development.
    *   Installation: Can be installed via npm: `npm install -g @onflow/fcl-dev-wallet` or `yarn global add @onflow/fcl-dev-wallet`.
    *   Usage: Started by running `fcl-dev-wallet` in your terminal.

**Recommended Development Environment:**

*   **Code Editor:** A modern code editor like Visual Studio Code (VS Code) with extensions for JavaScript/React and Cadence (e.g., "Cadence" by Flow Team) is highly recommended.
*   **Web Browser:** A modern web browser like Google Chrome, Firefox, or Brave, preferably with developer tools.

Ensuring these prerequisites are met will facilitate a smoother setup and development experience.

### Installation for Local Development

This section guides you through setting up the Lucky Color Match frontend application for local development. It assumes you have already installed all the tools listed in the "Prerequisites" section.

**1. Clone the Repository:**

First, you need to obtain the project source code. If you haven't already, clone the main repository (which should include both the `luckycolormatch-frontend/` and `LuckyColorMatch/` directories) to your local machine:

```bash
git clone <repository-url>
cd <repository-url> # Navigate to the root of the cloned project
```
Replace `<repository-url>` with the actual URL of the Git repository.

**2. Navigate to the Frontend Directory:**

All commands related to the frontend application should be run from within the `luckycolormatch-frontend` directory.

```bash
cd luckycolormatch-frontend
```

**3. Install Frontend Dependencies:**

Use your preferred package manager (npm or yarn) to install the necessary Node.js packages defined in the `package.json` file. These include Next.js, React, FCL, and other utility libraries.

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```
This command will download and install all required dependencies into the `node_modules` directory within `luckycolormatch-frontend`.

**4. Set Up and Run the Flow Emulator:**

The frontend application interacts with smart contracts deployed on the Flow blockchain. For local development, you'll use the Flow Emulator.

*   **Navigate to the Contracts Project:** Open a new terminal window or tab and navigate to the `LuckyColorMatch/` directory (the one containing `flow.json` and the Cadence smart contracts).
    ```bash
    cd ../LuckyColorMatch  # Assuming you are in luckycolormatch-frontend
    # Or navigate directly: cd path/to/your/project/LuckyColorMatch
    ```
*   **Start the Emulator:** Ensure your `flow.json` is configured with the necessary accounts and contract deployments. Then, start the emulator:
    ```bash
    flow emulator
    ```
    The emulator will typically start an access node on `http://localhost:8888` (or `127.0.0.1:8888`). Keep this terminal window open while you are developing.
    *Important:* The contracts (`LuckyColorMatch.cdc`, `LuckyCharmNFT.cdc`, etc.) must be deployed to the emulator. The `flow.json` file in the `LuckyColorMatch` directory should define these deployments. If it's your first time or you've reset the emulator, you might need to deploy them using `flow project deploy --network emulator`. (Refer to the "Flow Contracts Deployment" section for more details).

**5. Run the FCL Dev Wallet:**

The FCL Dev Wallet simulates a user's wallet for local development, allowing you to authenticate and sign transactions.

*   **Start the Dev Wallet:** Open another new terminal window or tab.
    ```bash
    fcl-dev-wallet
    ```
    This will typically start the dev wallet service on `http://localhost:8701`. The frontend's FCL configuration (`flow/config.js`) is usually set up to point to this address for authentication. Keep this terminal window open.

**6. Configure Contract Addresses (Verify or Update):**

The frontend needs to know the addresses where the smart contracts are deployed on the emulator. These are configured in `luckycolormatch-frontend/flow/config.js`.

*   Open `luckycolormatch-frontend/flow/config.js` in your code editor.
*   Verify that the contract addresses (e.g., `LUCKY_COLOR_MATCH_ADDRESS`, `FUNGIBLE_TOKEN_ADDRESS`) match the addresses used by your Flow Emulator. The default emulator account `f8d6e0586b0a20c7` is often used for initial deployments.
    ```javascript
    // Example from luckycolormatch-frontend/flow/config.js
    const LUCKY_COLOR_MATCH_ADDRESS = "0xf8d6e0586b0a20c7"; // Default emulator service account
    const FUNGIBLE_TOKEN_ADDRESS = "0xee82856bf20e2aa6";    // Standard FT address on emulator
    // ... other contract addresses
    ```
*   If your emulator uses different addresses (e.g., if you deployed contracts to a different account), update them in this file accordingly.

**7. Run the Frontend Development Server:**

Now that the dependencies are installed and the local Flow environment is running, you can start the Next.js development server for the frontend.

*   **Ensure you are in the `luckycolormatch-frontend` directory in your terminal.**
*   Run the development script:

    Using npm:
    ```bash
    npm run dev
    ```

    Or using yarn:
    ```bash
    yarn dev
    ```
This command will compile the frontend application and start a development server, typically accessible at `http://localhost:3000` in your web browser. The terminal will show output indicating the server is running and ready.

You should now be able to open `http://localhost:3000` in your browser and interact with the Lucky Color Match dApp running locally.

### Running the Application Locally (Usage)

Once you have successfully installed the prerequisites and followed the installation steps to run the application locally, you can start interacting with the Lucky Color Match dApp. Here’s a step-by-step guide on how to use the application:

**1. Open the Application in Your Browser:**

Navigate to `http://localhost:3000` (or the port specified in your terminal if it's different) in your web browser. You should see the main interface of the Lucky Color Match game.

**2. Connect Your Wallet (Log In):**

*   **Locate the "Log In" or "Connect Wallet" button.** This is usually prominently displayed, often in the header or a dedicated section.
*   **Click the button.** This action will trigger FCL (Flow Client Library) to connect to a wallet provider.
*   **FCL Dev Wallet Interaction:** Since you are running the FCL Dev Wallet locally (on `http://localhost:8701`), a pop-up or redirect should occur, prompting you to select an account from the Dev Wallet.
    *   The FCL Dev Wallet provides a list of pre-configured emulator accounts (e.g., Account 0x01, Account 0x02, etc., which correspond to accounts in your `flow.json`).
    *   Select one of these accounts to "log in" as that user.
*   Upon successful authentication, the frontend UI should update to reflect your logged-in status, typically displaying your wallet address.

**3. Set Up Your Account (First-Time Users):**

If this is the first time the selected Flow account is interacting with the Lucky Color Match game contracts, or if it hasn't been fully initialized for all game features (like holding specific NFTs or tokens), you'll need to run an account setup transaction.

*   **Locate the "Setup Account" or "Initialize Account" button.** This button might only be visible or enabled if the application detects that your account needs setup.
*   **Click the button.** This will initiate a Flow transaction.
*   **Authorize the Transaction:** Your FCL Dev Wallet will prompt you to approve or reject this transaction. Review the transaction details (if available in the Dev Wallet) and approve it.
*   **Transaction Confirmation:** The frontend should provide feedback on the transaction's progress (pending, sealed, failed). Once successful, your account will have the necessary resources (like `StoragePath` for `LuckyCharmNFT.Collection` or `AchievementBadgeNFT.Collection`) created.

**4. Explore Game Information:**

Once logged in, take a look around the main interface. You should be able to see:

*   **Current Round ID:** The identifier for the active game round.
*   **Entry Fee:** The amount of FLOW tokens required to submit an entry.
*   **Available Colors:** The palette of colors from which you can choose your combination.
*   **Combination Length:** The number of colors you need to select for a valid entry.
*   **Current Prize Pool:** The total amount of FLOW tokens accumulated for the current round's winners.
*   **Round Status:** Indicates whether the round is open for entries, closed, etc.

This information is fetched live from the `LuckyColorMatch` smart contract.

**5. Play the Game (Submit Your Color Combination):**

This is the core interaction with the game.

*   **Color Selection:**
    *   Find the UI element for selecting colors (e.g., color pickers, buttons).
    *   Choose the required number of colors in your desired sequence to form your combination.
*   **(Optional) Use a Lucky Charm NFT:**
    *   If you own any Lucky Charm NFTs and this feature is implemented, you might be able to select one to apply its benefits (e.g., a discount on the entry fee). The UI should guide you if this option is available.
*   **Submit Entry:**
    *   Once you are satisfied with your color combination, click the "Submit Entry" or "Play" button.
    *   This will initiate a Flow transaction to submit your colors and pay the entry fee.
*   **Authorize the Transaction:** Approve the transaction in your FCL Dev Wallet.
*   **Confirmation:** Wait for the transaction to be confirmed on the blockchain. The UI should provide feedback.

**6. View Game Results (After Round Ends):**

*   Once a game round concludes (as managed by the game administrator or automated logic in the smart contracts), the winning combination will be determined.
*   The UI should update to show the winning combination for past rounds.
*   If your submitted combination matches the winning one, your account will automatically receive your share of the prize pool as per the smart contract's logic.
*   (Placeholder/Planned) A "Player History" or "My Entries" section might allow you to review your past participation and winnings.

**7. Manage NFTs (Placeholder/Planned):**

*   If NFT features are fully implemented, there might be sections to:
    *   View your collection of Lucky Charm NFTs.
    *   View your earned Achievement Badge NFTs.
    *   Potentially interact with an NFT marketplace if integrated.

**8. Log Out:**

*   When you are done, you can usually find a "Log Out" button to disconnect your wallet from the dApp.

This provides a general flow for using the Lucky Color Match dApp locally. Specific UI elements and feature availability may evolve as development progresses.

---

## Deployment

This section covers deploying both the Flow smart contracts and the frontend application to various environments.

### 1. Flow Contracts Deployment

This tutorial provides a comprehensive guide to deploying the LuckyColorMatch smart contracts to Flow networks: Emulator, Testnet, and Mainnet.

#### Prerequisites for Contract Deployment

Before you begin, ensure you have the following installed and configured:

*   **Flow CLI:** The command-line interface for interacting with the Flow network. If you haven't installed it, follow the official [Flow CLI Installation Guide](https://developers.flow.com/tools/flow-cli/install).
*   **Node.js and npm/yarn:** (Optional, but recommended if you plan to use scripts for deployment or management tasks).
*   **Git:** For cloning the project repository.
*   **A Code Editor:** Such as Visual Studio Code.

Clone the project repository if you haven't already:
```bash
git clone [your-repository-url]
cd LuckyColorMatch
```

#### Understanding flow.json

The `flow.json` file is the heart of your Flow project configuration. It defines contracts, accounts, networks, and deployment settings. Here's a breakdown of key sections relevant to deployment:

```json
{
  "contracts": {
    "LuckyColorMatch": {
      "source": "cadence/contracts/LuckyColorMatch.cdc",
      "aliases": {
        "emulator": "0xf8d6e0586b0a20c7", // Deployed address on emulator
        "testnet": "PASTE_TESTNET_LCM_ADDRESS_HERE" // Placeholder for testnet
      }
    },
    // ... other contracts like LuckyCharmNFT, AchievementBadgeNFT
    "FungibleToken": { // Standard contract, usually pre-deployed
      "aliases": {
        "emulator": "0xee82856bf20e2aa6",
        "testnet": "0x9a0766d93b6608b7"
      }
    }
    // ... NonFungibleToken, MetadataViews
  },
  "networks": {
    "emulator": "127.0.0.1:3569",
    "mainnet": "access.mainnet.nodes.onflow.org:9000",
    "testnet": "access.testnet.nodes.onflow.org:9000"
  },
  "accounts": {
    "emulator-account": { // Account for emulator deployment
      "address": "f8d6e0586b0a20c7",
      "key": {
        "type": "file",
        "location": "emulator-account.pkey" // Private key for this account
      }
    }
    // You will add testnet and mainnet account configurations here
  },
  "deployments": {
    "emulator": {
      "emulator-account": [ // Deploy these contracts to emulator-account
        "LuckyCharmNFT",
        "AchievementBadgeNFT",
        "IVRFCoordinator", // Mock for emulator
        "LuckyColorMatch"
      ]
    }
    // You will add testnet and mainnet deployment configurations here
  }
}
```

**Key points:**
*   **`contracts`:** Defines your project's smart contracts, their source file locations, and network aliases (addresses where they are deployed or will be deployed).
*   **`networks`:** Specifies connection details for different Flow networks.
*   **`accounts`:** Manages accounts used for deployment and interaction. Each account needs an address and a private key. For emulator, a key file (`.pkey`) is often used. For testnet/mainnet, you'll typically use keys generated via Flow Port or other wallet tools, and you might store them securely (e.g., environment variables or a secure key management system, referenced in `flow.json`).
*   **`deployments`:** Specifies which contracts are deployed to which account on a given network.

#### Deployment to Flow Emulator (Contracts)

The Flow Emulator is a local development environment that simulates the Flow blockchain.

**3.1. Start the Emulator**
In your project's root directory (`LuckyColorMatch/`), start the emulator:
```bash
flow emulator
```
Keep this terminal window open. The emulator will output logs, including the service account address (usually `f8d6e0586b0a20c7`).

**3.2. Configure Emulator Account (if needed)**
The provided `flow.json` already has an `emulator-account` configured:
```json
"emulator-account": {
  "address": "f8d6e0586b0a20c7",
  "key": {
    "type": "file",
    "location": "emulator-account.pkey"
  }
}
```
If the `emulator-account.pkey` file doesn't exist, or if you want to use a different account, you can generate a new key pair:
```bash
flow keys generate
```
This will output a public and private key. Save the private key to a file (e.g., `emulator-account.pkey`) and update the `address` in `flow.json` if you created a new account on the emulator (though typically the service account `0xf8d6e0586b0a20c7` is used).

**3.3. Deploy Contracts to Emulator**
With the emulator running and `flow.json` configured, deploy the contracts:
```bash
flow project deploy --network emulator
```
This command reads the `deployments.emulator` section of your `flow.json` and deploys the specified contracts to the `emulator-account`. The deployed contract addresses will be automatically updated in the `aliases.emulator` section for each contract in `flow.json`.

**3.4. Verify Deployment**
You should see output indicating successful deployment. The `flow.json` file will be updated with the actual addresses of the deployed contracts under the `emulator` aliases. For example:
```json
"LuckyColorMatch": {
  "source": "cadence/contracts/LuckyColorMatch.cdc",
  "aliases": {
    "emulator": "0xf8d6e0586b0a20c7" // This address should match the emulator-account
  }
}
```
(Note: If a contract is deployed to an account, its address will be that account's address).

#### Deployment to Flow Testnet (Contracts)

Testnet is a publicly accessible network that behaves like Mainnet but uses test tokens.

**4.1. Get a Testnet Account and FLOW Tokens**
*   Go to [Flow Port](https://port.onflow.org/).
*   Connect a wallet (e.g., Blocto, Lilico) and ensure it's set to Testnet.
*   Create a new account or use an existing one. Note down your Testnet address.
*   Use the [Flow Testnet Faucet](https://testnet-faucet.onflow.org/) to get some test FLOW tokens for your account to cover deployment costs.

**4.2. Configure `flow.json` for Testnet**

**a. Add Testnet Account:**
You need to add your Testnet account details to the `accounts` section in `flow.json`.
First, get your account key details. You can often export a private key from your wallet or use tools like the Flow CLI with your wallet. For security, it's recommended to use environment variables for private keys rather than hardcoding them.

Example using an environment variable for the private key:
```json
"accounts": {
  // ... emulator-account ...
  "testnet-deployer": {
    "address": "YOUR_TESTNET_ACCOUNT_ADDRESS", // Replace with your actual Testnet address
    "key": {
      "type": "hex", // Or 'pem' depending on your key format
      "signer": "testnet-signer" // Reference to a signer defined below
    }
  }
},
"signers": { // New section if using advanced key management
    "testnet-signer": {
        "key": "$TESTNET_PRIVATE_KEY", // Private key from environment variable
        "signatureAlgorithm": "ECDSA_P256" // Or "ECDSA_secp256k1"
    }
}
```
Replace `YOUR_TESTNET_ACCOUNT_ADDRESS` with your actual Testnet address. Set the `TESTNET_PRIVATE_KEY` environment variable with your account's private key.

**b. Update Contract Aliases (Placeholders):**
The `flow.json` has placeholders for testnet contract addresses:
```json
"LuckyColorMatch": {
  "aliases": {
    "testnet": "PASTE_TESTNET_LCM_ADDRESS_HERE"
  }
}
// ... and for LuckyCharmNFT, AchievementBadgeNFT, IVRFCoordinator
```
When you deploy, these will be updated. For `IVRFCoordinator`, you'll need to deploy your `MockVRFCoordinator.cdc` to testnet or use an actual VRF service address if available on testnet. For this tutorial, we'll assume deploying the mock.

**c. Add Testnet Deployment Configuration:**
Add a deployment configuration for Testnet in the `deployments` section:
```json
"deployments": {
  // ... emulator deployment ...
  "testnet": {
    "testnet-deployer": [ // Use the account name defined above
      "LuckyCharmNFT",
      "AchievementBadgeNFT",
      "IVRFCoordinator", // Deploying the mock to testnet
      "LuckyColorMatch"
    ]
  }
}
```

**4.3. Deploy Contracts to Testnet**
Ensure your `TESTNET_PRIVATE_KEY` environment variable is set. Then run:
```bash
flow project deploy --network testnet --update
```
The `--update` flag allows updating existing contracts if they were previously deployed.
The Flow CLI will prompt you to confirm the deployment. After successful deployment, the `aliases.testnet` section in `flow.json` will be updated with the deployed contract addresses (which will be your `testnet-deployer` address).

**4.4. Verify Deployment**
*   Check `flow.json` for updated Testnet aliases.
*   You can use Flowscan ([testnet.flowscan.org](https://testnet.flowscan.org/)) to view your account and verify that the contracts have been deployed to it.

#### Deployment to Flow Mainnet (Contracts)

Deploying to Mainnet involves real value and requires utmost care. The process is similar to Testnet but with higher stakes.

**5.1. Get a Mainnet Account and FLOW Tokens**
*   Use Flow Port or your preferred Mainnet wallet to get a Mainnet account address.
*   Ensure this account is funded with sufficient FLOW tokens to cover deployment costs. Mainnet transactions cost real FLOW.

**5.2. Configure `flow.json` for Mainnet**

**a. Add Mainnet Account:**
Similar to Testnet, add your Mainnet account to `flow.json`. **NEVER hardcode Mainnet private keys directly in `flow.json` or commit them to version control.** Use environment variables or a secure key management solution.

```json
"accounts": {
  // ... emulator-account ...
  // ... testnet-deployer ...
  "mainnet-deployer": {
    "address": "YOUR_MAINNET_ACCOUNT_ADDRESS", // Replace with your actual Mainnet address
    "key": {
      "type": "hex",
      "signer": "mainnet-signer"
    }
  }
},
"signers": {
    // ... testnet-signer ...
    "mainnet-signer": {
        "key": "$MAINNET_PRIVATE_KEY", // Private key from environment variable
        "signatureAlgorithm": "ECDSA_P256"
    }
}
```
Replace `YOUR_MAINNET_ACCOUNT_ADDRESS` and set the `MAINNET_PRIVATE_KEY` environment variable.

**b. Update Contract Aliases (Placeholders for Mainnet):**
You'll need to add `mainnet` aliases for your contracts in `flow.json` if they don't exist. These will be filled upon deployment.
For standard contracts like `FungibleToken`, `NonFungibleToken`, `MetadataViews`, their Mainnet addresses are fixed and can be pre-filled:
```json
"FungibleToken": {
  "aliases": {
    "emulator": "0xee82856bf20e2aa6",
    "testnet": "0x9a0766d93b6608b7",
    "mainnet": "0xf233dcee88fe0abe" // Official Mainnet FT address
  }
},
"NonFungibleToken": {
  "aliases": {
    // ...
    "mainnet": "0x1d7e57aa55817448" // Official Mainnet NFT address
  }
},
"MetadataViews": {
  "aliases": {
    // ...
    "mainnet": "0x1d7e57aa55817448" // Official Mainnet MetadataViews address
  }
}
```
For `IVRFCoordinator`, you **MUST NOT** deploy `MockVRFCoordinator.cdc` to Mainnet. You need to integrate with a real, audited VRF service on Mainnet (e.g., Chainlink VRF if available and integrated, or another Flow-native solution). Update the `IVRFCoordinator` alias in `flow.json` to point to the actual Mainnet VRF contract address. This is a critical step and might require code changes in `LuckyColorMatch.cdc` if it's tightly coupled to the mock's interface.
**For this tutorial, we will assume you have a Mainnet VRF Coordinator address. If not, this part of the game logic cannot be deployed to Mainnet as is.**

Let's assume you have a Mainnet VRF address `0xVRF_MAINNET_ADDRESS`. You would update the `IVRFCoordinator` contract definition:
```json
"IVRFCoordinator": {
  // "source": "cadence/tests/MockVRFCoordinator.cdc", // DO NOT USE MOCK SOURCE FOR MAINNET
  "aliases": {
    "emulator": "0xf8d6e0586b0a20c7", // Mock on emulator
    "testnet": "YOUR_MOCK_VRF_TESTNET_ADDRESS", // Mock on testnet
    "mainnet": "0xVRF_MAINNET_ADDRESS" // Actual VRF service on Mainnet
  }
}
```
If `IVRFCoordinator` is only an interface and your `LuckyColorMatch.cdc` imports it to interact with a pre-deployed VRF contract, you don't deploy `IVRFCoordinator` itself. You just ensure the alias points to the correct Mainnet address.

**c. Add Mainnet Deployment Configuration:**
```json
"deployments": {
  // ... emulator and testnet deployments ...
  "mainnet": {
    "mainnet-deployer": [
      "LuckyCharmNFT",
      "AchievementBadgeNFT",
      // "IVRFCoordinator", // DO NOT deploy the mock to mainnet.
      "LuckyColorMatch"
    ]
  }
}
```
**Important:** The `LuckyColorMatch` contract depends on `IVRFCoordinator`. Ensure its import statement correctly resolves to the Mainnet VRF service address via the alias in `flow.json`.

**5.3. Security Considerations for Mainnet Deployment**
*   **Audit Your Contracts:** Before deploying to Mainnet, get your smart contracts professionally audited for security vulnerabilities.
*   **Secure Private Keys:** Protect your Mainnet private keys vigilantly. Use hardware wallets or secure multi-sig setups for accounts holding significant value or contract ownership.
*   **Test Thoroughly:** Ensure extensive testing on Testnet, covering all functionalities and edge cases.
*   **Gas Fees:** Be aware of transaction costs on Mainnet. Deployments can be expensive.
*   **Contract Upgradability:** By default, contracts on Flow are immutable once deployed. Plan for upgradability if needed (e.g., using proxy patterns, though this adds complexity). The `LuckyColorMatch` contracts as currently structured may not be directly upgradable without redeploying to a new address.

**5.4. Deploy Contracts to Mainnet**
**TRIPLE-CHECK EVERYTHING BEFORE RUNNING THIS COMMAND.**
Ensure your `MAINNET_PRIVATE_KEY` environment variable is set.
```bash
flow project deploy --network mainnet --update
```
Confirm the transaction details carefully when prompted by the Flow CLI.

**5.5. Verify Deployment**
*   Check `flow.json` for updated Mainnet aliases.
*   Use a Mainnet explorer like Flowscan ([flowscan.org](https://flowscan.org/)) to verify your contracts are live on your Mainnet account.
*   Perform basic interactions with your deployed contracts to ensure they are working as expected.

#### Updating Deployed Contracts

If you make changes to your smart contracts and need to update them:
*   Modify the Cadence code in the respective `.cdc` files.
*   Run the `flow project deploy --network [emulator|testnet|mainnet] --update` command again.
    *   The `--update` flag is crucial. It tells the Flow CLI to try to update the existing contract at the address specified in the alias.
    *   **Note:** Contract updates are subject to Flow's rules. Some changes (like changing storage paths or public function signatures in breaking ways) might not be possible without more complex migration strategies or deploying as a new contract.

#### Troubleshooting Common Contract Deployment Issues

*   **Insufficient FLOW:** Ensure your deployment account has enough FLOW tokens to cover transaction fees, especially on Testnet and Mainnet.
*   **Incorrect Private Key/Permissions:** Double-check that the private key used for signing matches the deployment account and has the necessary permissions.
*   **Network Issues:** Verify you have a stable internet connection and that the target Flow network (Emulator, Testnet, Mainnet access node) is reachable.
*   **Emulator Not Running:** Ensure the Flow Emulator is running in a separate terminal before attempting emulator deployments.
*   **`flow.json` Misconfiguration:** Carefully review your `flow.json` for typos, correct paths, and proper account/network settings.
*   **Contract Compilation Errors:** Address any Cadence compilation errors before attempting deployment. Use `flow cadence check <file_path>` to check individual files.
*   **Dependency Issues:** Ensure all imported contracts (like standard contracts or the VRF coordinator) are correctly aliased and accessible on the target network.

This tutorial provides the foundational steps for deploying your LuckyColorMatch contracts. Always refer to the latest [official Flow documentation](https://developers.flow.com/) for the most up-to-date practices and advanced topics.

### 2. Frontend Application Deployment

This tutorial guides you through deploying the Lucky Color Match frontend application. We'll primarily focus on deploying to Vercel, a platform optimized for Next.js applications.

#### Prerequisites for Frontend Deployment

Before you begin, ensure you have the following:

1.  **Node.js and npm/yarn:** The frontend is built with Next.js, which requires Node.js. npm or yarn is needed for package management.
2.  **Git:** Your project code should be managed with Git and hosted on a provider like GitHub, GitLab, or Bitbucket.
3.  **Vercel Account:** You'll need a Vercel account (a free tier is available). You can sign up at [vercel.com](https://vercel.com).
4.  **Project Code Pushed:** Ensure your latest `luckycolormatch-frontend` code is pushed to your Git repository.
5.  **Deployed Smart Contracts:** The Flow smart contracts (`LuckyColorMatch`, `LuckyCharmNFT`, `AchievementBadgeNFT`) must already be deployed to your target Flow network (emulator, testnet, or mainnet). You will need the addresses of these deployed contracts.

#### Deployment to Vercel (Recommended)

Vercel offers seamless deployment for Next.js projects.

##### Step 1: Sign Up/Log In to Vercel

*   Go to [vercel.com](https://vercel.com) and sign up for a new account or log in if you already have one. You can often sign up using your GitHub, GitLab, or Bitbucket account.

##### Step 2: Import Your Project

1.  From your Vercel dashboard, click on "Add New..." and select "Project".
2.  **Connect your Git Provider:** If you haven't already, connect Vercel to the Git provider where your `luckycolormatch-frontend` repository is hosted (e.g., GitHub).
3.  **Select Repository:** Choose the `luckycolormatch-frontend` repository from the list. Vercel might ask you to grant access to specific repositories or all repositories.

##### Step 3: Configure Your Project

Vercel is excellent at auto-detecting Next.js project settings. However, you should verify them:

*   **Project Name:** Vercel will suggest a name, you can customize it.
*   **Framework Preset:** Should be automatically detected as "Next.js".
*   **Root Directory:** If your `luckycolormatch-frontend` code is in the root of the repository, this should be `./`. If it's in a subdirectory (e.g., `packages/frontend`), adjust accordingly.
*   **Build and Output Settings:**
    *   **Build Command:** Usually `npm run build` or `yarn build`. Vercel typically overrides this with the correct Next.js build command.
    *   **Output Directory:** Automatically set to `.next` for Next.js projects.
    *   **Install Command:** Usually `npm install` or `yarn install`.
*   Click "Deploy". Vercel will initially try to deploy with these settings. You'll configure environment variables next, which are crucial.

##### Step 4: Configure Environment Variables

Environment variables are essential for configuring the frontend to connect to the correct Flow network and your deployed smart contracts.

1.  After the initial deployment attempt (or by navigating to your project's settings on Vercel: `Project > Settings > Environment Variables`), you need to add the following variables.
2.  These variables correspond to the values used in `luckycolormatch-frontend/flow/config.js`.

    | Variable Name                                 | Example Value (Testnet)                        | Description                                                                 |
    | :-------------------------------------------- | :--------------------------------------------- | :-------------------------------------------------------------------------- |
    | `NEXT_PUBLIC_FLOW_ACCESS_NODE`                | `https://rest-testnet.onflow.org`              | The access node URL for your target Flow network.                           |
    | `NEXT_PUBLIC_FLOW_WALLET_DISCOVERY`           | `https://fcl-discovery.onflow.org/testnet/authn` | The FCL wallet discovery URL for your target Flow network.                |
    | `NEXT_PUBLIC_CONTRACT_LUCKYCOLORMATCH_ADDRESS`  | `0xYourLuckyColorMatchAddress`                 | The address of your deployed `LuckyColorMatch.cdc` contract.                |
    | `NEXT_PUBLIC_CONTRACT_LUCKYCHARMNFT_ADDRESS`  | `0xYourLuckyCharmNFTAddress`                   | The address of your deployed `LuckyCharmNFT.cdc` contract.                  |
    | `NEXT_PUBLIC_CONTRACT_ACHIEVEMENTBADGENFT_ADDRESS` | `0xYourAchievementBadgeNFTAddress`             | The address of your deployed `AchievementBadgeNFT.cdc` contract.            |
    | `NEXT_PUBLIC_APP_TITLE`                       | `Lucky Color Match (Testnet)`                  | Optional: A title for your application, can indicate the environment.       |

    **Important Notes:**
    *   Replace example values with the actual values for your deployment target (e.g., use mainnet URLs and your mainnet contract addresses if deploying for production).
    *   For local emulator deployment, these values would point to your local setup (e.g., `http://localhost:8888` for access node, `http://localhost:8701/fcl/authn` for discovery, and emulator account addresses). However, Vercel deployment typically targets testnet or mainnet.
    *   Ensure the contract addresses are prefixed with `0x`.
    *   After adding/updating environment variables, Vercel will typically trigger a new deployment to apply the changes.

##### Step 5: Deploy

*   If you haven't clicked "Deploy" in Step 3, or if you've just updated environment variables, ensure a deployment is triggered. You can usually do this from the "Deployments" tab in your Vercel project dashboard by selecting the latest commit and clicking "Redeploy".

##### Step 6: Access Your Deployed Site

*   Once the deployment is successful, Vercel will provide you with one or more URLs (e.g., `your-project-name.vercel.app`). You can use this URL to access your live frontend application.
*   Vercel also automatically sets up CI/CD. Any new pushes to your connected Git branch (e.g., `main` or `master`) will trigger automatic redeployments.

#### Alternative Frontend Deployment Options

While Vercel is recommended for Next.js, here are other options:

*   **Netlify:** Similar to Vercel, Netlify also offers excellent support for Next.js with a comparable setup process for Git integration and environment variables.
*   **Docker:** For more control or deployment to custom infrastructure (like AWS, Google Cloud, Azure), you can containerize the Next.js application using Docker. This involves creating a `Dockerfile` and setting up a container orchestration system. This is a more advanced option.
    *   A basic `Dockerfile` for a Next.js app can be found in the official Next.js documentation.
*   **Other Platforms:** Platforms like AWS Amplify, Google Firebase Hosting, or traditional Node.js server environments can also host Next.js applications, but may require more manual configuration.

#### Post-Deployment (Frontend)

*   **Testing:** Thoroughly test all functionalities of your deployed application, including wallet connection, contract interactions, and UI elements.
*   **Custom Domains:** Vercel (and other platforms) allow you to configure custom domains for your deployed application. Follow their specific instructions in the project settings.

#### Troubleshooting Common Frontend Deployment Issues

*   **Build Failures:** Check the build logs on Vercel. Common issues include missing dependencies, incorrect build commands, or errors in your code.
*   **Environment Variable Misconfiguration:** If the app builds but cannot interact with the Flow blockchain, double-check that all `NEXT_PUBLIC_` environment variables are correctly set in Vercel and that they match the configuration expected by `flow/config.js`.
*   **Incorrect Contract Addresses:** Ensure the contract addresses in your environment variables are accurate for the target network.
*   **Network Mismatch:** Verify that the `NEXT_PUBLIC_FLOW_ACCESS_NODE` and `NEXT_PUBLIC_FLOW_WALLET_DISCOVERY` point to the same network (e.g., both testnet, or both mainnet) where your contracts are deployed.
*   **CORS Issues:** While less common with Vercel's setup for Next.js API routes, if you have custom backend interactions, ensure Cross-Origin Resource Sharing is configured correctly.

This tutorial provides a solid foundation for deploying your Lucky Color Match frontend. Always refer to the official documentation of your chosen deployment platform for the most up-to-date and detailed instructions.

---

## Project Structure (Frontend)

The frontend of Lucky Color Match is built using Next.js, a popular React framework. The key files and directories within `luckycolormatch-frontend/` are organized as follows:

*   **`pages/`**: This directory contains the application's pages. Next.js uses a file-system based router.
    *   `index.js`: The main landing page of the application, where users interact with the game. It houses the primary UI components for displaying game information, handling user authentication, and initiating game actions. It utilizes React state and effects to manage data and interactions.
    *   `_app.js` (if present, typical in Next.js): A custom App component to initialize pages. Can be used for global layouts or state.
    *   `_document.js` (if present, typical in Next.js): A custom Document component to augment the application's `<html>` and `<body>` tags.
*   **`services/`**: Contains modules that encapsulate specific business logic or external service interactions.
    *   `flowService.js`: This crucial file acts as the bridge between the frontend UI and the Flow blockchain. It contains functions for:
        *   User authentication (login, logout, get current user).
        *   Executing Cadence scripts to query data from the smart contracts (e.g., game status, entry fees, available colors).
        *   Executing Cadence transactions to mutate state on the blockchain (e.g., setting up user accounts, submitting color combinations).
        It utilizes the Flow Client Library (FCL) for all blockchain communications.
*   **`flow/`**: Dedicated to Flow blockchain-specific configurations.
    *   `config.js`: Initializes and configures FCL. It defines:
        *   Application details (name, icon).
        *   Network connection parameters (e.g., access node API for emulator, testnet, or mainnet).
        *   Wallet discovery endpoint (e.g., for FCL Dev Wallet, Blocto, Lilico).
        *   Aliases for smart contract addresses, making Cadence scripts and transactions more readable and maintainable. This file is imported at the application's entry point (e.g., in `pages/_app.js` or directly in pages like `index.js`) to ensure FCL is ready.
*   **`components/`** (if present, common practice): Would contain reusable UI components (e.g., buttons, modals, layout elements) used across different pages. (Currently, `pages/index.js` seems to define its UI directly, but this directory would be standard for larger applications).
*   **`public/`**: For static assets like images, favicons, etc., accessible directly via the base URL.
*   **`styles/`** (if present, common practice): For global stylesheets or CSS modules.
*   `package.json`: Lists project dependencies (like Next.js, React, FCL) and scripts (like `dev`, `build`, `start`).
*   `next.config.js` (if present): Configuration file for Next.js, allowing customization of its behavior.

This structure promotes separation of concerns, making the codebase easier to understand, maintain, and scale.
-   **`components/`**: (If any, for reusable UI elements - currently not explicitly shown but a common Next.js practice).

---

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

---

## Key Dependencies

-   **Next.js:** React framework for server-side rendering and static site generation.
-   **React:** JavaScript library for building user interfaces.
-   **@onflow/fcl:** Flow Client Library for interacting with the Flow blockchain.
-   **@onflow/types:** Provides type-checking for arguments passed to Cadence scripts and transactions.

(This list might not be exhaustive. Refer to `package.json` for a full list of dependencies.)

---

## Contributing

We welcome contributions to the Lucky Color Match project! Whether it's bug fixes, feature enhancements, documentation improvements, or new ideas, your help is appreciated.

Please refer to the `CONTRIBUTING.md` file (to be created) for detailed guidelines on:
- Reporting bugs
- Suggesting enhancements
- Code contribution process (forking, branching, pull requests)
- Coding standards
- Setting up a development environment for contributing

---

## License

This project is licensed under the MIT License. See the `LICENSE` file (to be created) for more details.