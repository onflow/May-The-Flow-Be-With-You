# Scripts Directory

This directory contains all development and deployment scripts for the Steddie Memory Training Platform.

## Directory Structure

```
scripts/
├── deploy/          # Deployment scripts for Flow blockchain contracts
├── dev/             # Development and testing scripts
├── keys/            # Private keys and sensitive files
└── README.md        # This file
```

## Deploy Scripts (`deploy/`)

- `deploy-contracts.sh` - Main contract deployment script
- `deploy-memory-vrf.cdc` - Memory VRF contract deployment
- `deploy-vrf-simple.cdc` - Simple VRF deployment script

## Development Scripts (`dev/`)

- `dev-flow.js` - Flow development utilities
- `dev.js` - General development scripts
- `dev.sh` - Development shell scripts

## Keys (`keys/`)

- `emulator-account.pkey` - Flow emulator private key
- **Note**: This directory is gitignored for security

## Usage

### Deploy Contracts

```bash
cd scripts/deploy
./deploy-contracts.sh
```

### Development (with Bun - Recommended)

```bash
# From project root
bun run dev:flow    # Full Flow development environment
bun run dev:local   # Next.js only
bun run dev         # Next.js with Bun runtime
```

### Development (with Node.js)

```bash
# From project root
npm run dev:node    # Next.js with Node.js
cd scripts/dev
node dev-flow.js    # Direct script execution
```

## Security Notes

- All private keys are stored in `keys/` directory
- Keys directory is automatically gitignored
- Never commit private keys to version control
