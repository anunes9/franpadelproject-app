# Local Login Setup Guide

This guide will help you set up and use the login functionality locally for development.

## Prerequisites

1. **Supabase CLI** - Already installed at `/opt/homebrew/bin/supabase`
2. **Docker** - Required for running Supabase locally
3. **Node.js** - For running the Next.js application

## Step 1: Start Supabase Locally

First, make sure Docker is running, then start your local Supabase instance:

```bash
# Start Supabase (this will start all services including database, auth, storage, etc.)
supabase start

# This will output important information including:
# - API URL: http://127.0.0.1:54321
# - anon key: (your anonymous key)
# - service_role key: (your service role key)
```

**Note:** The first time you run `supabase start`, it may take a few minutes to download Docker images.

## Step 2: Configure Environment Variables

Create or update your `.env.local` file in the project root with the local Supabase credentials:

```bash
# Get the credentials from supabase start output
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-start>
```

You can also get these values by running:

```bash
supabase status
```

## Step 3: Create a Test User

You have several options to create a test user:

### Option A: Using Supabase Studio (Recommended)

1. Open Supabase Studio in your browser:

   ```bash
   # Studio URL is typically: http://127.0.0.1:54323
   ```

   Or run:

   ```bash
   supabase studio
   ```

2. Navigate to **Authentication** → **Users** → **Add User**
3. Enter an email and password
4. **Important:** Make sure to confirm the email (click "Confirm email" button) or the user won't be able to log in

### Option B: Using the Signup Flow

1. Start your Next.js app:

   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000` (or `http://localhost:3000/en`)

3. Use the signup form if available, or create a user via Supabase Studio first

### Option C: Using SQL (For Seeded Users)

If you have seed data, you can check the seed file:

```bash
cat supabase/seeds/001_initial_seed.sql
```

The seed file shows an admin user with email `admin@franpadel.com`. To use this:

1. Create the user in Supabase Auth (via Studio or API)
2. Make sure the user ID matches: `1969e7a4-6e51-4b8c-9ad5-6bb90c561ba4`

## Step 4: View Test Emails (OTP/Magic Links)

When testing OTP or magic link flows, emails are not actually sent. Instead, they're captured by Inbucket:

1. Open Inbucket (email testing server): `http://127.0.0.1:54324`
2. Any emails sent by Supabase Auth will appear here
3. Click on emails to view the OTP codes or magic links

## Step 5: Start Your Application

```bash
npm run dev
```

The app will start at `http://localhost:3000`

## Step 6: Login

1. Navigate to `http://localhost:3000` (or `http://localhost:3000/en` for English, `http://localhost:3000/pt` for Portuguese)
2. You'll see the login page with the Fran Padel Project logo
3. Enter your test user credentials:
   - **Email:** The email you used when creating the user
   - **Password:** The password you set

### Login Methods Available

The app supports two login methods:

1. **Password Login** - Enter email and password directly
2. **OTP Login** - Enter email, receive OTP code via email (check Inbucket at `http://127.0.0.1:54324`)

## Troubleshooting

### Issue: "User not found" or "Invalid login credentials"

**Solutions:**

- Make sure the user exists in Supabase Auth (check Supabase Studio)
- Verify the email is confirmed (click "Confirm email" in Supabase Studio)
- Check that you're using the correct email/password
- Ensure environment variables are set correctly in `.env.local`

### Issue: "Supabase connection failed"

**Solutions:**

- Verify Supabase is running: `supabase status`
- Check that `NEXT_PUBLIC_SUPABASE_URL` points to `http://127.0.0.1:54321`
- Ensure Docker is running
- Restart Supabase: `supabase stop` then `supabase start`

### Issue: "OTP not received" or "Email does not appear in Inbucket"

**Common Causes:**

1. **User doesn't exist in Supabase Auth** - The OTP login has `shouldCreateUser: false`, meaning it only works for existing users
2. **Email wasn't actually sent** - Check browser console for errors
3. **Inbucket not capturing emails** - Verify Inbucket is running

**Solutions:**

1. **Verify the user exists:**

   - Open Supabase Studio: `http://127.0.0.1:54323`
   - Go to **Authentication** → **Users**
   - Check if the email address exists in the users list
   - If the user doesn't exist, create it first (see Step 3 above)

2. **Check Inbucket:**

   - Open Inbucket: `http://127.0.0.1:54324`
   - Make sure the page loads (if it doesn't, Inbucket might not be running)
   - Try refreshing after requesting an OTP
   - Check if emails are being captured for other email addresses

3. **Check browser console:**

   - Open browser DevTools (F12)
   - Go to Console tab
   - Try requesting an OTP and look for any error messages
   - Common errors:
     - "User not found" - User doesn't exist in Supabase Auth
     - "Signups not allowed for otp" - User doesn't exist and creation is disabled

4. **Verify Supabase is running:**

   ```bash
   supabase status
   ```

   Make sure Inbucket URL shows: `http://127.0.0.1:54324`

5. **Test with a known user:**

   - Create a test user in Supabase Studio first
   - Confirm the email in Supabase Studio
   - Then try requesting OTP for that user

6. **Check Supabase Auth logs:**
   - In Supabase Studio, go to **Logs** → **Auth Logs**
   - Look for any errors related to OTP sending

### Issue: Docker permission errors

**Solutions:**

- Make sure Docker Desktop is running
- Grant Docker permissions if needed
- Try restarting Docker Desktop

## Useful Commands

```bash
# Check Supabase status
supabase status

# View Supabase logs
supabase logs

# Stop Supabase
supabase stop

# Reset database (WARNING: This will delete all data)
supabase db reset

# Open Supabase Studio
supabase studio

# Get API keys
supabase status | grep -E "(API URL|anon key)"
```

## Additional Resources

- **Supabase Studio:** `http://127.0.0.1:54323` - Database and auth management UI
- **Inbucket (Email Testing):** `http://127.0.0.1:54324` - View test emails
- **API Docs:** Check Supabase Studio for API documentation

## Testing Scripts

The project includes test scripts you can use:

```bash
# Test invitation flow
npm run test:invitation

# Debug invitation flow
npm run debug:invitation
```

These scripts help verify that your local Supabase setup is working correctly.
