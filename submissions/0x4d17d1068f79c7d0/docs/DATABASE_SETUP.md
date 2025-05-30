# 🗄️ Database Setup for Memoreee

This guide will help you set up the Supabase database tables required for the Memoreee memory training platform.

## 🚀 Quick Setup

### Option 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**

   - Visit: https://todqarjzydxrfcjnwyid.supabase.co
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the setup script**

   - Copy the contents of `supabase/setup-tables.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

3. **Verify tables were created**
   - Go to **Table Editor** in the left sidebar
   - You should see these tables:
     - `user_profiles` - User account information
     - `practice_sessions` - Individual game sessions
     - `achievements` - User achievements and badges
     - `leaderboards` - Competition rankings
     - `memory_palaces` - Custom memory palace layouts
     - `user_progress` - Progress tracking per game type
     - `game_sessions` - Detailed session tracking with Flow integration

### Option 2: Command Line (Alternative)

```bash
# Install dependencies if not already done
bun install

# Run the database setup script
bun run db:verify
```

## 📊 Database Schema

### Core Tables

1. **`practice_sessions`** - Stores game session data

   - `user_id` - Player identifier
   - `game_type` - Type of memory game
   - `score` - Points earned
   - `accuracy` - Percentage accuracy
   - `duration_seconds` - Time taken

2. **`achievements`** - Player achievements and badges

   - `user_id` - Player identifier
   - `achievement_type` - Type of achievement
   - `achievement_name` - Display name
   - `points` - Points awarded

3. **`leaderboards`** - Rankings and competition data

   - `user_id` - Player identifier
   - `game_type` - Game category
   - `period` - Time period (daily/weekly/monthly/all_time)
   - `score` - Best score
   - `rank` - Position in leaderboard

4. **`user_profiles`** - Extended user information
   - `id` - Links to Supabase auth.users
   - `username` - Display name
   - `flow_address` - Blockchain wallet address

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
   - Go to **Table Editor** > `practice_sessions`
   - You should see your game session data

## 🐛 Troubleshooting

### "relation does not exist" errors

If you see errors like `relation "public.practice_sessions" does not exist`:

1. **Check if tables exist**

   - Go to Supabase Dashboard > Table Editor
   - Verify all tables are listed

2. **Re-run the setup script**

   - Copy `supabase/setup-tables.sql` again
   - Run it in SQL Editor

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

You'll know the setup worked when:

- ✅ No "relation does not exist" errors in console
- ✅ Game stats show real data instead of zeros
- ✅ Leaderboards display player rankings
- ✅ Achievements can be unlocked and displayed
- ✅ User profiles are created automatically

---

**Need help?** Check the console for specific error messages and refer to the [Supabase documentation](https://supabase.com/docs) for additional troubleshooting.
