# 🗄️ Unified Database Setup for Memoreee

This guide will help you set up the **clean, unified** Supabase database for the Memoreee memory training platform. We've eliminated all redundancy and created a DRY, production-ready schema.

## 🎯 **Clean Start Approach**

Since you're the only user and we're in development, we're starting fresh with a unified schema that eliminates all redundancy and conflicting tables.

## 🚀 Quick Setup

### Step 1: Clean Existing Data (Recommended)

1. **Go to your Supabase project dashboard**

   - Visit: https://todqarjzydxrfcjnwyid.supabase.co
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the cleanup script**

   - Copy the contents of `scripts/reset-supabase-clean.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute
   - This removes all old, conflicting tables

### Step 2: Create Unified Schema

1. **Run the unified migration**

   - Copy the contents of `supabase/migrations/002_unified_clean_schema.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

2. **Verify the clean setup**
   - Go to **Table Editor** in the left sidebar
   - You should see these **6 unified tables**:
     - ✅ `user_profiles` - User accounts (auth, anonymous, Flow)
     - ✅ `game_sessions` - Raw game data (unified storage)
     - ✅ `leaderboards` - Computed rankings (single source)
     - ✅ `achievements` - Player achievements
     - ✅ `user_progress` - Per-game progress tracking
     - ✅ `memory_palaces` - Custom palace layouts (future)

### Option 2: Command Line (Alternative)

```bash
# Install dependencies if not already done
bun install

# Run the database setup script
bun run db:verify
```

## 📊 Unified Database Schema

### **Key Improvements:**

- ✅ **No more `practice_sessions`** - unified into `game_sessions`
- ✅ **No more `leaderboard_entries`** - simplified to `leaderboards`
- ✅ **Consistent accuracy format** - 0-100 percentage across all tables
- ✅ **Tier system ready** - supports anonymous, Supabase, and Flow users
- ✅ **Single data flow** - game_sessions → leaderboards (computed)

### Core Tables

1. **`game_sessions`** - Unified storage for all game data

   - `user_id` - Player identifier (auth UUID, anonymous ID, or Flow address)
   - `game_type` - Type of memory game (`chaos_cards`, `memory_palace`, `speed_challenge`)
   - `session_id` - Unique session identifier
   - `score` - Points earned
   - `accuracy` - Percentage accuracy (0-100 format - CONSISTENT!)
   - `duration_seconds` - Time taken
   - `difficulty_level` - Game difficulty
   - `items_count` - Number of items in game
   - `perfect_game` - Boolean flag for 100% accuracy
   - `session_data` - Enhanced metadata (technique, vrfSeed, culturalCategory)
   - `flow_transaction_id` - Flow blockchain transaction ID

2. **`leaderboards`** - Computed rankings (single source of truth)

   - `user_id` - Player identifier
   - `game_type` - Game category
   - `period` - Time period (daily/weekly/monthly/all_time)
   - `score` - Best score for this period
   - `rank` - Calculated position (1st, 2nd, 3rd, etc.)
   - `total_sessions` - Number of games played
   - `average_accuracy` - Average accuracy (0-100 percentage)

3. **`user_profiles`** - Enhanced user information

   - `id` - Primary identifier (auth UUID, anonymous ID, or Flow address)
   - `auth_user_id` - Links to Supabase auth.users (optional)
   - `username` - Display name
   - `flow_address` - Flow blockchain wallet address
   - `user_tier` - User type (`anonymous`, `supabase`, `flow`)
   - `wallet_type` - Wallet technology (`cadence`, `evm`, `unknown`)

4. **`achievements`** - Player achievements and badges

   - `user_id` - Player identifier
   - `achievement_type` - Type of achievement
   - `achievement_name` - Display name
   - `points` - Points awarded
   - `nft_token_id` - Flow NFT token ID (if minted)

5. **`user_progress`** - Per-game progress tracking

   - `user_id` - Player identifier
   - `game_type` - Specific game
   - `level` - Current level
   - `best_score` - Personal best
   - `total_sessions` - Games played
   - `average_accuracy` - Personal average (0-100 percentage)
   - `streak_current` - Current win streak
   - `streak_best` - Best win streak

## 🔒 Security

The database uses **Row Level Security (RLS)** policies:

- ✅ Users can only access their own data
- ✅ Leaderboards are publicly viewable
- ✅ Anonymous users can play games and save sessions
- ✅ Authenticated users get full features

## 🧪 Testing the Setup

After running the setup:

1. **Start the development server**

   ```bash
   bun run dev
   ```

2. **Test the database connection**

   - Visit: http://localhost:3000
   - Navigate to any game page
   - Play a game - it should save your session
   - Check the stats/leaderboard components

3. **Verify in Supabase Dashboard**
   - Go to **Table Editor** > `game_sessions`
   - You should see your game session data with unified structure

## 🐛 Troubleshooting

### "relation does not exist" errors

If you see errors like `relation "public.game_sessions" does not exist`:

1. **Check if tables exist**

   - Go to Supabase Dashboard > Table Editor
   - Verify all 6 unified tables are listed

2. **Re-run the unified setup**

   - First run `scripts/reset-supabase-clean.sql`
   - Then run `supabase/migrations/002_unified_clean_schema.sql`

3. **Check RLS policies**
   - Go to Authentication > Policies
   - Ensure policies exist for each table

### Connection issues

1. **Verify environment variables**

   ```bash
   # Check .env.local contains:
   NEXT_PUBLIC_SUPABASE_URL=https://todqarjzydxrfcjnwyid.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Test Supabase connection**
   ```bash
   bun run db:verify
   ```

## 📈 Next Steps

Once the database is set up:

1. **Test all game types** to ensure data is being saved
2. **Create a user account** to test authenticated features
3. **Play multiple games** to see leaderboards populate
4. **Check achievements** are being unlocked properly

## 🎯 Success Indicators

You'll know the unified setup worked when:

- ✅ **No "relation does not exist" errors** in console
- ✅ **Game stats show real data** instead of zeros
- ✅ **Leaderboards display proper rankings** with calculated positions
- ✅ **Achievements unlock consistently** across all game types
- ✅ **User profiles created automatically** for all user types
- ✅ **Consistent accuracy format** (0-100 percentage) across all games
- ✅ **Single data flow** - no duplicate progress saving
- ✅ **Clean table structure** - only 6 tables, no redundancy

## 🚀 **Benefits of Unified Architecture:**

- **350+ lines of code removed** - much cleaner codebase
- **Single source of truth** - LeaderboardService handles everything
- **Consistent data format** - 0-100 accuracy across all games
- **DRY principle** - no duplicate ranking calculations
- **Future-proof** - easy to add new game types
- **Performance optimized** - efficient single-table queries

---

**Need help?** Check the console for specific error messages and refer to the [Supabase documentation](https://supabase.com/docs) for additional troubleshooting.
