# Forgot Password Flow Guide

This guide explains how to use and test the forgot password functionality in your app.

## 🔄 Complete Password Reset Flow

Your app now supports two different password reset scenarios:

### 1. **Invitation Flow** (New Users)

- Admin invites user via Supabase Studio
- User receives invitation email
- User clicks link → `/auth/invite` → `/auth/reset-password`
- User sets initial password

### 2. **Forgot Password Flow** (Existing Users)

- User clicks "Forgot password?" on login form
- User enters email → `/auth/forgot-password`
- User receives password reset email
- User clicks link → `/auth/reset-password`
- User sets new password

## 🚀 How to Test the Forgot Password Flow

### **Step 1: Create a Test User**

1. Go to Supabase Studio: `http://localhost:54323`
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"** (not "Invite User")
4. Enter email and password
5. Click **"Create User"**

### **Step 2: Test Forgot Password**

1. Go to your app: `http://localhost:3000`
2. Click **"Forgot password?"** link on the login form
3. Enter the email of the user you just created
4. Click **"Send Reset Link"**

### **Step 3: Check Email and Reset**

1. Go to Inbucket: `http://localhost:54324`
2. Find the password reset email
3. Click the reset link in the email
4. You'll be redirected to `/auth/reset-password`
5. Enter a new password and confirm it
6. Click **"Update Password"**
7. You'll be redirected to the dashboard

## 🔧 Technical Implementation

### **Files Created/Modified:**

1. **`/auth/forgot-password/page.tsx`** - Forgot password page
2. **`/components/ForgotPasswordForm.tsx`** - Forgot password form component
3. **`/components/LoginForm.tsx`** - Updated to link to forgot password
4. **`/middleware.ts`** - Added forgot-password to public routes
5. **`supabase/config.toml`** - Added forgot-password to redirect URLs

### **Flow Architecture:**

```
Login Form → "Forgot password?" → /auth/forgot-password
    ↓
User enters email → resetPassword() → Supabase sends email
    ↓
User clicks email link → /auth/reset-password (with tokens)
    ↓
User sets new password → updatePassword() → Dashboard
```

## 🎯 Key Features

### **ForgotPasswordForm Component:**

- ✅ Email validation
- ✅ Loading states with spinner
- ✅ Error handling
- ✅ Success confirmation
- ✅ Back to login navigation
- ✅ Send another email option

### **User Experience:**

- ✅ Clear instructions
- ✅ Visual feedback (loading, success, error states)
- ✅ Helpful error messages
- ✅ Easy navigation back to login
- ✅ Email confirmation with instructions

### **Security:**

- ✅ Uses Supabase's secure password reset flow
- ✅ Tokens expire after 1 hour
- ✅ Proper validation and error handling
- ✅ No sensitive data exposed in URLs

## 🧪 Testing Scenarios

### **Scenario 1: Valid Email**

1. Enter valid email address
2. Should show success message
3. Check Inbucket for reset email
4. Click link and set new password

### **Scenario 2: Invalid Email**

1. Enter invalid email (no @ symbol)
2. Should show validation error
3. Should not send email

### **Scenario 3: Non-existent Email**

1. Enter email that doesn't exist in system
2. Supabase will still show success (security feature)
3. No email will be sent (check Inbucket)

### **Scenario 4: Expired Token**

1. Wait more than 1 hour after receiving email
2. Click the reset link
3. Should show "Invalid Reset Link" error

## 🔍 Debugging

### **Common Issues:**

1. **Email not received:**

   - Check Inbucket at `http://localhost:54324`
   - Verify Supabase is running: `supabase status`
   - Check Supabase logs: `supabase logs`

2. **Invalid reset link:**

   - Check that tokens are in URL
   - Verify redirect URLs in config.toml
   - Check browser console for errors

3. **Form not submitting:**
   - Check email validation
   - Verify network connection
   - Check browser console for errors

### **Debug Commands:**

```bash
# Test the connection
npm run debug:invitation

# Check Supabase status
supabase status

# View logs
supabase logs
```

## 📋 Quick Test Checklist

- [ ] Supabase running on `http://localhost:54321`
- [ ] Next.js app running on `http://localhost:3000`
- [ ] Can access login form
- [ ] "Forgot password?" link works
- [ ] Can enter email and submit form
- [ ] Success message appears
- [ ] Email received in Inbucket
- [ ] Can click reset link
- [ ] Redirected to reset password page
- [ ] Can set new password
- [ ] Redirected to dashboard after password update

## 🎨 UI/UX Features

- **Consistent Design**: Matches your app's design system
- **Responsive**: Works on all screen sizes
- **Accessible**: Proper labels and keyboard navigation
- **Loading States**: Clear feedback during operations
- **Error Handling**: User-friendly error messages
- **Success States**: Clear confirmation of actions

The forgot password flow is now fully integrated into your app and provides a seamless experience for users who need to reset their passwords!
