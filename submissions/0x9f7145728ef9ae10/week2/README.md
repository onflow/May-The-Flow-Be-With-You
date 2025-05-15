# Submission: Week 2 Challenge - Actually Fun Game!

## Flow Address
0x9f7145728ef9ae10 (FLOW)
0x000000000000000000000002A01c2368336B105C (FLOW EVM)

## Purpose

This is a Doodles-themed on-chain memory card game that adds a chaotic twist to the traditional version by using on-chain randomness to trigger unexpected traps.

At random intervals, the game fetches a random number (between 5 and 15 seconds) from Flow’s on-chain randomness. This number starts a countdown timer—a “shuffle bomb.” When the timer hits zero, all unmatched or face-up cards are flipped back down, and their positions are shuffled, throwing players into delightful chaos. It’s brutal, unpredictable, and seriously fun to master.

When a player wins, a golden brain trophy ERC-721 NFT is minted and sent directly to their connected wallet. Each card in the game features a random Doodles PFP, dynamically fetched using the Alchemy API.

This game is not only fun but also serves as a showcase of how Flow’s on-chain randomness can be used to build engaging gameplay features like dynamic traps and random in-game events—perfect for making blockchain games more interactive and exciting.

## Testing Notes

Here’s a link to the live version — feel free to give it a quick try: [Start to play](https://doodle-memorizer.vercel.app/).

If you'd like to host your own version or build on top of it (always encouraged!), keep in mind that you’ll need to redeploy the smart contracts and include your private key in the .env file for NFT minting functionality.

Since this project uses RainbowKit, you’ll also need to obtain a Reown project key (here)[https://cloud.reown.com/sign-in] to complete the setup.

