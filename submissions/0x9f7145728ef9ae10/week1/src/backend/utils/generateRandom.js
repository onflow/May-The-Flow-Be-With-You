import "dotenv/config";
import { ethers } from "ethers";
import { contractABI } from "../contractABI.js";

const contractAddress = "0x9ACB1CF584AE558c7eedaDCc7dDF30Cd00461419";

const rpcEndpoint = "https://testnet.evm.nodes.onflow.org";

// Function to generate a random number by calling the contract
export default async function generateRandom() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Private key is missing in environment variables.");
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const signer = new ethers.Wallet(privateKey, provider);

  // Instantiate the contract
  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  try {
    // Send a transaction to the contract to generate a random number
    const tx = await contract.generateRandom();

    // Wait for the transaction
    const receipt = await tx.wait();

    const iface = new ethers.Interface(contractABI);

    let randomNumber;

    for (const log of receipt.logs) {
      try {
        const parsedLog = iface.parseLog(log);

        if (parsedLog.name === "RandomNumberGenerated") {
          randomNumber = parsedLog.args.randomNumber;
        }
      } catch (err) {
        continue;
      }
    }

    // Return the transaction hash and the random number
    return {
      txHash: tx.hash,
      rand: randomNumber,
    };
  } catch (error) {
    console.error("Error generating random number:", error);
    throw error;
  }
}
