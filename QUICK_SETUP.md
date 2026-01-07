# Quick Setup Guide - Fix Connection Issues

## Error: DIRECT_URL not found

The `.env` file is missing the `DIRECT_URL` variable. Here's how to fix it:

### Option 1: Add DIRECT_URL to .env (Recommended)

1. Open your `.env` file
2. Add this line (use the same connection string as DATABASE_URL but with port 5432):

```env
DIRECT_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

**Important**: Replace:
- `[YOUR-PASSWORD]` with your actual Supabase database password
- `[REGION]` with your region (e.g., `ap-southeast-1`, `us-east-1`, etc.)

### Option 2: Use Same Connection for Both (Quick Fix)

If you don't have the direct connection string, you can temporarily use the same connection string for both:

```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## Getting Your Connection String from Supabase

1. Go to: https://supabase.com/dashboard/project/hkjdqiuvltlidwtbghtx
2. Click **Settings** → **Database**
3. Scroll to **Connection string** section
4. Select **URI** format
5. Copy the connection string
6. It will look like:
   ```
   postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

## Complete .env File Template

```env
# Database - Supabase PostgreSQL
# Get your password from: Supabase Dashboard → Settings → Database
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-to-a-random-secret-in-production"

# Email Configuration (SMTP) - Optional
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Document Number Prefixes
QUOTATION_PREFIX="QUO"
PROFORMA_PREFIX="PI"
INVOICE_PREFIX="INV"
```

## After Updating .env

Run these commands:

```bash
npm run db:generate
npm run db:push
npm run seed
```

## Troubleshooting

### Error: "URL must start with postgresql://"
- Make sure your DATABASE_URL starts with `postgresql://` (not `postgres://` or anything else)
- Check for extra spaces or quotes in your .env file

### Error: "Authentication failed"
- Verify your database password is correct
- Try resetting the password in Supabase dashboard

### Error: "Connection refused"
- Check that your IP is allowed (Supabase allows all by default)
- Verify the region in your connection string matches your Supabase project region





