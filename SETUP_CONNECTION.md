# Setup Connection String - Database is Accessible!

## Good News ✅

The database is working and accessible! The issue is your connection string format.

## The Fix

Your `.env` file needs to use the **Connection Pooler** format instead of direct connection.

### Current Format (Not Working):
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.hkjdqiuvltlidwtbghtx.supabase.co:5432/postgres"
```

### Correct Format (Connection Pooler):
```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## Get Your Connection String

### Method 1: From Supabase Dashboard (Easiest)

1. **Go to**: https://supabase.com/dashboard/project/hkjdqiuvltlidwtbghtx
2. **Click**: Settings → Database
3. **Scroll to**: "Connection string" section
4. **Select**: "URI" tab
5. **IMPORTANT**: Click **"Connection Pooling"** tab (not "Direct connection")
6. **Copy** the connection string
7. **Paste** it into your `.env` file

The connection string will look like:
```
postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### Method 2: Manual Construction

If you know your password and region:

```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Key differences from direct connection:**
- User: `postgres.hkjdqiuvltlidwtbghtx` (includes project ref)
- Host: `aws-0-[REGION].pooler.supabase.com` (pooler, not db)
- Port: `6543` (pooler port, not 5432)
- Add: `?pgbouncer=true` parameter

## Find Your Region

The region is in the connection string from Supabase. Common ones:
- `ap-southeast-1` (Asia Pacific - Singapore)
- `us-east-1` (US East)
- `eu-west-1` (Europe)

**To find it**: Look at the connection string from Supabase dashboard - it will show the region.

## Example

If your password is `hphaccounts` and region is `ap-southeast-1`:

```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:hphaccounts@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## After Updating

1. **Save** your `.env` file
2. **Run**:
   ```bash
   npm run db:push
   npm run seed
   ```

## Why Connection Pooler?

- ✅ More reliable for external connections
- ✅ Better performance
- ✅ Handles connection limits better
- ✅ Recommended by Supabase for applications

The direct connection (port 5432) may have IP restrictions or be blocked by firewalls. The connection pooler (port 6543) is designed for application connections.



