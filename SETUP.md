# Bloom — Setup Guide

This guide walks you through setting up Bloom from scratch. No database experience needed — just follow each step.

---

## Prerequisites

- **Node.js 18+** installed ([download](https://nodejs.org))
- A free **Supabase** account ([supabase.com](https://supabase.com))
- A **Razorpay** account for payments ([razorpay.com](https://razorpay.com)) — can be set up later
- A **Google Cloud** account for Google sign-in — can be set up later

---

## Step 1: Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Choose your organisation (or create one)
4. Fill in:
   - **Project name:** `bloom` (or anything you like)
   - **Database password:** generate a strong one and save it somewhere safe
   - **Region:** choose the closest to your users (e.g., Mumbai for India)
5. Click **"Create new project"** and wait ~2 minutes

**What success looks like:** You see the project dashboard with a green "Project is ready" status.

### Get your keys

1. In your Supabase dashboard, go to **Settings → API** (left sidebar)
2. You'll see:
   - **Project URL** — copy this (starts with `https://`)
   - **anon public** key — copy this
   - **service_role secret** key — click "Reveal" and copy this

**What success looks like:** You have three values: a URL and two long strings.

---

## Step 2: Configure Environment Variables

1. In the `bloom` project folder, copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in any text editor and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=paste-your-service-role-key-here
   ```
3. Set your admin account credentials:
   ```
   ADMIN_EMAIL=your-email@example.com
   ADMIN_PASSWORD=a-strong-password
   ADMIN_NAME=Your Name
   ```

**What success looks like:** Your `.env` file has real values (not the placeholder text).

---

## Step 3: Run the Setup Script

```bash
npm install
npm run setup
```

This script will:
- Run all database migrations (create tables)
- Apply security policies (Row Level Security)
- Seed the demo course ("The Art of Conscious Love" — 20 lessons)
- Seed 2 "Coming Soon" courses
- Create your admin account
- Generate course cover artwork

**What success looks like:** You see `✅ Setup complete!` with your admin email displayed. No red error messages.

**Safe to run again:** If you run `npm run setup` a second time, it skips everything that already exists. Nothing gets duplicated.

---

## Step 4: Run the Database Migrations Manually (if Step 3 had warnings)

If the setup script showed warnings about migrations needing manual execution:

1. Go to your Supabase dashboard → **SQL Editor**
2. Open each file in `supabase/migrations/` (001 through 005) in order
3. Paste the contents into the SQL Editor and click **"Run"**

Do them in order: 001, 002, 003, 004, 005.

**What success looks like:** Each migration runs with "Success. No rows returned." and you can see the tables in **Table Editor**.

Then run `npm run setup` again to seed the data.

---

## Step 5: Enable Google Sign-In

This lets users sign in with their Google account (one click, no password needed — most Indian users prefer this).

### 5a: Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **"New Project"**
3. Name it `Bloom` and click **"Create"**
4. Make sure the new project is selected in the dropdown

**What success looks like:** You see "Bloom" in the project dropdown at the top of the page.

### 5b: Configure the OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services → OAuth consent screen**
2. Click **"Configure Consent Screen"**
3. Select **External** and click **"Create"**
4. Fill in:
   - **App name:** `Bloom`
   - **User support email:** your email
   - **Developer contact email:** your email
5. Click **"Save and Continue"**
6. On the Scopes page, click **"Add or Remove Scopes"**
   - Select `email` and `profile` (openid is auto-included)
   - Click **"Update"** then **"Save and Continue"**
7. On the Test users page, click **"Save and Continue"**
8. Review and click **"Back to Dashboard"**

**What success looks like:** The OAuth consent screen shows status "Testing" with your app name.

### 5c: Create OAuth Client ID

1. Go to **APIs & Services → Credentials**
2. Click **"+ Create Credentials" → "OAuth client ID"**
3. Application type: **Web application**
4. Name: `Bloom Web`
5. Under **Authorized redirect URIs**, click **"+ Add URI"** and enter:
   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   ```
   Replace `YOUR-PROJECT-REF` with the part of your Supabase URL between `https://` and `.supabase.co`

   For example, if your Supabase URL is `https://abcdefghijk.supabase.co`, enter:
   ```
   https://abcdefghijk.supabase.co/auth/v1/callback
   ```
6. Click **"Create"**
7. A popup shows your **Client ID** and **Client Secret** — copy both

**What success looks like:** You have a Client ID (ends in `.apps.googleusercontent.com`) and a Client Secret.

### 5d: Enable Google in Supabase

1. Go to your Supabase dashboard → **Authentication → Providers**
2. Find **Google** in the list and expand it
3. Toggle **"Enable Sign in with Google"** to ON
4. Paste your **Client ID** and **Client Secret** from the previous step
5. Click **"Save"**

**What success looks like:** Google shows as "Enabled" in the Providers list with a green indicator.

### 5e: Test It

1. Start the app: `npm run dev`
2. Go to `http://localhost:3000/signup`
3. Click **"Continue with Google"**
4. You should see the Google sign-in popup
5. After signing in, you should land on the dashboard

**What success looks like:** You're logged in and see the Bloom dashboard. Your Google name and avatar appear in the profile menu.

---

## Step 6: Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**What success looks like:** You see the Bloom app with the login/signup pages working. The seeded course appears in the database.

---

## Step 7: Set Up Razorpay (When Ready for Payments)

1. Go to [razorpay.com](https://razorpay.com) and create an account
2. Go to **Settings → API Keys → Generate Key**
3. Copy the **Key ID** and **Key Secret** into your `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your-secret
   ```
4. For webhooks, go to **Settings → Webhooks → + Add New Webhook**
   - Webhook URL: `https://your-domain.com/api/webhooks/razorpay`
   - Events: select `payment.captured` and `payment.failed`
   - Copy the webhook secret into `.env`:
     ```
     RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
     ```

**What success looks like:** Test mode payments work in the checkout flow.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm run setup` says "Missing SUPABASE keys" | Check your `.env` file has the correct keys from Step 2 |
| Google sign-in shows "redirect_uri_mismatch" | Check the redirect URI in Google Console matches your Supabase URL exactly |
| Tables don't appear in Supabase | Run the migrations manually per Step 4 |
| "Permission denied" errors | Make sure you're using the `service_role` key (not the `anon` key) in `SUPABASE_SERVICE_ROLE_KEY` |

---

## Quick Reference

| Command | What it does |
|---------|-------------|
| `npm run setup` | Run migrations, seed data, create admin (safe to run multiple times) |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run lint` | Run the linter |
