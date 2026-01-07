# ⚠️ URGENT: Fix Your .env File

## The Problem

Your `.env` file has:
```env
DATABASE_URL="file:./dev.db"
```

This is **SQLite format**, but you need **PostgreSQL format** for Supabase!

## The Fix

**Open your `.env` file and change this line:**

### FROM:
```env
DATABASE_URL="file:./dev.db"
```

### TO:
```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## How to Get the Correct Connection String

### Method 1: From Supabase Dashboard (Easiest)

1. Go to: **https://supabase.com/dashboard/project/hkjdqiuvltlidwtbghtx**
2. Click: **Settings** → **Database**
3. Scroll to: **Connection string** section
4. Select: **URI** format
5. Copy the connection string
6. It will look like:
   ```
   postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
7. Add `?pgbouncer=true` at the end if not present

### Method 2: Manual Format

If you know your password and region:

```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Replace:**
- `YOUR_PASSWORD` → Your Supabase database password
- `REGION` → Your region (e.g., `ap-southeast-1`, `us-east-1`, `eu-west-1`)

## Example

If your password is `MyPass123` and region is `ap-southeast-1`:

```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:MyPass123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## After Updating

1. Save the `.env` file
2. Run:
   ```bash
   npm run db:push
   npm run seed
   ```

## Quick Checklist

- [ ] Opened `.env` file
- [ ] Found `DATABASE_URL="file:./dev.db"`
- [ ] Replaced with Supabase PostgreSQL connection string
- [ ] Replaced `[YOUR-PASSWORD]` with actual password
- [ ] Replaced `[REGION]` with actual region
- [ ] Saved the file
- [ ] Ran `npm run db:push`

## Still Need Help?

1. **Get your password**: Supabase Dashboard → Settings → Database → Database password
2. **Get your region**: Look at the connection string in Supabase dashboard
3. **Verify format**: Make sure it starts with `postgresql://` (not `file:` or `postgres://`)




