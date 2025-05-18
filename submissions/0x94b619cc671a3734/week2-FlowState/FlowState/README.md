Flow State

A Web3-enabled interactive maze exploration game where users solve word puzzles to unlock frames and claim rewards.

## Features

- **Interactive Maze Interface**: Navigate through a visually appealing maze with clickable frames
- **Word Puzzle System**: Solve word-based puzzles to unlock frames
- **Web3 Integration**: Built on Flow blockchain with wallet integration
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Audio Experience**: Background music and sound effects
- **Social Links**: Connect with project creators via Twitter and website links

## Tech Stack

- **Frontend**: React with TypeScript
- **Blockchain**: Flow Blockchain
- **Styling**: CSS with modern animations and responsive design
- **Icons**: React Icons (FaXTwitter, FaGlobe, etc.)
- **Audio**: HTML5 Audio API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Flow CLI (for contract interaction)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd flowstate
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure Flow:
- Update the `CONTRACT_ADDRESS` in `InfoPanel.tsx` with your deployed contract address
- Ensure Flow CLI is properly configured

4. Start the development server:
```bash
npm start
# or
yarn start
```

## Game Mechanics

### Frame Unlocking
1. Click on any frame in the maze
2. Enter the correct words in the clue inputs
3. Validate your answers
4. Once all clues are correct, enter your wallet address to claim rewards

### Word Verification
- Words are verified against the Flow smart contract
- Each frame has 5 word slots
- Words must be entered in the correct order
- Empty slots are allowed but won't count towards completion

## Smart Contract Integration

The application interacts with a Flow smart contract for:
- Word verification
- Reward claiming
- Frame status tracking

## UI Components

### Main Components
- `MazeMap`: Displays the interactive maze with clickable frames
- `InfoPanel`: Shows frame details and word input interface
- `ModalCarousel`: Displays additional information in a carousel format

### Responsive Features
- Desktop: Full maze view with side panel
- Mobile: Collapsible maze view with modal interface
- Audio controls with volume slider
- Collapsible controls panel

## Styling

The application uses a modern, cyberpunk-inspired design with:
- Neon blue accents (#38c4ff)
- Dark backgrounds with transparency
- Glowing effects and animations
- Responsive layouts for all screen sizes

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Flow Blockchain team for the development tools
- React community for the excellent framework
- All contributors who have helped shape this project 