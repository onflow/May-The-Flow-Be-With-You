# Flow Token Gating

A React application that implements token-based access control using Flow blockchain. This application allows users to check if they have the required FLOW tokens to access premium content.

## Features

- Flow blockchain integration for token verification
- Clean and modern UI with vanilla CSS
- Three distinct views:
  - Initial check view
  - Access granted view
  - Access denied view
- Real-time token balance checking
- Error handling and validation
- Responsive design

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- A Flow wallet with FLOW tokens (for testing)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd flow_gating
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

```
flow_gating/
├── src/
│   ├── components/
│   │   └── FlowGating.tsx    # Main component for token gating
│   ├── App.tsx              # Root component
│   ├── App.css              # Global styles
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── package.json            # Project dependencies
└── vite.config.ts          # Vite configuration
```

## Configuration

The application is configured to work with Flow Testnet by default. The configuration includes:

- Flow Testnet access node
- Testnet wallet discovery
- FlowToken contract address
- FungibleToken contract address
- FlowGating contract address

## Usage

1. Enter your Flow address in the input field
2. Click "Check Access" to verify your token balance
3. The application will show one of three states:
   - Access Granted: If you have sufficient FLOW tokens
   - Access Denied: If you don't meet the token requirement
   - Error: If there's an issue with the connection or address

## Token Requirements

- Minimum required: 1.0 FLOW tokens
- The check is performed against the deployed FlowGating contract
- Contract address: `0xdfab49498c36d959`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Dependencies

Main dependencies:
- React 19.1.0
- @onflow/fcl 1.18.0
- @onflow/types 1.4.1
- lucide-react 0.511.0

Development dependencies:
- TypeScript 5.8.3
- Vite 6.3.5
- ESLint 9.25.0

## Production Integration

To integrate with production:

1. Install FCL:
```bash
npm install @onflow/fcl @onflow/types
```

2. Replace mock implementation with real FCL:
```typescript
import * as fcl from '@onflow/fcl'
```

3. Update contract addresses for mainnet
4. Configure FCL for mainnet

## Styling

The application uses vanilla CSS with a custom utility class system. Key features:

- Custom gradient backgrounds
- Responsive design
- Modern UI components
- Smooth transitions and animations
- Accessible color schemes

## Error Handling

The application handles various error cases:
- Invalid Flow addresses
- Network connection issues
- Contract interaction failures
- Configuration errors

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the repository or contact the maintainers.

## Acknowledgments

- Flow blockchain team
- React community
- FCL developers
