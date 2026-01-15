# Upgrade Notes - Next.js 14.2.15

## Changes Made

### 1. Fixed Email Body Bug
**Issue:** The email body fallback `options.body || options.subject` would use the subject as the HTML body when body was an empty string (falsy).

**Fix:** Updated `lib/email.ts` to properly handle empty strings by checking if body exists and has content. If body is empty or whitespace, provide a sensible default HTML body instead of using the subject.

### 2. Updated Next.js and Dependencies
**Previous Version:** Next.js 14.0.4  
**New Version:** Next.js 14.2.15

**Updated Dependencies:**
- `next`: 14.0.4 → 14.2.15
- `react`: 18.2.0 → 18.3.1
- `react-dom`: 18.2.0 → 18.3.1
- `eslint-config-next`: 14.0.4 → 14.2.15
- `typescript`: 5.3.3 → 5.5.4
- `@types/react`: 18.2.46 → 18.3.3
- `@types/react-dom`: 18.2.18 → 18.3.0
- `@types/node`: 20.10.6 → 20.14.12
- Other minor dependency updates

### 3. Updated next.config.js
- Removed `experimental` flag for Server Actions (now stable in Next.js 14.2+)
- Added `compress: true` for better performance
- Added `swcMinify: true` for faster builds
- Removed `poweredByHeader` for security

## Installation Steps

After pulling these changes, run:

```bash
npm install
```

This will install the updated dependencies.

## Breaking Changes

None - this is a patch and minor version update within Next.js 14.x, so no breaking changes expected.

## Testing Checklist

After upgrading, test the following:

- [ ] All pages load correctly
- [ ] Email sending works properly (especially with empty body)
- [ ] Navigation between pages works
- [ ] API routes function correctly
- [ ] Authentication works
- [ ] Document generation works
- [ ] PDF generation works

## Known Issues Fixed

1. **Email Body Bug:** Fixed incorrect fallback behavior when email body is empty
2. **Security:** Updated to Next.js 14.2.15 which includes security patches
3. **Page Loading:** Improved configuration for better page rendering

## If Pages Don't Load

If you encounter issues with pages not loading after the upgrade:

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run build
   ```

2. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check browser console** for any JavaScript errors

4. **Check server logs** for any runtime errors

5. **Verify environment variables** are set correctly (especially `NEXTAUTH_SECRET` and `DATABASE_URL`)

6. **Try development mode:**
   ```bash
   npm run dev
   ```

## Rollback (if needed)

If you need to rollback to the previous version:

1. Revert `package.json` changes
2. Run `npm install`
3. Clear `.next` directory
4. Restart the development server
