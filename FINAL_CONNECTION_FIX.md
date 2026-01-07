# Final Connection Fix Guide

## Current Problem

Your connection is failing with:
```
Can't reach database server at `db.hkjdqiuvltlidwtbghtx.supabase.co:5432`
```

## Root Causes & Solutions

### 1. Database Might Be Paused (Most Common)

**Check:**
1. Go to: https://supabase.com/dashboard/project/hkjdqiuvltlidwtbghtx
2. Look for a **"Restore"** or **"Resume"** button
3. Free tier databases auto-pause after inactivity

**Fix:**
- Click **"Restore"** if you see it
- Wait 1-2 minutes for database to wake up
- Try connecting again

### 2. Wrong Connection String Format

**Current (Direct Connection - May Be Blocked):**
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.hkjdqiuvltlidwtbghtx.supabase.co:5432/postgres"
```

**Should Be (Connection Pooler - Recommended):**
```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 3. Get Correct Connection String

**Step-by-Step:**

1. **Open Supabase Dashboard:**
   - https://supabase.com/dashboard/project/hkjdqiuvltlidwtbghtx

2. **Navigate to Database Settings:**
   - Click **Settings** (gear icon)
   - Click **Database** (under Project Settings)

3. **Get Connection String:**
   - Scroll to **"Connection string"** section
   - You'll see tabs: **URI**, **JDBC**, etc.
   - Click **URI** tab
   - **IMPORTANT**: Look for **"Connection Pooling"** vs **"Direct connection"**
   - Select **"Connection Pooling"** tab
   - Copy the connection string

4. **The connection string should look like:**
   ```
   postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

5. **Update your .env file:**
   - Replace `DATABASE_URL` with the copied string
   - Add `?pgbouncer=true` at the end if not present
   - Make sure password is replaced (no `[YOUR-PASSWORD]` placeholder)

### 4. Verify Password

If connection still fails:

1. **Reset Database Password:**
   - Supabase Dashboard → Settings → Database
   - Find **"Database password"** section
   - Click **"Reset database password"**
   - Copy the new password
   - Update your `.env` file

### 5. Check Network Restrictions

1. **Supabase Dashboard → Settings → Database**
2. Scroll to **"Network Restrictions"**
3. Make sure it's set to **"Allow all"** or your IP is whitelisted

## Complete .env File Example

```env
# Connection Pooler (Recommended)
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:your_actual_password_here@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-to-a-random-secret-in-production"
```

## After Fixing

1. **Save your .env file**
2. **Run:**
   ```bash
   npm run db:push
   npm run seed
   ```

## Quick Checklist

- [ ] Database is not paused (check Supabase dashboard)
- [ ] Using connection pooler format (port 6543, not 5432)
- [ ] Password is replaced (no `[YOUR-PASSWORD]` placeholder)
- [ ] Connection string has `?pgbouncer=true` at the end
- [ ] User is `postgres.hkjdqiuvltlidwtbghtx` (not just `postgres`)
- [ ] Network restrictions allow your IP

## Still Not Working?

1. **Try resetting database password** in Supabase
2. **Get fresh connection string** from Supabase dashboard
3. **Check Supabase status**: https://status.supabase.com/
4. **Verify project is active** in Supabase dashboard



