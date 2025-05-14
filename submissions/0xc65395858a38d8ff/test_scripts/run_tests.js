const fcl = require("@onflow/fcl");
const t = require("@onflow/types");
const fs = require('fs');
const path = require('path');
// No longer needed: const FlowCliConfig = require("@onflow/flow-cli").FlowCliConfig

// Import crypto libraries
const {ec: EC} = require('elliptic');
const {SHA3} = require('sha3');
const Buffer = require('buffer').Buffer;

// Import gRPC transport
const transport = require("@onflow/transport-grpc").default;

// Import flow.json
const flowJsonPath = path.join(__dirname, "..", "flow.json");
const flowJsonContent = JSON.parse(fs.readFileSync(flowJsonPath, 'utf-8'));

// Configure FCL to connect to the Flow emulator
// First, set up basic FCL configuration
fcl.config({
    'accessNode.api': 'http://localhost:8888',
    'flow.network': 'emulator',
    'discovery.wallet': 'http://localhost:8701/fcl/authn', // For Dev Wallet
    'decoder.type': 'json',
    'ixMappers': {
        'ixs': {},
    },
    "challenge.handshake": "http://localhost:8080/flow/authenticate", // Auth endpoint for the emulator
    "0xf8d6e0586b0a20c7": "f8d6e0586b0a20c7", // Alias for emulator-account address
    "0x179b6b1cb6755e31": "179b6b1cb6755e31",  // Alias for player2-account address
    "ElementalStrikers": "0xf8d6e0586b0a20c7" // Alias for our deployed contract
});

// Then load contract definitions from flow.json
fcl.config().load({ flowJSON: flowJsonContent });

// Add transport configuration separately
fcl.config().put("sdk.transport", transport);

// We might not need to explicitly set sdk.transport if accessNode.api is http
// and we are not forcing gRPC. Let's try removing it for now.
// fcl.config().put("sdk.transport", transport); 

// Function to hash data using SHA3-256
const hashMsg = (msg) => {
    const sha = new SHA3(256);
    sha.update(Buffer.from(msg, "hex"));
    return sha.digest();
};

// Function to sign a message using a private key
const signMsg = (privateKey, msg) => {
    const ec = new EC('p256');
    const key = ec.keyFromPrivate(privateKey);
    const sig = key.sign(hashMsg(msg));
    const n = 32; // The length of r and s of signature
    const r = sig.r.toArrayLike(Buffer, "be", n);
    const s = sig.s.toArrayLike(Buffer, "be", n);
    return Buffer.concat([r, s]).toString("hex");
};

// Helper function to get the authorization function for a given account name
const getAuthz = (accountName) => {
    // const flowJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "flow.json"), 'utf8')); // Already loaded as flowJsonContent
    const account = flowJsonContent.accounts[accountName];
    const address = account.address;
    const key = account.key.privateKey || fs.readFileSync(path.join(__dirname, "..", account.key.location), 'utf8'); // Read key from file if location is specified
    const keyIndex = 0; // Assuming key index is 0

    // Ensure the private key is a string in hex format
    const privateKeyHex = key.startsWith('0x') ? key.substring(2) : key;

    return async (account) => ({
        ...account,
        addr: fcl.withPrefix(address),
        keyId: keyIndex,
        signingFunction: async (signable) => {
            // Use the imported signing logic here
            return { signature: signMsg(privateKeyHex, signable.message) };
        },
    });
};

// Function to read a Cadence file
const readFile = async (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, "..", filePath), { encoding: 'utf8' }, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
};

// Function to send a transaction and wait for it to be sealed
const sendTransaction = async (transactionPath, args, signerAccountName) => {
    const code = await readFile(transactionPath);

    // Get the authorization function for the signer account
    const signerAuthz = getAuthz(signerAccountName);

    console.log(`\nSending transaction: ${transactionPath} with signer: ${signerAccountName}`);

    try {
        const transactionId = await fcl.mutate({
            cadence: code,
            args: (arg, t) => args.map(a => arg(a.value, t[a.type])),
            proposer: signerAuthz,
            payer: signerAuthz,
            authorizations: [signerAuthz],
            limit: 9999
        });

        console.log(`Transaction ID: ${transactionId}`);

        const transactionStatus = await fcl.tx(transactionId).onceSealed();
        console.log(`Transaction Sealed: ${transactionId}`);
        console.log("Transaction Status:", transactionStatus.status);
        console.log("Transaction Events:", JSON.stringify(transactionStatus.events, null, 2));

        if (transactionStatus.status !== 4) { // 4 means Sealed
             console.error("Transaction failed or reverted.", transactionStatus);
             throw new Error("Transaction failed.");
        }

        return transactionStatus;

    } catch (error) {
        console.error("Error sending transaction:", error);
        throw error;
    }
};

