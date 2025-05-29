const fcl = require("@onflow/fcl");
const t = require("@onflow/types");
const fs = require('fs');
const path = require('path');

// Import crypto libraries
const {ec: EC} = require('elliptic');
const {SHA3} = require('sha3');
const Buffer = require('buffer').Buffer;

// Import flow.json
const flowJsonPath = path.join(__dirname, "..", "flow.json");
const flowJsonContent = JSON.parse(fs.readFileSync(flowJsonPath, 'utf-8'));

// Configure FCL to connect to Flow testnet
fcl.config({
    'flow.network': 'testnet',
    'decoder.type': 'json',
    'accessNode.api': 'https://access-testnet.onflow.org'
});

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
    // Read flow.private.json to get the private key
    const flowPrivateJsonPath = path.join(__dirname, "..", "flow.private.json");
    let privateKeyHex;
    let address;

    const accountConfig = flowJsonContent.accounts[accountName];
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
    const importRegex = /import\s+(\w+)\s+from\s+0x[a-fA-F0-9]+/g;
    const dependencyMappings = {};
    
    // Build mappings from dependencies
    if (flowJsonContent.dependencies) {
        for (const depName in flowJsonContent.dependencies) {
            if (flowJsonContent.dependencies[depName].aliases && flowJsonContent.dependencies[depName].aliases.testnet) {
                const testnetAddress = flowJsonContent.dependencies[depName].aliases.testnet;
                const fullAddress = testnetAddress.startsWith('0x') ? testnetAddress : `0x${testnetAddress}`;
                dependencyMappings[depName] = fullAddress;
            }
        }
    }

    // Build mappings from contracts 
    if (flowJsonContent.contracts) {
        for (const contractName in flowJsonContent.contracts) {
            if (flowJsonContent.contracts[contractName].aliases && flowJsonContent.contracts[contractName].aliases.testnet) {
                const testnetAddress = flowJsonContent.contracts[contractName].aliases.testnet;
                const fullAddress = testnetAddress.startsWith('0x') ? testnetAddress : `0x${testnetAddress}`;
                dependencyMappings[contractName] = fullAddress;
            }
        }
    }

    // Fix imports with actual addresses based on the name
    processedCode = processedCode.replace(importRegex, (match) => {
        for (const [name, address] of Object.entries(dependencyMappings)) {
            if (match.includes(name)) {
                const parts = match.split(' from ');
                return `${parts[0]} from ${address}`;
            }
        }
        return match; // Keep as is if no mapping found
    });

    return processedCode;
};

// Main function to deploy the EvolvingCreatures contract
const deployEvolvingCreatures = async () => {
    try {
        console.log("Starting EvolvingCreatures contract deployment to Flow Testnet...");
        
        // Read the transaction code
        const transactionPath = "test_scripts/deploy_contract_transaction.cdc";
        const transactionCode = await readFile(transactionPath);
        
        console.log("Using proper contract deployment transaction. Deploying...");
        
        // Get the authorization function for the testnet-deployer account
        const deployerAuthz = getAuthz("testnet-deployer");
        
        // Deploy the contract
        const txId = await fcl.mutate({
            cadence: transactionCode,
            args: (arg, t) => [],
            proposer: deployerAuthz,
            payer: deployerAuthz,
            authorizations: [deployerAuthz],
            limit: 9999
        });
        
        console.log(`Transaction submitted with ID: ${txId}`);
        console.log("Waiting for transaction to be sealed...");
        
        // Wait for the transaction to be sealed
        const txStatus = await fcl.tx(txId).onceSealed();
        
        console.log("Transaction Status:", txStatus.status === 4 ? "SEALED" : "FAILED");
        if (txStatus.status === 4) {
            console.log("EvolvingCreatures contract deployed successfully!");
        } else {
            console.error("Error deploying contract:", txStatus.errorMessage);
            console.log("Full status:", JSON.stringify(txStatus, null, 2));
        }
        
    } catch (error) {
        console.error("Error in deployment process:", error);
    }
};

// Run the deployment
deployEvolvingCreatures(); 