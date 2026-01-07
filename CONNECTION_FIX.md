# Connection Fix - Can't Reach Database Server

## Current Error
```
Can't reach database server at `db.hkjdqiuvltlidwtbghtx.supabase.co:5432`
```

## Possible Solutions

### Solution 1: Use Connection Pooler (Recommended)

Your current connection uses direct connection format. Try the **connection pooler** instead:

**Change FROM:**
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.hkjdqiuvltlidwtbghtx.supabase.co:5432/postgres"
```

**Change TO:**
```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**To get the correct connection string:**
1. Go to: https://supabase.com/dashboard/project/hkjdqiuvltlidwtbghtx
2. Settings → Database
3. Connection string section
4. Select **URI** tab
5. Select **Connection Pooling** (not Direct connection)
6. Copy the connection string

### Solution 2: Check Database Status

The database might be **paused** (free tier auto-pauses after inactivity):

1. Go to Supabase Dashboard
2. Check if you see a "Restore" or "Resume" button
3. If paused, click to restore the database
4. Wait a few minutes for it to wake up

### Solution 3: Verify Password

1. Go to Supabase Dashboard → Settings → Database
2. **Reset** your database password
3. Copy the new password
4. Update your `.env` file with the new password

### Solution 4: Check Network Restrictions

1. Go to Supabase Dashboard → Settings → Database
2. Check **Network Restrictions** section
3. Make sure your IP is allowed (or set to allow all)
4. If restricted, add your IP or set to allow all IPs

### Solution 5: Try Different Connection Format

If direct connection doesn't work, the connection pooler usually works better:

**Connection Pooler (Port 6543):**
```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Direct Connection (Port 5432):**
```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[PASSWORD]@db.hkjdqiuvltlidwtbghtx.supabase.co:5432/postgres"
```

## Quick Test

After updating your `.env`, test the connection:

```bash
npm run db:push
```

## Most Common Issues

1. **Database is paused** → Restore it in Supabase dashboard
2. **Wrong password** → Reset password in Supabase dashboard
3. **Using direct connection** → Switch to connection pooler (port 6543)
4. **Network restrictions** → Check IP allowlist in Supabase settings

## Recommended Action

1. **First**: Check if database is paused and restore if needed
2. **Second**: Get connection pooler string from Supabase dashboard
3. **Third**: Update `.env` with the pooler connection string
4. **Fourth**: Run `npm run db:push` again



