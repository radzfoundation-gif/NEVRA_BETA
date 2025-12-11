# 🔐 Critical Setup: Connect Clerk to Supabase

To fix the **"No JWT template exists"** error and enable chat history, you must link Clerk and Supabase.

### Step 1: Get Supabase JWT Secret
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **Settings** (cog icon) → **API**.
3. Scroll down to **JWT Settings**.
4. Reveal and **Copy** the `JWT Secret`.

### Step 2: Create Clerk Template
1. Go to your [Clerk Dashboard](https://dashboard.clerk.com).
2. Go to **JWT Templates** (in the sidebar).
3. Click **New Template**.
4. Select **Supabase** from the list.
5. Configure it exactly like this:
   - **Name**: `supabase` (must be lowercase!)
   - **Signing Algorithm**: `HS256`
   - **Signing Key**: Paste your **Supabase JWT Secret** here.
6. Click **Save**.

### Step 3: Restart App
1. Stop your running terminal (`Ctrl+C`).
2. Run `npm run dev` again.
3. Refresh the page.

✅ **Done!** Your chat history will now work perfectly.