// Function to run a script
const runScript = async (scriptPath, args) => {
    const code = await readFile(scriptPath);

     console.log(`\nRunning script: ${scriptPath}`);

    try {
        const result = await fcl.query({
            cadence: code,
            args: (arg, t) => args.map(a => arg(a.value, t[a.type]))
        });

        console.log("Script Result:", result);
        return result;

    } catch (error) {
        console.error("Error running script:", error);
        throw error;
    }
}

// Helper function to generate blocks by sending a transaction repeatedly
const generateBlocks = async (numBlocks) => {
    console.log(`\nGenerating ${numBlocks} blocks...`);
    for (let i = 0; i < numBlocks; i++) {
        // Send a simple transaction like setup_account to generate a block
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/setup_account.cdc", [], "emulator-account");
    }
    console.log(`${numBlocks} blocks generated.`);
}

// Main test function
const runTests = async () => {
    console.log("\nStarting ElementalStrikers automated tests...");

    // Ensure emulator is running and state is cleared before running this script
    // (Manual step for now: stop emulator, delete flowdb, restart emulator)
    console.log("Please ensure the Flow emulator is running with a fresh state.");
    console.log("Stop the emulator, delete the 'flowdb' directory, then run 'flow emulator' in a new terminal.");
    console.log("Press any key to continue once the emulator is ready...");
    
    process.stdin.setRawMode(true);
    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        resolve();
    }));
    console.log("Continuing tests.");

    // --- Test Sequence --- //

    try {
        console.log("\n--- Deploying ElementalStrikers contract ---");
        
        // Revert to programmatic deployment
        const contractCode = await readFile("week2/ElementalStrikers/cadence/contracts/ElementalStrikers.cdc");
        const emulatorAuthz = getAuthz("emulator-account");

        await fcl.mutate({
            cadence: contractCode,
            args: (arg, t) => [],
            proposer: emulatorAuthz,
            payer: emulatorAuthz,
            authorizations: [emulatorAuthz],
            limit: 9999
        });
        console.log("ElementalStrikers contract deployed successfully.");

        console.log("\n--- Setting up accounts ---");
        // 1. Setup emulator-account
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/setup_account.cdc", [], "emulator-account");

        // 3. Setup player2-account
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/setup_account.cdc", [], "player2-account");

        console.log("\n--- Funding player2-account ---");
        // 4. Transfer FLOW to player2-account
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/transfer_flow.cdc", [
            { value: "10.0", type: t.UFix64 },
            { value: "0x179b6b1cb6755e31", type: t.Address }
        ], "emulator-account");

        console.log("\n--- Creating and Joining Game ---");
        // 2. Create a multi-round game (3 rounds, 10.0 stake)
        // Note: Create game also requires player1 address in transaction now
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/create_game.cdc", [
            { value: "10.0", type: t.UFix64 },
            { value: 3, type: t.UInt64 }
        ], "emulator-account");

        // 5. player2-account joins the game (Game ID 1)
        // Note: Join game also requires player2 address in transaction now
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/join_game.cdc", [
            { value: 1, type: t.UInt64 }, // Game ID
            { value: "10.0", type: t.UFix64 } // Stake Amount
        ], "player2-account");

        console.log("\n--- Round 1 ---");
        // 6. Player 1 makes a move
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/make_move.cdc", [
            { value: 1, type: t.UInt64 }, // Game ID
            { value: "Fuego", type: t.String } // Element
        ], "emulator-account");

        // 7. Player 2 makes a move
         await sendTransaction("week2/ElementalStrikers/cadence/transactions/make_move.cdc", [
            { value: 1, type: t.UInt64 }, // Game ID
            { value: "Agua", type: t.String } // Element
        ], "player2-account");

        // 8. Generate blocks and reveal outcome for Round 1
        await generateBlocks(10);
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/reveal_outcome.cdc", [
            { value: 1, type: t.UInt64 } // Game ID
        ], "emulator-account"); // Either player can reveal

         console.log("\n--- Round 2 ---");
        // 9. Player 1 makes a move for Round 2
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/make_move.cdc", [
            { value: 1, type: t.UInt64 }, // Game ID
            { value: "Agua", type: t.String } // Element
        ], "emulator-account");

        // 10. Player 2 makes a move for Round 2
         await sendTransaction("week2/ElementalStrikers/cadence/transactions/make_move.cdc", [
            { value: 1, type: t.UInt64 }, // Game ID
            { value: "Planta", type: t.String } // Element
        ], "player2-account");

        // 11. Generate blocks and reveal outcome for Round 2
        await generateBlocks(10);
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/reveal_outcome.cdc", [
            { value: 1, type: t.UInt64 } // Game ID
        ], "emulator-account"); // Either player can reveal

        console.log("\nBasic multi-round game flow tested successfully!");

    } catch (error) {
        console.error("\nAutomated tests failed:", error);
    }

    console.log("\nAutomated tests finished.");
};

runTests(); 