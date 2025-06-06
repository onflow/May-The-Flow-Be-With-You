# Submission: Week 3 Challenge - Generative Art and Worlds

## Flow Address
0x9f7145728ef9ae10 (FLOW)
<br>
0x000000000000000000000002A01c2368336B105C (FLOW EVM)

## Purpose

![ezgif-718aef0e04e2bf](https://github.com/user-attachments/assets/958c1485-e4ee-47e2-8ae5-66b719308711)


This is a Doodle-themed NFT mutator demo that showcases how generative art models can be used in a Web3 dApp to create an engaging mutation mechanism for existing art. In this demo, you'll need to mint a Mutating Potion, which is randomly brewed using Flow's on-chain randomness. As a result, the effect of each minted potion will be unique.

For example, a potion might have an effect like "a shining gold varsity costume." When a Doodle is uploaded to the mutator, the corresponding potion is burned. A prompt is then generated by combining the potion's effect with the original Doodle, and sent to the generative art model. The resulting mutated Doodle is minted (tokenURI stored via Pinata) and delivered to your wallet.

## Testing Notes

Here’s a link to the live version — feel free to give it a quick try: [Start to play](https://doodle-mutation.vercel.app/).

However, since mutation is powered by OpenAI's generative image models, the cost of generation is not covered by me. Therefore, you’ll need to obtain your own OpenAI Developer API key and paste it into the application. Don’t worry — it will be stored locally on your device and will not be stored by us.

If you'd like to host your own version or build on top of it (always encouraged!), keep in mind:

- You’ll need to redeploy the smart contracts and include your private key in the `.env` file for NFT minting functionality.
- The project also requires a **Pinata JWT key** to handle the `tokenURI` for minting the mutated Doodles NFTs.

Since this project uses **RainbowKit**, you’ll also need to obtain a Reown project key [here](https://cloud.reown.com/sign-in) to complete the setup.
