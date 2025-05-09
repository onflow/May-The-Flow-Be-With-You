# Flow Dice Game - Project Plan

## Project Overview
A simple dice game built with Phaser 3 and integrated with Flow blockchain for the May The Flow Be With You contest. The game will feature basic dice rolling mechanics with blockchain integration for recording results and maintaining a leaderboard.

## Technical Stack
- **Frontend**: Next.js + Phaser 3
- **Blockchain**: Flow
- **Language**: TypeScript
- **Smart Contracts**: Cadence

## Development Phases

### Phase 1: Basic Dice Game Setup (1-2 days)
#### Game Structure
- [x] Create main game scene (`DiceGameScene.ts`)
- [x] Set up game configuration (1024x768 - adjusted from original 800x600 for better layout)
- [x] Implement game state management (scene transitions, button states)

#### Dice Implementation
- [x] Create dice sprites (using Kenney game assets)
- [x] Implement dice rolling animation
- [x] Add basic physics (rotation and bounce effects)
- [x] Create basic UI (roll button, score display)

### Phase 2: Game Mechanics (1-2 days)
#### Core Gameplay
- [x] Implement dice rolling mechanics
- [x] Add score calculation
- [x] Create win/lose conditions
- [ ] Add sound effects

#### UI/UX
- [x] Design and implement game menu
- [x] Add score display
- [ ] Create game instructions
- [ ] Implement game over screen
- [ ] Develop responsive web layout to house the game (using v0.dev for cyberpunk-themed UI)

### Phase 3: Flow Blockchain Integration (2-3 days)
#### Smart Contract
- [ ] Create smart contract for:
  - Game results storage
  - Player score management
  - Game state handling

#### Flow Integration
- [x] Set up Flow Client Library (FCL)
- [x] Implement wallet connection
- [x] Create Flow configuration and provider setup
- [x] Set up basic Flow query integration
- [x] Create functions for:
  - Requesting random numbers from Flow VRF
  - Handling VRF callbacks for dice rolls
  - Fetching player history (later)
  - Displaying leaderboard (later)

### Phase 4: Wallet Integration (1-2 days)
#### Authentication
- [ ] Set up Flow wallet authentication using @onflow/kit
- [ ] Create React context for wallet state management
- [ ] Implement wallet connection UI
- [ ] Add wallet status display
- [ ] Handle wallet disconnection

#### User Experience
- [ ] Add loading states for wallet operations
- [ ] Implement error handling for wallet interactions
- [ ] Add wallet connection persistence
- [ ] Create user profile section

### Phase 5: Deployment (1-2 days)
#### Next.js Setup
- [x] Configure Next.js build settings
- [ ] Set up environment variables
- [x] Optimize assets for production
- [x] Configure static file serving

#### Deployment
- [x] Set up deployment pipeline for Vercel
- [ ] Configure domain settings
- [ ] Set up SSL certificates
- [ ] Implement CI/CD workflow

### Phase 6: Polish and Testing (1-2 days)
#### Game Polish
- [x] Add animations and transitions
- [ ] Implement sound effects
- [x] Add visual feedback
- [x] Optimize performance

#### Testing
- [x] Test game mechanics
- [x] Test basic Flow integration
- [ ] Test blockchain integration
- [ ] Test wallet integration
- [x] Cross-browser testing
- [x] Mobile responsiveness

### Phase 7: Responsive Design and Layout (1-2 days)
#### Mobile Optimization
- [x] Implement responsive layout for mobile devices
- [x] Add dynamic scaling using Phaser's Scale.FIT mode
- [x] Create mobile-friendly UI with appropriate button sizes
- [x] Add proper viewport meta tags for mobile web experience

#### Layout Structure
- [x] Design flexible layout with sidebar and game area
- [x] Create responsive CSS for different screen sizes
- [x] Implement proper game positioning at the top of the viewport
- [x] Add media queries for adaptive layout on different devices

## Technical Implementation Details

