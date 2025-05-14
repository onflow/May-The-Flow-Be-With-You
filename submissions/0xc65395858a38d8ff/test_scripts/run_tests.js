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
    'flow.network': 'testnet',
    'decoder.type': 'json',
    'ixMappers': {
        'ixs': {},
    },
    // Address aliases (might still be needed for FCL account resolution for signing)
    "0xbeb2f48c3293e514": "beb2f48c3293e514", // Alias for testnet-deployer (ElementalStrikers contract address)
    "0xad7388f34dd6bdef": "ad7388f34dd6bdef" // Alias for player2-account on Testnet
});

// Add FCL placeholder replacement for our specific contract
fcl.config().put('0xElementalStrikers_ADDRESS', '0xbeb2f48c3293e514');

// Then load contract definitions and network settings from flow.json
// fcl.config().load({ flowJSON: flowJsonContent }); // Commenting out as we manually replace imports now

// NOW, explicitly set/override the accessNode.api for Testnet to the REST endpoint
fcl.config().put('accessNode.api', 'https://rest-testnet.onflow.org');

// Add transport configuration separately
// fcl.config().put("sdk.transport", transport); // Commented out due to deprecation of @onflow/transport-grpc

// We might not need to explicitly set sdk.transport if accessNode.api is http
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
    // flowJsonContent still refers to the original flow.json, not the merged config from FCL
    // We need to get the account details from FCL's *resolved* configuration
    // However, FCL doesn't directly expose the fully resolved account objects easily in older versions
    // for this type of manual signing function construction.

    // Let's assume FCL's load process correctly merges the key from flow.private.json
    // into the account object that our original flowJsonContent refers to.
    // This was the implicit assumption. The error indicates 'account.key' itself is undefined.

    // The issue is that flowJsonContent.accounts[accountName] *does not have* a .key object anymore
    // after we removed it from flow.json.
    // FCL's internal config will have it, but flowJsonContent will not.

    // Simplest fix: Assume flow.private.json is loaded by FCL and rely on FCL to provide signer.
    // But our getAuthz is custom.

    // Let's re-read flow.private.json manually here for simplicity,
    // and merge it for getAuthz's purposes. THIS IS A WORKAROUND.
    // A better way would be to use FCL's signing capabilities more directly if possible.
    const flowPrivateJsonPath = path.join(__dirname, "..", "flow.private.json");
    let privateKeyHex;
    let address;

    const accountConfig = flowJsonContent.accounts[accountName]; // address from flow.json
    if (!accountConfig) {
        throw new Error(`Account ${accountName} not found in flow.json`);
    }
    address = accountConfig.address;

    if (fs.existsSync(flowPrivateJsonPath)) {
        const flowPrivateJsonContent = JSON.parse(fs.readFileSync(flowPrivateJsonPath, 'utf-8'));
        if (flowPrivateJsonContent.accounts && flowPrivateJsonContent.accounts[accountName] && flowPrivateJsonContent.accounts[accountName].key) {
            privateKeyHex = flowPrivateJsonContent.accounts[accountName].key;
        }
    }

    // Fallback to original logic if key not in flow.private.json (e.g. emulator-account using .pkey file)
    if (!privateKeyHex && accountConfig.key) {
        if (typeof accountConfig.key === 'string') { // Direct key in flow.json (old way)
             privateKeyHex = accountConfig.key;
        } else if (accountConfig.key.location) { // .pkey file
            privateKeyHex = fs.readFileSync(path.join(__dirname, "..", accountConfig.key.location), 'utf8');
        }
    }
    
    if (!privateKeyHex) {
        throw new Error(`Private key not found for account ${accountName}`);
    }
    
    // Ensure the private key is a string in hex format and remove 0x if present
    privateKeyHex = privateKeyHex.startsWith('0x') ? privateKeyHex.substring(2) : privateKeyHex;
    
    const keyIndex = 0; // Assuming key index is 0

    return async (account) => ({
        ...account,
        addr: fcl.withPrefix(address),
        keyId: keyIndex,
        signingFunction: async (signable) => {
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

// Helper function to replace contract import placeholders with actual Testnet addresses
const replaceImportAddresses = (code) => {
    let processedCode = code;
    const importRegex = /import\s+(\w+)\s+from\s+"(\w+)"/g;

    // Build a mapping from contract names (used in "Placeholder") to their Testnet addresses
    const contractMappings = {};
    if (flowJsonContent.contracts) {
        for (const contractName in flowJsonContent.contracts) {
            if (flowJsonContent.contracts[contractName].aliases && flowJsonContent.contracts[contractName].aliases.testnet) {
                contractMappings[contractName] = flowJsonContent.contracts[contractName].aliases.testnet;
            }
        }
    }
    if (flowJsonContent.dependencies) {
        for (const depName in flowJsonContent.dependencies) {
            if (flowJsonContent.dependencies[depName].aliases && flowJsonContent.dependencies[depName].aliases.testnet) {
                // Dependencies might be imported with a different name than their key in flow.json,
                // but for standard contracts like FungibleToken, the key is the name.
                contractMappings[depName] = flowJsonContent.dependencies[depName].aliases.testnet;
            }
        }
    }
    // Add specific known mappings if necessary (e.g. if import name differs from flow.json key)
    // For now, relying on direct key match.

    processedCode = processedCode.replace(importRegex, (match, importedName, placeholderName) => {
        const address = contractMappings[placeholderName]; // Use placeholderName for lookup
        if (address) {
            // Ensure address has 0x prefix
            const fullAddress = address.startsWith('0x') ? address : `0x${address}`;
            console.log(`[Debug Import] Placeholder: "${placeholderName}", Address found: "${address}", Processed fullAddress: "${fullAddress}", Type: ${typeof fullAddress}, Length: ${fullAddress.length}`); // DEBUG
            return `import ${importedName} from ${fullAddress}`;
        }
        console.warn(`No testnet address mapping found for contract placeholder "${placeholderName}" in flow.json. Leaving import as is: ${match}`);
        return match; // Leave as is if no mapping found
    });
    return processedCode;
};

// Function to send a transaction and wait for it to be sealed
const sendTransaction = async (transactionPath, args, signerAccountName) => {
    const originalCode = await readFile(transactionPath);
    const code = replaceImportAddresses(originalCode); // Process Cadence to interpolate addresses
    // console.log(`
// --- Processed Cadence for ${transactionPath} ---
// ${code}
// --------------------------------------------`); // Reduced verbosity

    // Get the authorization function for the signer account
    const signerAuthz = getAuthz(signerAccountName);

    console.log(`
Sending transaction: ${transactionPath} with signer: ${signerAccountName}`);
    let unsub = () => {}; // Initialize unsub to a no-op function

    try {
        // console.log(`[DEBUG] About to call fcl.mutate for ${transactionPath}`); // Reduced verbosity
        // console.log("[Debug Arg Types] typeof t:", typeof t, "t object:", t); // Reduced verbosity by commenting this out
        const transactionId = await fcl.mutate({
            cadence: code,
            args: (arg, types) => args.map(a => arg(a.value, a.type)),
            proposer: signerAuthz,
            payer: signerAuthz,
            authorizations: [signerAuthz],
            limit: 9999
        });

        console.log(`Transaction ID: ${transactionId}`);
        // console.log(`[DEBUG] About to call fcl.tx(${transactionId}).onceSealed() and subscribing to updates.`); // Reduced verbosity

        // Subscribe to transaction status updates (only log errors)
        unsub = fcl.tx(transactionId).subscribe(txStatus => {
            // console.log(`[DEBUG SUBSCRIBER] TxId ${transactionId} - Status: ${txStatus.status}, Error: ${txStatus.errorMessage || 'No'}, Events: ${txStatus.events.length}`); // Reduced verbosity
            // if (fcl.isErrored(txStatus)) { // Commenting out due to TypeError: fcl.isErrored is not a function
            //     console.error(`[DEBUG SUBSCRIBER] Transaction ${transactionId} errored:`, txStatus.errorMessage, txStatus);
            // }
            // if (fcl.isSealed(txStatus)) { // Commenting out due to potential similar TypeError
            //     console.log(`[DEBUG SUBSCRIBER] Transaction ${transactionId} is Sealed.`);
            // }
        });

        const transactionStatus = await fcl.tx(transactionId).onceSealed();
        unsub(); // Unsubscribe after sealing
        // console.log(`[DEBUG] fcl.tx(${transactionId}).onceSealed() COMPLETED.`); // Reduced verbosity

        console.log(`Transaction Sealed: ${transactionId}`);
        console.log("Transaction Status:", transactionStatus.status);
        console.log("Transaction Events:", JSON.stringify(transactionStatus.events, null, 2));

        if (transactionStatus.status !== 4) { // 4 means Sealed
             console.error("Transaction failed or reverted.", transactionStatus);
             throw new Error("Transaction failed.");
        }

        return transactionStatus;

    } catch (error) {
        console.error(`[DEBUG] Error in sendTransaction for ${transactionPath}:`, error); // Enhanced debug
        if (typeof unsub === 'function') {
            console.log("[DEBUG] Unsubscribing due to error.");
            unsub(); // Ensure unsubscription on error
        }
        console.error("Error sending transaction:", error);
        throw error;
    }
};

// Function to run a script
const runScript = async (scriptPath, args) => {
    const originalCode = await readFile(scriptPath);
    const code = replaceImportAddresses(originalCode); // Process Cadence to interpolate addresses
    // console.log(`
// --- Processed Cadence for ${scriptPath} ---
// ${code}
// --------------------------------------------`); // Log processed code

     console.log(`
Running script: ${scriptPath}`);

    try {
        const result = await fcl.query({
            cadence: code,
            args: (arg, types) => args.map(a => arg(a.value, a.type))
        });

        console.log("Script Result:", result);
        return result;

    } catch (error) {
        console.error("Error running script:", error);
        throw error;
    }
}

// Helper function to generate blocks by sending a transaction repeatedly
/*
const generateBlocks = async (numBlocks) => {
    console.log(`\nGenerating ${numBlocks} blocks...`);
    for (let i = 0; i < numBlocks; i++) {
        // Send a simple transaction like setup_account to generate a block
        // This needs to use a Testnet account if re-enabled.
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/setup_account.cdc", [], "testnet-deployer"); // Changed to testnet-deployer
    }
    console.log(`${numBlocks} generated.`);
}
*/

// Main test function
const runTests = async () => {
    // console.log("Starting ElementalStrikers automated tests on Testnet..."); // Silenced for cleaner output start
    // The FCL deprecation notice for transport-grpc is very noisy. We can't directly silence it from here,
    // but by not logging "Starting..." it's less prominent with other output.
    // Consider updating FCL or related packages if the notice is problematic.

    // console.log("ElementalStrikers automated tests on Testnet STARTING..."); // Correctly commented out

    // Ensure emulator is running and state is cleared before running this script
    // (Manual step for now: stop emulator, delete flowdb, restart emulator)
    // console.log("Please ensure the Flow emulator is running with a fresh state.");
    // console.log("Stop the emulator, delete the 'flowdb' directory, then run 'flow emulator' in a new terminal.");
    // console.log("Press any key to continue once the emulator is ready...");
    
    // process.stdin.setRawMode(true);
    // process.stdin.resume();
    // await new Promise(resolve => process.stdin.once('data', () => {
    //     process.stdin.setRawMode(false);
    //     resolve();
    // }));
    // console.log("Continuing tests.");

    // --- Test Sequence --- //

    try {
        // console.log("\n--- Deploying ElementalStrikers contract ---");
        
        // Revert to programmatic deployment
        // const contractCode = await readFile("week2/ElementalStrikers/cadence/contracts/ElementalStrikers.cdc");
        // const emulatorAuthz = getAuthz("emulator-account"); // This would need to be testnet-deployer

        // await fcl.mutate({
        //     cadence: contractCode,
        //     args: (arg, t) => [],
        //     proposer: emulatorAuthz,
        //     payer: emulatorAuthz,
        //     authorizations: [emulatorAuthz],
        //     limit: 9999
        // });
        // console.log("ElementalStrikers contract would be deployed from script (commented out for Testnet).");
        // console.log("Assuming contract is already deployed to:", flowJsonContent.contracts.ElementalStrikers.aliases.testnet || "CONFIG_ERROR_NO_TESTNET_ALIAS");

        console.log("\n--- Test: Setup Player 1 Account (testnet-deployer) ---");
        // 1. Setup testnet-deployer
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/setup_account.cdc", [], "testnet-deployer");

        console.log("\n--- Setting up accounts ---");
        // 2. Setup player2-account
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/setup_account.cdc", [], "player2-account");

        console.log("\n--- Funding player2-account ---");
        // 3. Transfer FLOW to player2-account
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/transfer_flow.cdc", [
            { value: "10.0", type: t.UFix64 },
            { value: "0xad7388f34dd6bdef", type: t.Address } // Updated player2 Testnet address
        ], "testnet-deployer");

        console.log("\n--- Creating and Joining Game ---");
        // 4. Create a multi-round game (3 rounds, 10.0 stake)
        // Note: Create game also requires player1 address in transaction now
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/create_game.cdc", [
            { value: "10.0", type: t.UFix64 },
            { value: 3, type: t.UInt64 }
        ], "testnet-deployer");

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
        ], "testnet-deployer");

        // 7. Player 2 makes a move
         await sendTransaction("week2/ElementalStrikers/cadence/transactions/make_move.cdc", [
            { value: 1, type: t.UInt64 }, // Game ID
            { value: "Agua", type: t.String } // Element
        ], "player2-account");

        // 8. Generate blocks and reveal outcome for Round 1
        // await generateBlocks(10); // Commented out for Testnet
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/reveal_outcome.cdc", [
            { value: 1, type: t.UInt64 } // Game ID
        ], "testnet-deployer"); // Either player can reveal

         console.log("\n--- Round 2 ---");
        // 9. Player 1 makes a move for Round 2
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/make_move.cdc", [
            { value: 1, type: t.UInt64 }, // Game ID
            { value: "Agua", type: t.String } // Element
        ], "testnet-deployer");

        // 10. Player 2 makes a move for Round 2
         await sendTransaction("week2/ElementalStrikers/cadence/transactions/make_move.cdc", [
            { value: 1, type: t.UInt64 }, // Game ID
            { value: "Planta", type: t.String } // Element
        ], "player2-account");

        // 11. Generate blocks and reveal outcome for Round 2
        // await generateBlocks(10); // Commented out for Testnet
        await sendTransaction("week2/ElementalStrikers/cadence/transactions/reveal_outcome.cdc", [
            { value: 1, type: t.UInt64 } // Game ID
        ], "testnet-deployer"); // Either player can reveal

        console.log("\nBasic multi-round game flow tested successfully!");

    } catch (error) {
        console.error("\nAutomated tests failed:", error);
    }

    console.log("\nAutomated tests finished.");
};

runTests(); 