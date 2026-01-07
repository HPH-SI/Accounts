# Environment Variables Setup - CRITICAL

## Current Errors

1. ❌ `DIRECT_URL` not found (now optional - fixed in schema)
2. ❌ `DATABASE_URL` must start with `postgresql://` (your .env file needs fixing)

## Required: Fix Your .env File

Your `.env` file **MUST** have a properly formatted `DATABASE_URL`. 

### Step 1: Open your .env file

### Step 2: Add/Update DATABASE_URL

The `DATABASE_URL` **MUST** start with `postgresql://` and look like this:

```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### Step 3: Get Your Values from Supabase

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/hkjdqiuvltlidwtbghtx
2. **Click**: Settings → Database
3. **Find**: "Connection string" section
4. **Select**: "URI" format
5. **Copy**: The connection string

It should look like:
```
postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### Step 4: Update Your .env File

Replace `[YOUR-PASSWORD]` with your actual database password.

**Example** (if your password is `MySecurePass123` and region is `ap-southeast-1`):

```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:MySecurePass123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### Step 5: Optional - Add DIRECT_URL (Recommended)

For better migration performance, also add:

```env
DIRECT_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:MySecurePass123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

**Note**: Only the port changes (6543 → 5432) and remove `?pgbouncer=true`

## Complete .env File Template

```env
# Database - Supabase PostgreSQL
# IMPORTANT: Replace YOUR_PASSWORD and REGION with actual values
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-to-a-random-secret-in-production"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Document Prefixes
QUOTATION_PREFIX="QUO"
PROFORMA_PREFIX="PI"
INVOICE_PREFIX="INV"
```

## Common Mistakes to Avoid

❌ **Wrong**: `DATABASE_URL="file:./dev.db"` (this is SQLite, not PostgreSQL)
❌ **Wrong**: `DATABASE_URL="postgres://..."` (should be `postgresql://`)
❌ **Wrong**: Missing quotes around the URL
❌ **Wrong**: Extra spaces or line breaks in the URL

✅ **Correct**: `DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"`

## After Fixing .env

Run these commands:

```bash
npm run db:generate
npm run db:push
npm run seed
```

## Still Having Issues?

1. **Check your .env file exists**: `ls -la .env`
2. **Verify DATABASE_URL format**: Make sure it starts with `postgresql://`
3. **Test connection**: Try connecting with a PostgreSQL client to verify credentials
4. **Check Supabase Dashboard**: Ensure your database is active and accessible




