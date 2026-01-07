# Supabase Setup Instructions

## Database Connection

Your Supabase project is configured with:
- **Project URL**: https://hkjdqiuvltlidwtbghtx.supabase.co
- **ANON Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhramRxaXV2bHRsaWR3dGJnaHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzMxOTMsImV4cCI6MjA4MzI0OTE5M30.7MuPSF98TDHdC9LNOH5RJkqh1Hwxq74pjQFpWBZn2WY

## Environment Variables

Add these to your `.env` file:

```env
# Supabase Database Connection
DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Or use connection pooling:
# DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
# DIRECT_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Supabase API (if needed for future features)
NEXT_PUBLIC_SUPABASE_URL="https://hkjdqiuvltlidwtbghtx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhramRxaXV2bHRsaWR3dGJnaHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzMxOTMsImV4cCI6MjA4MzI0OTE5M30.7MuPSF98TDHdC9LNOH5RJkqh1Hwxq74pjQFpWBZn2WY"
```

## Getting Your Database Password

1. Go to your Supabase project dashboard
2. Navigate to Settings → Database
3. Find your database password (or reset it if needed)
4. Replace `[YOUR-PASSWORD]` in the connection strings above

## Setup Steps

1. **Update .env file** with the connection strings above (replace [YOUR-PASSWORD])

2. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

3. **Push schema to Supabase**:
   ```bash
   npm run db:push
   ```

4. **Seed initial data** (optional):
   ```bash
   npm run seed
   ```

## Connection String Format

The connection string format for Supabase is:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

For direct connection (used by Prisma migrations):
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

## Notes

- Use the **pooler** connection (port 6543) for `DATABASE_URL` (application queries)
- Use the **direct** connection (port 5432) for `DIRECT_URL` (migrations and schema operations)
- The project reference is: `hkjdqiuvltlidwtbghtx`
- Region appears to be: `ap-southeast-1`

## Troubleshooting

If you encounter connection issues:
1. Verify your database password is correct
2. Check that your IP is allowed in Supabase (Settings → Database → Connection Pooling)
3. Ensure you're using the correct region in the connection string
4. Try using the direct connection string for both DATABASE_URL and DIRECT_URL temporarily





