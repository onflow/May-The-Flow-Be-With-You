# Technical Documentation

## Architecture Overview

### Frontend Stack

- **Framework**: Next.js 15.3.2 with App Router and Turbopack
- **Runtime**: React 19 (cutting-edge features)
- **UI Components**:
  - Supabase UI Library (authentication, real-time features)
  - shadcn/ui base components
  - Radix UI primitives (dialogs, dropdowns, tabs)
  - Custom component library (memory-focused interactions)
- **Styling**: Tailwind CSS v4 with custom memory-themed design system
- **3D Rendering**: Three.js + React Three Fiber + Drei for immersive memory palace environments
- **State Management**: React Server Components + Zustand for client state
- **Animations**: Framer Motion for smooth transitions and micro-interactions

### Blockchain Integration

- **Flow Blockchain**: FCL (Flow Client Library) v1.12.2
  - Multi-network support (Emulator, Testnet, Mainnet)
  - Flow Dev Wallet integration for local development
  - WalletConnect support for production wallets
  - NFT minting for memory achievements
  - Tournament prize pools and entry fees
- **Authentication**: Hybrid Web2/Web3 auth system
  - Email/password authentication (primary for easy onboarding)
  - Google OAuth integration (configured, test mode)
  - Flow wallet authentication (Web3 upgrade path)
  - Seamless account linking and switching between auth methods

### Backend Infrastructure

- **Database**: Supabase (PostgreSQL)
  - User profiles and progress tracking
  - Memory technique performance analytics
  - Social features (leaderboards, challenges)
  - Real-time collaboration data
  - Flow wallet address linking
- **Authentication**: Dual-mode authentication system
  - Flow wallet integration via FCL
  - Supabase Auth for email/social login
  - Unified user experience across auth methods
- **Real-time Features**: Supabase Realtime
  - Live collaborative palace building
  - Real-time competitions and challenges
  - Social presence indicators
  - Multiplayer game synchronization

### AI Integration

- **LLM Provider**: Anthropic Claude (via API)
- **AI Features**:
  - Adaptive training recommendations
  - Story generation for linking method
  - Memory palace architecture suggestions
  - Performance analysis and insights
  - Conversational practice partner

## Key Dependencies

```json
{
  "dependencies": {
    "next": "15.3.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/auth-ui-react": "^0.4.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@onflow/fcl": "^1.12.2",
    "@onflow/types": "^1.0.5",
    "@onflow/util-encode-key": "^1.0.4",
    "three": "^0.158.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.88.0",
    "tailwindcss": "^4",
    "zustand": "^4.4.0",
    "framer-motion": "^12.10.5",
    "lucide-react": "^0.263.1",
    "recharts": "^2.8.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0"
  }
}
```

## Database Schema

### Core Tables

```sql
-- User profiles and progress
users (
  id, email, username, created_at,
  skill_levels jsonb,
  preferences jsonb,
  total_practice_time interval
)

-- Memory palace definitions
memory_palaces (
  id, user_id, name, description,
  layout_data jsonb,
  is_public boolean,
  difficulty_level integer
)

-- Training sessions and performance
practice_sessions (
  id, user_id, technique_type,
  items_practiced jsonb,
  accuracy_rate float,
  completion_time interval,
  created_at timestamp
)

-- Social features
challenges (
  id, creator_id, challenge_type,
  parameters jsonb,
  start_time timestamp,
  end_time timestamp
)

challenge_participants (
  id, challenge_id, user_id,
  score integer,
  submission_data jsonb
)
```

## Development Setup

### Prerequisites

- **Bun** (recommended) or **npm**
- **Node.js 18+**
- **Flow CLI** (for blockchain features)
- **Supabase CLI** (for database setup)
- **Docker** (optional, for local Supabase development)

### Quick Start

```bash
# 1. Navigate to this directory
cd submissions/0x4d17d1068f79c7d0

# 2. Install dependencies
npm install

# 3. Set up environment variables (optional)
cp .env.example .env.local
# Edit .env.local with your API keys if needed

# 4. Start development server
npm run dev
```

### Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://todqarjzydxrfcjnwyid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Flow Blockchain Configuration
NEXT_PUBLIC_FLOW_NETWORK=testnet  # emulator for local dev
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=5b064f3a595f8ccb12b5e57388c7fc7d

# AI Integration
ANTHROPIC_API_KEY=your_claude_api_key
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run dev:flow` - Start Flow emulator + dev wallet + Next.js
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks
- `npm run flow:emulator` - Start Flow emulator only
- `npm run flow:dev-wallet` - Start Flow dev wallet only
- `npm run flow:deploy` - Deploy contracts to emulator

## Cultural Theming System

The app uses a scalable cultural theming system that allows easy addition of new cultures:

### Cultural Configuration

Each culture is defined in `shared/config/cultures.ts` with:
- **Visual elements**: Colors, icons, emojis
- **Cultural items**: Authentic objects and concepts
- **Cultural places**: Traditional locations and spaces
- **Steddie personality**: Cultural adaptation of the AI coach
- **Game adaptations**: Culture-specific game mechanics

### Adding New Cultures

1. Define cultural data in the configuration
2. Add cultural assets (images, icons)
3. Update the theming system
4. Test across all game types
5. Validate cultural authenticity

## Performance Optimizations

- ✅ **Turbopack** enabled for faster builds
- ✅ **Security headers** configured
- ✅ **Image optimization** with Next.js
- ✅ **Bundle analysis** available (`npm run build:analyze`)
- ✅ **Static generation** where possible
- ✅ **Lazy loading** for game components
- ✅ **Memory management** for 3D environments

## Deployment

### Production Deployment

The app is currently deployed on Netlify with static export optimization:

- **Production URL**: https://memoreee.netlify.app
- **Build Command**: `npm run build`
- **Output Directory**: `out`
- **Environment**: Static export with client-side routing

### Alternative Deployment Options

- **Vercel**: Recommended for full Next.js features
- **Netlify**: Current deployment (static export)
- **Self-hosted**: Docker container available

## Testing Strategy

### Current Testing

- **TypeScript**: Full type checking
- **ESLint**: Code quality and consistency
- **Manual Testing**: Cross-browser and device testing

### Planned Testing

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Playwright for E2E testing
- **Performance Tests**: Lighthouse CI
- **Accessibility Tests**: axe-core integration

## Security Considerations

- **Authentication**: Secure token handling with Supabase
- **Data Validation**: Input sanitization and validation
- **CORS**: Properly configured for production
- **Environment Variables**: Secure handling of API keys
- **Content Security Policy**: Configured security headers

## Monitoring and Analytics

- **Error Tracking**: Built-in error boundaries
- **Performance Monitoring**: Web Vitals tracking
- **User Analytics**: Privacy-focused analytics
- **Game Metrics**: Progress and engagement tracking

## Contributing Guidelines

1. **Code Style**: Follow ESLint and Prettier configurations
2. **Cultural Sensitivity**: Ensure respectful representation
3. **Performance**: Maintain optimization standards
4. **Testing**: Add tests for new features
5. **Documentation**: Update docs for changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.
