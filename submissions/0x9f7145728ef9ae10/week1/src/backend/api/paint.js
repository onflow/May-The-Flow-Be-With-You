import "dotenv/config";
import chooseItems from "../utils/chooseItems.js";
import generateGhibli from "../utils/generateGhibli.js";
import { costumes } from "../data/costume.js";
import { accessories } from "../data/accessories.js";
import { background } from "../data/background.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed. Please use POST.",
    });
  }

  // Authenticate request
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.AUTH_KEY}`) {
    return res.status(401).json({ error: "Unauthorized: Invalid API key" });
  }

  try {

    const { walletAddress } = req.body;

    if (!walletAddress) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
      }

    const selectedCostume = await chooseItems(walletAddress, "costume", costumes);
    const selectedAccessory = await chooseItems(walletAddress, "accessory", accessories);
    const selectedBackground = await chooseItems(walletAddress, "background", background);

    const result = await generateGhibli(selectedCostume, selectedAccessory, selectedBackground, walletAddress);

    return res.status(200).json({
        success: true,
        message: result
      });

  } catch (error) {
    console.error("Error processing painting:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Internal Server Error",
      });
  }
}
