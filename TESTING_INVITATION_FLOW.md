# Testing User Invitation Flow with Local Supabase

This guide will help you test the complete user invitation and password reset flow using your local Supabase setup.

## 🚀 Prerequisites

1. **Supabase CLI installed**: Make sure you have the Supabase CLI installed
2. **Local Supabase running**: Your local Supabase instance should be running
3. **Next.js app running**: Your Next.js application should be running on `http://localhost:3000`

## 📋 Step-by-Step Testing Process

### 1. Start Local Supabase

```bash
# In your project root directory
supabase start
```

This will start:

- **API**: `http://localhost:54321`
- **Studio**: `http://localhost:54323` (Supabase Dashboard)
- **Inbucket**: `http://localhost:54324` (Email testing interface)

### 2. Start Your Next.js App

```bash
# In your project root directory
npm run dev
```

Your app will be available at `http://localhost:3000`

### 3. Configure Environment Variables

Make sure your `.env.local` file has the correct local Supabase URLs:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

You can get these values by running:

```bash
supabase status
```

### 4. Test the Invitation Flow

#### Option A: Using Supabase Studio (Recommended)

1. **Open Supabase Studio**: Go to `http://localhost:54323`
2. **Navigate to Authentication**: Click on "Authentication" in the sidebar
3. **Go to Users**: Click on "Users" tab
4. **Invite a User**:
   - Click "Invite User" button
   - Enter an email address (e.g., `test@example.com`)
   - Click "Send Invitation"

#### Option B: Using the Test Page

1. **Open Test Page**: Go to `http://localhost:3000/test-invitation`
2. **Enter Email**: Enter the email address you want to test with
3. **Send Reset Email**: Click "Send Reset Email"

### 5. Check the Email

1. **Open Inbucket**: Go to `http://localhost:54324`
2. **Find Your Email**: Look for the invitation/reset email
3. **Click the Link**: Click on the reset link in the email

### 6. Complete Password Setup

1. **Password Reset Page**: You should be redirected to `/auth/reset-password`
2. **Set Password**: Enter a new password and confirm it
3. **Submit**: Click "Update Password"
4. **Success**: You should see a success message and be redirected to `/dashboard`

## 🔧 Troubleshooting

### Common Issues

#### 1. "Invalid Reset Link" Error

**Cause**: The reset token is missing or invalid
**Solution**:

- Check that the URL contains `access_token` and `refresh_token` parameters
- Make sure you're using the correct local Supabase URL

#### 2. Redirect URL Not Allowed

**Cause**: The redirect URL isn't in the allowed list
**Solution**:

- Check your `supabase/config.toml` file
- Ensure `http://localhost:3000/auth/reset-password` is in `additional_redirect_urls`

#### 3. Email Not Received

**Cause**: Email service not configured or Inbucket not running
**Solution**:

- Check that Inbucket is running on `http://localhost:54324`
- Verify email configuration in `supabase/config.toml`

#### 4. CORS Issues

**Cause**: Cross-origin requests blocked
**Solution**:

- Make sure your Next.js app is running on `http://localhost:3000`
- Check that Supabase is running on `http://localhost:54321`

### Debug Steps

1. **Check Supabase Status**:

   ```bash
   supabase status
   ```

2. **Check Logs**:

   ```bash
   supabase logs
   ```

3. **Verify Environment Variables**:

   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

4. **Test API Connection**:
   Visit `http://localhost:3000/test-invitation` and try sending a reset email

## 🧪 Testing Scenarios

### Scenario 1: New User Invitation

1. Invite a completely new user via Supabase Studio
2. Check email in Inbucket
3. Click invitation link
4. Set password
5. Verify user can log in

### Scenario 2: Password Reset for Existing User

1. Use the test page to send a reset email
2. Check email in Inbucket
3. Click reset link
4. Set new password
5. Verify user can log in with new password

### Scenario 3: Invalid Token Handling

1. Try to access `/auth/reset-password` without tokens
2. Verify error message is shown
3. Test with expired tokens

## 📊 Expected Results

### Successful Flow

- ✅ User receives invitation email
- ✅ Email contains valid reset link
- ✅ Clicking link redirects to password reset page
- ✅ Password can be set successfully
- ✅ User is redirected to dashboard
- ✅ User can log in with new password

### Error Handling

- ✅ Invalid tokens show appropriate error
- ✅ Missing tokens show error message
- ✅ Password validation works correctly
- ✅ Network errors are handled gracefully

## 🔄 Reset for New Tests

To reset your local database for fresh testing:

```bash
# Stop Supabase
supabase stop

# Start fresh
supabase start

# Run migrations (if needed)
supabase db reset
```

## 📝 Notes

- **Inbucket**: All emails are captured locally and never sent to real email addresses
- **Tokens**: Reset tokens expire after 1 hour (configurable in `config.toml`)
- **Development**: This setup is perfect for development and testing
- **Production**: Remember to update URLs and configurations for production deployment

## 🎯 Quick Test Checklist

- [ ] Supabase running on `http://localhost:54321`
- [ ] Next.js app running on `http://localhost:3000`
- [ ] Inbucket accessible at `http://localhost:54324`
- [ ] Supabase Studio accessible at `http://localhost:54323`
- [ ] Environment variables configured correctly
- [ ] Can send invitation email
- [ ] Can receive email in Inbucket
- [ ] Can click reset link
- [ ] Can set new password
- [ ] Can log in with new password
