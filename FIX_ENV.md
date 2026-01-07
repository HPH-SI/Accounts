# Fix .env File - Missing DIRECT_URL

## The Problem

Your `.env` file is missing the `DIRECT_URL` variable, which is required for Prisma migrations with Supabase.

## Quick Fix

**Add this line to your `.env` file:**

```env
DIRECT_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

## How to Get the Correct Values

### Step 1: Get Your Database Password
1. Go to: https://supabase.com/dashboard/project/hkjdqiuvltlidwtbghtx
2. Click **Settings** → **Database**
3. Find your database password (or reset it if needed)

### Step 2: Get Your Region
Look at your existing `DATABASE_URL` in `.env` - the region is in the hostname:
- Example: `aws-0-ap-southeast-1.pooler.supabase.com` → region is `ap-southeast-1`
- Common regions: `us-east-1`, `us-west-1`, `eu-west-1`, `ap-southeast-1`

### Step 3: Update Your .env File

Your `.env` should have BOTH lines:

```env
# Connection Pooler (for app queries) - Port 6543
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (for migrations) - Port 5432
DIRECT_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

**Replace:**
- `[YOUR-PASSWORD]` with your actual password
- `[REGION]` with your region (e.g., `ap-southeast-1`)

## Example (with placeholder values)

```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:MyPassword123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:MyPassword123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

## After Updating

Run:
```bash
npm run db:push
npm run seed
```

## Alternative: Get Connection String from Supabase Dashboard

1. Go to Supabase Dashboard → Settings → Database
2. Scroll to **Connection string** section
3. Select **URI** format
4. Copy both:
   - **Connection Pooling** (for DATABASE_URL) - port 6543
   - **Direct connection** (for DIRECT_URL) - port 5432





