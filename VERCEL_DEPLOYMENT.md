# Vercel Deployment Guide

## Required Environment Variables

To deploy this application to Vercel, you **must** set the following environment variables in your Vercel project settings:

### 1. Database Configuration

```
DATABASE_URL=postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Optional** (for migrations):
```
DIRECT_URL=postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### 2. NextAuth Configuration (REQUIRED)

**⚠️ CRITICAL: You MUST set `NEXTAUTH_SECRET` for production!**

```
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
```

#### How to Generate a Secure Secret

You can generate a secure random secret using one of these methods:

**Option 1: Using OpenSSL (recommended)**
```bash
openssl rand -base64 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Online Generator**
Visit: https://generate-secret.vercel.app/32

### 3. Supabase API Keys (Optional)

```
NEXT_PUBLIC_SUPABASE_URL=https://hkjdqiuvltlidwtbghtx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhramRxaXV2bHRsaWR3dGJnaHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzMxOTMsImV4cCI6MjA4MzI0OTE5M30.7MuPSF98TDHdC9LNOH5RJkqh1Hwxq74pjQFpWBZn2WY
```

### 4. Email Configuration (SMTP)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

### 5. Document Number Prefixes (Optional)

```
QUOTATION_PREFIX=QUO
PROFORMA_PREFIX=PI
INVOICE_PREFIX=INV
```

## Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: The variable name (e.g., `NEXTAUTH_SECRET`)
   - **Value**: The variable value
   - **Environment**: Select `Production`, `Preview`, and/or `Development` as needed
4. Click **Save**
5. **Redeploy** your application for changes to take effect

## Important Notes

- **NEXTAUTH_SECRET**: This is **REQUIRED** in production. Without it, authentication will fail.
- **NEXTAUTH_URL**: Should match your production domain (e.g., `https://your-app.vercel.app`)
- **DATABASE_URL**: Use the connection pooling URL (port 6543) for better performance
- Never commit `.env` files to git - they are already in `.gitignore`

## After Setting Environment Variables

1. Go to your Vercel project
2. Click **Deployments**
3. Click the **⋯** menu on the latest deployment
4. Select **Redeploy** to apply the new environment variables

## Troubleshooting

### Error: `[NO_SECRET] Please define a secret in production`

**Solution**: Make sure `NEXTAUTH_SECRET` is set in Vercel environment variables and you've redeployed.

### Error: Database connection issues

**Solution**: 
- Verify `DATABASE_URL` is correct
- Check that your Supabase database allows connections from Vercel IPs
- Ensure you're using the connection pooling URL (port 6543)

### Error: Authentication not working

**Solution**:
- Verify `NEXTAUTH_SECRET` is set
- Check that `NEXTAUTH_URL` matches your production domain exactly
- Clear browser cookies and try again
