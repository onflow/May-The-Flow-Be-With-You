# Enhanced Authentication System

## Overview

The authentication system has been completely redesigned to provide clear user profiles and experiences based on three distinct tiers. This system ensures that users understand their capabilities and provides smooth upgrade paths.

## User Tiers

### 1. Anonymous Users (`anonymous`)
- **Description**: Users playing without any account
- **Capabilities**:
  - ✅ Play all games
  - ❌ No progress tracking
  - ❌ No leaderboards
  - ❌ No achievements
  - ❌ No score tracking
  - ❌ No NFT rewards
- **Limitations**:
  - Limited to 7 cards difficulty
  - Score multiplier: 0% (no scoring)
- **Experience**: 
  - Shows upgrade prompts
  - Displays preview of locked features
  - Clear call-to-action to sign up

### 2. Email/Supabase Users (`supabase`)
- **Description**: Users signed in with email/Google OAuth
- **Capabilities**:
  - ✅ Progress tracking
  - ✅ Leaderboards (reduced scoring)
  - ✅ Achievements
  - ❌ No blockchain features
  - ❌ No VRF verification
  - ❌ No NFT rewards
- **Limitations**:
  - Score multiplier: 80%
  - Max difficulty: 10 cards
- **Experience**:
  - Shows Flow wallet upgrade prompts
  - Access to most features with reduced benefits

### 3. Flow Wallet Users (`flow`)
- **Description**: Users connected with Flow blockchain wallet
- **Capabilities**:
  - ✅ Full scoring (100%)
  - ✅ VRF verification
  - ✅ NFT achievements
  - ✅ On-chain leaderboards
  - ✅ All features unlocked
- **Limitations**: None
- **Experience**:
  - No upgrade prompts
  - Full feature access
  - Blockchain verification badges

## Key Components

### AuthProvider (`shared/providers/AuthProvider.tsx`)
- **Enhanced user profiles** with tier-based capabilities
- **Improved error handling** and loading states
- **Race condition prevention** in auth initialization
- **Helper functions** for feature access checking
- **Consistent user experience** across auth states

### UserTierStatus (`shared/components/UserTierStatus.tsx`)
- **Visual tier indicators** with icons and colors
- **Capability explanations** for each tier
- **Upgrade prompts** with clear benefits
- **Compact badge version** for headers

### Updated Components
All major components now properly handle the three-tier system:

#### Achievements Component
- **Anonymous**: Shows preview of available achievements with upgrade prompt
- **Authenticated**: Shows earned achievements based on tier capabilities
- **Consistent messaging** about tier benefits

#### Leaderboard Component  
- **Anonymous**: Shows sample leaderboard data with upgrade prompt
- **Supabase**: Shows real leaderboard with 80% scoring indicator
- **Flow**: Shows full leaderboard with blockchain verification

#### UserStats Component
- **Anonymous**: Shows placeholder stats with upgrade prompts
- **Authenticated**: Shows real stats based on tier capabilities
- **Tab-based interface** with tier-appropriate content

## Authentication Flow

### Initialization
1. **Flow auth check first** (preferred for Web3 users)
2. **Supabase auth fallback** (email/OAuth users)
3. **Anonymous state** if no authentication found
4. **Proper error handling** for each auth method

### State Management
- **Single source of truth** for user tier
- **Capability-based feature access** using `canAccessFeature()`
- **Experience-based UI rendering** using `getUserExperience()`
- **Consistent loading and error states**

### User Experience
- **Clear tier indicators** in game headers
- **Preview content** for locked features
- **Smooth upgrade paths** with benefit explanations
- **No jarring transitions** between auth states

## Benefits of New System

### For Users
- **Clear understanding** of their current capabilities
- **Obvious upgrade paths** with tangible benefits
- **No confusion** about why features are limited
- **Smooth onboarding** from anonymous to authenticated

### For Developers
- **Consistent API** for checking user capabilities
- **Easy feature gating** using capability flags
- **Centralized auth logic** with proper error handling
- **Type-safe user profiles** with clear interfaces

### For Product
- **Higher conversion rates** through clear upgrade prompts
- **Better user retention** with progress tracking
- **Monetization opportunities** through tier benefits
- **Scalable architecture** for future features

## Usage Examples

### Checking User Capabilities
```typescript
const { canAccessFeature, getUserCapabilities } = useAuth();

// Check specific capability
if (canAccessFeature('canEarnPoints')) {
  // Show scoring features
}

// Get all capabilities
const capabilities = getUserCapabilities();
const scoreMultiplier = capabilities.scoreMultiplier;
```

### Displaying Tier Status
```typescript
// Full tier status with upgrade prompts
<UserTierStatus showUpgradePrompt={true} />

// Compact badge for headers
<UserTierBadge className="ml-4" />
```

### Conditional Rendering
```typescript
const { userTier, getUserExperience } = useAuth();
const experience = getUserExperience();

if (experience.showUpgradePrompts) {
  // Show upgrade call-to-action
}

if (experience.showFullFeatures) {
  // Show all features
}
```

## Testing the System

1. **Anonymous User**: Visit `/actually-fun-games` without signing in
2. **Email User**: Sign up with email and test reduced features
3. **Flow User**: Connect Flow wallet and test full features
4. **Transitions**: Test signing in/out and tier upgrades

The system provides a clear, consistent experience across all authentication states while encouraging user progression through the tiers.
