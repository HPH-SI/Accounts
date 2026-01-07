# How to Get Your Supabase Connection String

## Step-by-Step Instructions

### Step 1: Get Your Database Password

1. Go to: **https://supabase.com/dashboard/project/hkjdqiuvltlidwtbghtx**
2. Click: **Settings** (gear icon in left sidebar)
3. Click: **Database** (under Project Settings)
4. Scroll to: **Database password** section
5. Either:
   - **View** your existing password (if you remember setting it)
   - **Reset** your password (click "Reset database password")

### Step 2: Get Your Connection String

In the same **Settings → Database** page:

1. Scroll to: **Connection string** section
2. You'll see tabs: **URI**, **JDBC**, **Golang**, etc.
3. Click: **URI** tab
4. You'll see something like:
   ```
   postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
5. **Copy this entire string**

### Step 3: Update Your .env File

1. Open your `.env` file
2. Find: `DATABASE_URL="file:./dev.db"`
3. Replace with the connection string you copied
4. Add `?pgbouncer=true` at the end if it's not there

**Example of what it should look like:**
```env
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:your_actual_password_here@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## Important Notes

- **Replace `[YOUR-PASSWORD]`** with your actual database password
- The **region** (e.g., `ap-southeast-1`) is already in the connection string
- Make sure to keep the **quotes** around the connection string
- The connection string should start with `postgresql://` (not `file:`)

## Quick Test

After updating, you can test if it works:

```bash
npm run db:push
```

If you see "Your database is now in sync", it's working! ✅

## Troubleshooting

**If you get "authentication failed":**
- Double-check your password is correct
- Make sure there are no extra spaces in the connection string
- Try resetting your database password in Supabase

**If you get "connection refused":**
- Check that your IP is allowed (Supabase allows all by default)
- Verify the region in the connection string matches your project




