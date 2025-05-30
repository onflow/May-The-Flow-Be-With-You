import { readContract, writeContract } from "@wagmi/core";
import { config } from "@/config/wagmi";
import { sender } from "@/contract/abi.js";

const CONTRACT_ADDRESS = "0x62043746B22322838E2870c9Bd0CB5f4E6A8E0D3";
const DST_EID = 40161;

export async function toSe(message, senderAddress) {
  try {
    // Quote the fee
    const [nativeFee] = await readContract(config, {
      abi: sender,
      address: CONTRACT_ADDRESS,
      functionName: "quote",
      args: [DST_EID, message, false],
    });

    console.log("Quoted native fee (wei):", nativeFee.toString());

    // Send the message
    const tx = await writeContract(config, {
      abi: sender,
      address: CONTRACT_ADDRESS,
      functionName: "send",
      args: [DST_EID, message],
      value: nativeFee,
    });

    // Call your API route with txHash, message, sender
    const response = await fetch('/api/toSe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        txHash: tx,
        message,
        sender: senderAddress,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('API route returned error:', result);
    } else {
      console.log('API route success:', result);
    }

  } catch (error) {
    console.error("Failed to send message via toSe():", error);
  }
}
