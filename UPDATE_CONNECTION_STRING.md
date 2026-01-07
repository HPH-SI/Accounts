# Update Connection String to Use Connection Pooler

## Current Issue

Your connection string uses the **direct connection** format:
```
db.hkjdqiuvltlidwtbghtx.supabase.co:5432
```

This may be blocked or have IP restrictions. Use the **connection pooler** instead.

## Fix: Update Your .env File

### Step 1: Get Connection Pooler String from Supabase

1. Go to: **https://supabase.com/dashboard/project/hkjdqiuvltlidwtbghtx**
2. Click: **Settings** → **Database**
3. Scroll to: **Connection string** section
4. Select: **URI** tab
5. **IMPORTANT**: Select **"Connection Pooling"** tab (not "Direct connection")
6. Copy the connection string

It should look like:
```
postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### Step 2: Update Your .env File

Replace your current `DATABASE_URL` with the connection pooler string:

**FROM (Direct Connection):**
```env
DATABASE_URL="postgresql://postgres:hphaccounts@db.hkjdqiuvltlidwtbghtx.supabase.co:5432/postgres"
```

**TO (Connection Pooler):**
```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:hphaccounts@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Key differences:**
- User: `postgres.hkjdqiuvltlidwtbghtx` (not just `postgres`)
- Host: `aws-0-[REGION].pooler.supabase.com` (not `db.hkjdqiuvltlidwtbghtx.supabase.co`)
- Port: `6543` (not `5432`)
- Add: `?pgbouncer=true` at the end

### Step 3: Find Your Region

The region is in the connection string from Supabase. Common regions:
- `ap-southeast-1` (Asia Pacific)
- `us-east-1` (US East)
- `eu-west-1` (Europe)

**To find your exact region:**
- Look at the connection string from Supabase dashboard
- It will be in the format: `aws-0-[REGION].pooler.supabase.com`

### Step 4: Test Connection

After updating, run:
```bash
npm run db:push
```

## Alternative: If Connection Pooler Doesn't Work

If you must use direct connection, check:

1. **Database Status**: Make sure database is not paused
2. **Network Restrictions**: Supabase → Settings → Database → Network Restrictions
3. **Password**: Verify password is correct (try resetting it)

## Quick Reference

**Connection Pooler (Recommended):**
```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Direct Connection (Alternative):**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.hkjdqiuvltlidwtbghtx.supabase.co:5432/postgres"
```



