import { ethers } from "ethers";
import { nft } from "@/contract/contractABI";

const contractAddress = "CONTRACT-ADDRESS-HERE";
const rpcEndpoint = "https://testnet.evm.nodes.onflow.org";

export default async function mint(address) {
  const privateKey = "YOUR-KEY-HERE";
  if (!privateKey) {
    console.error("Private key is missing in environment variables.");
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcEndpoint);
  const signer = new ethers.Wallet(privateKey, provider);

  const contract = new ethers.Contract(contractAddress, nft, signer);

  try {
    const tx = await contract.mint(address);
    console.log(`Transaction sent: ${tx.hash}`);

    await tx.wait(); // Wait for confirmation
    console.log(`Transaction confirmed: ${tx.hash}`);
    
    return tx.hash;
  } catch (err) {
    console.error("Minting failed:", err);
  }
}