### Game Structure
```typescript
// src/game/scenes/DiceGameScene.ts
class DiceGameScene extends Phaser.Scene {
    private dice1: Phaser.GameObjects.Sprite;
    private dice2: Phaser.GameObjects.Sprite;
    private rollButton: Phaser.GameObjects.Text;
    private scoreText: Phaser.GameObjects.Text;
    
    constructor() {
        super({ key: 'DiceGameScene' });
    }
    
    preload() {
        // Load assets
    }
    
    create() {
        // Initialize game objects
    }
    
    update() {
        // Game loop
    }
}
```

Note: The game is configured for a 1024x768 resolution, optimized for both desktop and mobile viewing. The layout is designed to be responsive while maintaining the cyberpunk aesthetic.

### Flow Integration
```typescript
// src/lib/flow/hooks/useDiceQuery.ts
export const useDiceQuery = () => {
  const { data, isLoading, error, refetch } = useFlowQuery({
    cadence: diceRollScript,
    args: (arg, t) => [],
    query: { staleTime: 10000 },
  });

  return {
    result: data ? calculateTotal(data as number[]) : 0,
    isLoading,
    error,
    refetch
  };
};
```

### Wallet Integration (New)
```typescript
// src/lib/flow/context/WalletContext.tsx
interface WalletContextType {
  user: any;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const WalletContext = createContext<WalletContextType>(null);

export const WalletProvider: React.FC = ({ children }) => {
  // Wallet state and methods
  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  );
};
```

### Responsive Design (New)
The responsive design implementation uses Phaser's Scale.FIT mode to automatically scale the game canvas to fit different screen sizes while maintaining aspect ratio. Key properties include horizontal centering and size constraints for various devices.

**Key Files:**
- `src/game/main.ts` - Contains Phaser game configuration with scale settings
- `src/pages/index.tsx` - Contains viewport meta tags for mobile optimization
- `src/game/scenes/DiceGameScene.ts` - Implements responsive element positioning
- `src/game/scenes/MainMenu.ts` - Handles responsive UI layout

### Layout Structure (New)
The layout uses a flexible CSS design with a sidebar for controls and a main game area. On desktop, these are arranged horizontally, while on mobile they stack vertically with the game on top. Media queries handle responsive adjustments based on screen size.

**Key Files:**
- `src/styles/globals.css` - Contains flex layout and media queries
- `src/App.tsx` - Defines the main application structure with sidebar
- `src/PhaserGame.tsx` - Implements the game container wrapper
- `src/styles/Home.module.css` - Styles for the main page layout

## Project Structure
```
src/
├── game/
│   ├── scenes/
│   │   ├── DiceGameScene.ts
│   │   └── MainMenu.ts
│   ├── components/
│   │   └── DiceGame.tsx
│   └── main.ts
├── lib/
│   └── flow/
│       ├── config.ts
│       ├── FlowProvider.tsx
│       ├── context/
│       │   └── WalletContext.tsx
│       ├── hooks/
│       │   └── useDiceQuery.ts
│       └── scripts/
│           └── diceRoll.ts
├── pages/
│   └── index.tsx
└── styles/
    └── globals.css
```

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Access the game at `http://localhost:3000`

## Development Guidelines
1. Follow TypeScript best practices
2. Use Phaser 3 documentation for game development
3. Follow Flow blockchain development guidelines
4. Maintain clean code structure
5. Document all major functions and components

## Resources
- [Phaser 3 Documentation](https://newdocs.phaser.io/docs/3.60.0)
- [Flow Documentation](https://developers.flow.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Notes
- Keep track of progress using the checkboxes in this document
- Update this document as new requirements or changes are identified
- Document any challenges or solutions discovered during development

## Current Progress Notes
- Completed basic game structure with two dice
- Implemented scene transitions between main menu and dice game
- Added basic UI elements (roll button, score display, back button)
- Implemented dice rolling animation with Kenney game assets
- Added score calculation and display
- Added visual effects (rotation and bounce) during dice rolling
- Successfully integrated Flow with React components
- Set up Flow query integration with VRF for random numbers
- Implemented responsive layout for both mobile and desktop devices
- Added dynamic game scaling with proper positioning
- Set up Vercel deployment configuration
- Created flexible sidebar layout that adapts to different screen sizes
- Next steps: Implement wallet integration and finalize deployment 