# Quick Fix: NEXTAUTH_SECRET Error

## The Problem

You're seeing this error in production:
```
[next-auth][error][NO_SECRET] Please define a `secret` in production.
```

This happens because `NEXTAUTH_SECRET` is not set in your Vercel environment variables.

## Quick Solution

### Step 1: Generate a Secret

Run this command to generate a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or use OpenSSL:
```bash
openssl rand -base64 32
```

**Example output:**
```
ROY+qqXCfmjfOe93fNspTlMt/Dxmi9fqZT/CRWfZbrY=
```

### Step 2: Add to Vercel

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `NEXTAUTH_SECRET`
   - **Value**: (paste the secret you generated)
   - **Environment**: Select `Production`, `Preview`, and `Development`
6. Click **Save**

### Step 3: Set NEXTAUTH_URL

Also add:
- **Key**: `NEXTAUTH_URL`
- **Value**: `https://your-app-name.vercel.app` (replace with your actual Vercel URL)
- **Environment**: Select `Production`, `Preview`, and `Development`

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **⋯** on the latest deployment
3. Click **Redeploy**

## Verify It's Fixed

After redeploying, the error should be gone. You can verify by:
1. Checking the deployment logs (should show no NextAuth errors)
2. Trying to log in to your application

## All Required Environment Variables

Make sure you have these set in Vercel:

✅ **NEXTAUTH_SECRET** (REQUIRED - you're missing this!)
✅ **NEXTAUTH_URL** (REQUIRED)
✅ **DATABASE_URL** (REQUIRED)
✅ **SMTP_HOST**, **SMTP_PORT**, **SMTP_USER**, **SMTP_PASSWORD**, **SMTP_FROM** (for email)
✅ **QUOTATION_PREFIX**, **PROFORMA_PREFIX**, **INVOICE_PREFIX** (optional)

See `VERCEL_DEPLOYMENT.md` for complete setup instructions.
