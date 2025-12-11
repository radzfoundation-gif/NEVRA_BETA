# Supabase Setup Guide for NEVRA

## 🚀 Quick Start

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Sign in
3. Click **New Project**
4. Fill in details:
   - **Name**: NEVRA
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (500MB database, 2GB bandwidth)
5. Click **Create new project**
6. Wait 2-3 minutes for setup

---

### Step 2: Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy entire contents of `supabase-schema.sql`
4. Paste into SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. Verify success: "Success. No rows returned"

This creates:
- ✅ 4 tables (users, chat_sessions, messages, user_preferences)
- ✅ Row Level Security policies
- ✅ Indexes for performance
- ✅ Triggers for auto-updating timestamps

---

### Step 3: Get API Keys

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **Anon/Public Key:** (under "Project API keys")
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

### Step 4: Configure Environment Variables

1. Open `.env.local` in your project
2. Add Supabase credentials:

```env
# Supabase Database (REQUIRED)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Save the file

---

### Step 5: Test Connection

1. Restart dev server:
   ```bash
   npm run dev
   ```

2. Sign in to your app
3. Check Supabase Dashboard → **Table Editor** → **users**
4. You should see your user created automatically!

---

## 📊 Database Tables Overview

### **users**
Stores user information synced from Clerk
- `id` - Clerk user ID
- `email` - User email
- `full_name` - Display name
- `avatar_url` - Profile picture

### **chat_sessions**
Stores chat conversations
- `id` - Unique session ID
- `user_id` - Owner
- `title` - Chat title (auto-generated)
- `mode` - 'builder' or 'tutor'
- `provider` - 'groq', 'gemini', or 'openai'

### **messages**
Stores individual chat messages
- `id` - Unique message ID
- `session_id` - Parent chat
- `role` - 'user' or 'ai'
- `content` - Message text
- `code` - Generated code (if any)
- `images` - Attached images

### **user_preferences**
Stores user settings
- `user_id` - User ID
- `default_provider` - Preferred AI
- `theme` - UI theme
- `preferences` - Custom JSON settings

---

## 🔒 Security (Row Level Security)

All tables have RLS enabled. Users can only:
- ✅ Read their own data
- ✅ Create their own data
- ✅ Update their own data
- ✅ Delete their own data

This is enforced at the database level, so even if someone gets your API key, they can't access other users' data.

---

## 🧪 Testing Your Setup

### 1. User Sync Test
- Sign in to NEVRA
- Check Supabase → **users** table
- Your user should appear

### 2. Chat Persistence Test
- Send a message in chat
- Check Supabase → **chat_sessions** table
- Check Supabase → **messages** table
- Your chat should be saved

### 3. Preferences Test
- Change AI provider
- Refresh page
- Provider should be remembered

---

## 📈 Monitoring

### View Data
- Go to **Table Editor** to browse data
- Go to **SQL Editor** to run custom queries

### Check Usage
- Go to **Settings** → **Usage**
- Monitor database size and bandwidth
- Free tier limits:
  - 500MB database
  - 2GB bandwidth/month
  - Unlimited API requests

---

## 🔧 Troubleshooting

### "Missing Supabase credentials" Error
- Check `.env.local` has correct URL and key
- Restart dev server after adding env vars

### User Not Syncing
- Check Clerk is working (can you sign in?)
- Check browser console for errors
- Verify RLS policies are created

### Messages Not Saving
- Check you're signed in
- Check browser console for errors
- Verify `chat_sessions` table exists

### RLS Policy Errors
- Re-run `supabase-schema.sql`
- Check Supabase → **Authentication** → **Policies**

---

## 🎯 What's Next?

After setup, NEVRA will automatically:
- ✅ Sync users from Clerk to Supabase
- ✅ Save all chat messages
- ✅ Remember user preferences
- ✅ Load chat history on refresh
- ✅ Enable chat search (coming soon)

---

## 📝 Backup & Export

### Manual Backup
1. Go to **Database** → **Backups**
2. Click **Create backup**

### Export Data
1. Go to **Table Editor**
2. Select table
3. Click **...** → **Download as CSV**

### Automatic Backups
- Free tier: Daily backups (7 days retention)
- Pro tier: Point-in-time recovery

---

## 🆘 Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Check `supabase-schema.sql` for table structure
- Check `lib/database.ts` for available functions
