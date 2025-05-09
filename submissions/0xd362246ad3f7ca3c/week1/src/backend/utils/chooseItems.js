import generateRandom from "./generateRandom.js";
import db from "../config.js";

export default async function chooseItems(
  walletAddress,
  itemCategory,
  itemList
) {
  try {
    // Generate a random number
    const { rand, txHash } = await generateRandom();

    //Use the random number to pick an item from the list
    const selectedItem = itemList[rand];

    //Write to the database
    const ref = db.ref(`${walletAddress}/${itemCategory}`);
    await ref.set({
      item: selectedItem,
      randNum: Number(rand),
      txHash: txHash,
    });

    return {
      selectedItem,
      rand,
      txHash,
    };
  } catch (error) {
    console.error("Error in chooseItems:", error);
    throw error;
  }
}
