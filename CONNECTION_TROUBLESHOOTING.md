# Connection Troubleshooting Guide

## Current Error

```
Can't reach database server at `db.hkjdqiuvltlidwtbghtx.supabase.co:5432`
```

## Possible Causes & Solutions

### 1. Password Not Replaced ❌

**Check**: Does your `.env` file still have `[YOUR-PASSWORD]`?

**Fix**: Replace it with your actual Supabase database password.

### 2. Wrong Connection String Format ❌

Your current connection string uses:
```
db.hkjdqiuvltlidwtbghtx.supabase.co:5432
```

**Try using the connection pooler instead:**
```
aws-0-[REGION].pooler.supabase.com:6543
```

### 3. Network/Firewall Issues 🔒

**Check**:
- Is your internet connection working?
- Are you behind a corporate firewall?
- Try accessing Supabase dashboard to verify project is active

### 4. Database Not Accessible 🌐

**Check Supabase Dashboard**:
1. Go to: https://supabase.com/dashboard/project/hkjdqiuvltlidwtbghtx
2. Check if the project is **paused** (free tier projects pause after inactivity)
3. If paused, click **Restore** to wake it up

## Recommended Connection String Format

Use the **Connection Pooling** format from Supabase:

```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:YOUR_ACTUAL_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**To get this:**
1. Supabase Dashboard → Settings → Database
2. Connection string section
3. Select **URI** tab
4. Select **Connection Pooling** (not Direct connection)
5. Copy the connection string

## Quick Test

Test your connection string manually:

```bash
# Test if you can reach Supabase
ping aws-0-ap-southeast-1.pooler.supabase.com
```

## Alternative: Use Direct Connection

If pooler doesn't work, try direct connection:

```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:YOUR_PASSWORD@db.hkjdqiuvltlidwtbghtx.supabase.co:5432/postgres"
```

**Note**: Direct connection (port 5432) may have IP restrictions. Check Supabase → Settings → Database → Network Restrictions.

## Verify Your Setup

1. ✅ Password is replaced (no `[YOUR-PASSWORD]`)
2. ✅ Connection string starts with `postgresql://`
3. ✅ Project is active in Supabase dashboard
4. ✅ No network restrictions blocking your IP

## Still Not Working?

1. **Reset database password** in Supabase dashboard
2. **Get fresh connection string** from Supabase
3. **Check Supabase status page** for outages
4. **Try connection pooler** instead of direct connection




