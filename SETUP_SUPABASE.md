# Supabase Connection Setup

## Quick Setup

1. **Get your database password**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project: `hkjdqiuvltlidwtbghtx`
   - Navigate to: **Settings** → **Database**
   - Find or reset your database password

2. **Get connection string**:
   - In the same Database settings page
   - Look for "Connection string" or "Connection pooling"
   - Copy the "URI" format connection string
   - It should look like: `postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

3. **Update your .env file**:
   ```env
   # Use the connection string from Supabase dashboard
   DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

4. **Run setup commands**:
   ```bash
   npm run db:generate
   npm run db:push
   npm run seed
   ```

## Connection String Format

Supabase provides two connection strings:

### 1. Connection Pooler (for application queries)
- Port: **6543**
- Use for: `DATABASE_URL`
- Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`

### 2. Direct Connection (for migrations)
- Port: **5432**
- Use for: `DIRECT_URL`
- Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

## Your Project Details

- **Project Reference**: `hkjdqiuvltlidwtbghtx`
- **Project URL**: `https://hkjdqiuvltlidwtbghtx.supabase.co`
- **ANON Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhramRxaXV2bHRsaWR3dGJnaHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzMxOTMsImV4cCI6MjA4MzI0OTE5M30.7MuPSF98TDHdC9LNOH5RJkqh1Hwxq74pjQFpWBZn2WY`

## Troubleshooting

### Connection Issues

1. **"Connection refused" or timeout**:
   - Verify your database password is correct
   - Check that your IP is allowed (Supabase allows all IPs by default)
   - Ensure you're using the correct region in the connection string

2. **"Authentication failed"**:
   - Double-check your database password
   - Try resetting the password in Supabase dashboard

3. **"Relation does not exist"**:
   - Run `npm run db:push` to create tables
   - Check that `DIRECT_URL` is set correctly for migrations

### Finding Your Region

The region is part of the connection string. Common regions:
- `us-east-1` (US East)
- `us-west-1` (US West)
- `eu-west-1` (Europe)
- `ap-southeast-1` (Asia Pacific)

To find your exact region:
1. Go to Supabase Dashboard → Settings → Database
2. Look at the connection string provided
3. The region is in the hostname: `aws-0-[REGION].pooler.supabase.com`

## Next Steps

After successful connection:
1. ✅ Database schema pushed to Supabase
2. ✅ Run seed script to create initial users
3. ✅ Start development server: `npm run dev`
4. ✅ Log in with: admin@example.com / admin123

## Security Notes

- Never commit your `.env` file to version control
- The ANON key is safe to use in client-side code
- Keep your database password secure
- Use connection pooling for production applications





