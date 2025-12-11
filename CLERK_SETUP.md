# NEVRA - Clerk Authentication Setup Guide

## 🔐 Setting Up Clerk Authentication

### Step 1: Create Clerk Account
1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account (supports 10,000 MAU)
3. Create a new application

### Step 2: Get Your API Keys
1. In Clerk Dashboard, go to **API Keys**
2. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)

### Step 3: Configure Environment Variables
1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and add your Clerk key:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   ```

### Step 4: Configure Sign-In/Sign-Up Settings (Optional)
In Clerk Dashboard:
1. Go to **User & Authentication** → **Email, Phone, Username**
2. Enable your preferred sign-in methods
3. Go to **Paths** and verify:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/`

### Step 5: Customize Appearance (Optional)
1. Go to **Customization** → **Theme**
2. Match NEVRA's dark theme:
   - Primary color: `#7e22ce` (purple)
   - Background: `#0a0a0a`
   - Text: `#ffffff`

## 🚀 Running the Application

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and test:
- ✅ Sign-in/Sign-up flow
- ✅ Protected chat interface
- ✅ User profile menu
- ✅ Sign-out functionality

## 🔒 What's Protected

- **Home Page**: Prompt submission requires authentication
- **Chat Interface**: Entire page is protected
- **AI Features**: All AI interactions require sign-in

## 📝 Notes

- Free tier: 10,000 monthly active users
- Social logins available (Google, GitHub, etc.)
- Email verification can be enabled
- Multi-factor authentication supported
