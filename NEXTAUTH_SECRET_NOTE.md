# NEXTAUTH_SECRET Configuration

## Important: Set NEXTAUTH_SECRET in Environment Variables

The `NEXTAUTH_SECRET` environment variable is **REQUIRED** for the application to work properly, especially in production.

## For Local Development (.env file)

Add this to your `.env` file:

```env
NEXTAUTH_SECRET=kF5gmShap5XJAmDbcgebsmZQYgfd6YI5JM2Pt3oajc8=
NEXTAUTH_URL=http://localhost:3000
```

## For Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Key**: `NEXTAUTH_SECRET`
   - **Value**: `kF5gmShap5XJAmDbcgebsmZQYgfd6YI5JM2Pt3oajc8=`
   - **Environment**: Production, Preview, Development
4. Also add:
   - **Key**: `NEXTAUTH_URL`
   - **Value**: `https://your-app-name.vercel.app` (your actual Vercel URL)
   - **Environment**: Production, Preview, Development
5. **Redeploy** your application

## Security Note

⚠️ **Never commit the `.env` file to git**. It's already in `.gitignore` for your protection.

The secret should be:
- At least 32 characters long
- Random and unpredictable
- Kept secure and private

## Verification

After setting the secret, restart your development server or redeploy in production. The NextAuth error should be resolved.
