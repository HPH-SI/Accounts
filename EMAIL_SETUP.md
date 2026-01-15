# Email Configuration Guide

This guide will help you set up email functionality to send documents (Quotations, Proforma Invoices, and Invoices) via email.

## Quick Setup

1. **Add SMTP configuration to your `.env` file** (see `.env.example` for template)

2. **For Heritage Park Hotel emails**, you'll need SMTP credentials for:
   - `info@heritageparkhotel.com.sb`
   - `rdm@heritageparkhotel.com.sb`
   - `reservations@heritageparkhotel.com.sb`

## Environment Variables Required

Add these to your `.env` file:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@domain.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@domain.com"
```

### Optional: Per-Sender Credentials (Recommended for Multiple Gmail Accounts)

If you want each sender address to authenticate with its own Gmail account, add the following variables:

```env
SMTP_USER_INFO="info@heritageparkhotel.com.sb"
SMTP_PASSWORD_INFO="your-info-app-password"

SMTP_USER_RDM="rdm@heritageparkhotel.com.sb"
SMTP_PASSWORD_RDM="your-rdm-app-password"

SMTP_USER_RESERVATIONS="reservations@heritageparkhotel.com.sb"
SMTP_PASSWORD_RESERVATIONS="your-reservations-app-password"
```

If a per-sender credential is not set, the app will fall back to `SMTP_USER` and `SMTP_PASSWORD`.

## Configuration by Email Provider

### Gmail Setup

1. **Enable 2-Factor Authentication** on your Google account
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Enter "Heritage Park Hotel Accounts" as the name
   - Copy the 16-character password

3. **Configure `.env` file:**
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="xxxx xxxx xxxx xxxx"  # Your 16-character app password (no spaces)
   SMTP_FROM="your-email@gmail.com"
   ```

### Outlook/Microsoft 365 Setup

1. **Enable SMTP AUTH** in your Microsoft 365 admin center
   - Go to Microsoft 365 admin center → Settings → Mail
   - Enable "Authenticated SMTP" (may require admin approval)

2. **Use App Password** (if 2FA is enabled)
   - Go to [Microsoft Account Security](https://account.microsoft.com/security)
   - Create an app password

3. **Configure `.env` file:**
   ```env
   SMTP_HOST="smtp.office365.com"
   SMTP_PORT=587
   SMTP_USER="your-email@outlook.com"
   SMTP_PASSWORD="your-app-password"
   SMTP_FROM="your-email@outlook.com"
   ```

### Custom Domain Email (heritageparkhotel.com.sb)

If you're using a custom email provider (like cPanel, Plesk, or other hosting), you'll need:

1. **Get SMTP credentials from your hosting provider**
   - SMTP server hostname (e.g., `mail.heritageparkhotel.com.sb` or `smtp.heritageparkhotel.com.sb`)
   - SMTP port (usually 587 for TLS, 465 for SSL, or 25)
   - Username (usually the full email address)
   - Password (your email account password)

2. **Configure `.env` file:**
   ```env
   SMTP_HOST="mail.heritageparkhotel.com.sb"
   SMTP_PORT=587
   SMTP_USER="info@heritageparkhotel.com.sb"
   SMTP_PASSWORD="your-email-password"
   SMTP_FROM="info@heritageparkhotel.com.sb"
   ```

**Note:** For the Heritage Park Hotel email addresses, you may need separate configurations. The application allows selecting the "from" address when sending emails, but the SMTP credentials must match the configured account.

### Alternative: Single SMTP Account with Aliases

If your email provider supports sending from aliases using one SMTP account:

1. **Set up the main SMTP account** (e.g., `info@heritageparkhotel.com.sb`)
2. **Configure aliases** in your email provider:
   - `rdm@heritageparkhotel.com.sb` → forwards to/alias of `info@heritageparkhotel.com.sb`
   - `reservations@heritageparkhotel.com.sb` → forwards to/alias of `info@heritageparkhotel.com.sb`

3. **Configure `.env` file:**
   ```env
   SMTP_HOST="mail.heritageparkhotel.com.sb"
   SMTP_PORT=587
   SMTP_USER="info@heritageparkhotel.com.sb"
   SMTP_PASSWORD="info-account-password"
   SMTP_FROM="info@heritageparkhotel.com.sb"
   ```

4. **Update the "From" address** in the application when sending - most SMTP servers will allow this if the domain matches.

## Testing Email Configuration

### Option 1: Test from Settings Page

1. Log in as Admin or Staff
2. Go to **Settings** → **Email Configuration**
3. Click **Test Email Configuration**
4. Enter a test email address
5. Check if the test email is received

### Option 2: Test by Sending a Document

1. Create or open a document
2. Click **Send Email**
3. Fill in the recipient email
4. Select a "From" address
5. Send the email
6. Check if the document PDF is received

### Option 3: Check Application Logs

If email sending fails, check:
- Browser console for errors
- Server logs (if running locally: terminal output)
- Email logs in the database (via Admin panel)

## Common Issues and Solutions

### Issue: "Invalid login credentials"

**Solution:**
- Verify `SMTP_USER` and `SMTP_PASSWORD` are correct
- For Gmail, ensure you're using an App Password, not your regular password
- Check that 2FA is enabled (for Gmail)

### Issue: "Connection timeout"

**Solution:**
- Verify `SMTP_HOST` and `SMTP_PORT` are correct
- Check firewall settings (port 587 or 465 should be open)
- Try port 465 with `secure: true` (SSL) instead of 587 (TLS)

### Issue: "Relay access denied"

**Solution:**
- Ensure SMTP authentication is enabled
- Check that your IP is not blocked
- Verify your email provider allows SMTP access

### Issue: "Email sent but not received"

**Solution:**
- Check spam/junk folder
- Verify recipient email address is correct
- Check email logs in the application (Settings → Email Logs)
- Verify SMTP_FROM matches the authenticated account

### Issue: "Can't send from selected address"

**Solution:**
- Ensure the "From" address is one of the configured sender addresses
- For Gmail/Outlook, the "From" address usually must match the authenticated account
- For custom domains, verify the domain is configured in your SMTP server

## Port Configuration

| Port | Protocol | Security | Common Use |
|------|----------|----------|------------|
| 587  | SMTP     | STARTTLS | Recommended for most providers |
| 465  | SMTP     | SSL/TLS  | Alternative, requires `secure: true` |
| 25   | SMTP     | None     | Usually blocked by ISPs, not recommended |

**Note:** Port 587 with STARTTLS (secure: false) is recommended and is the default in this application.

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use App Passwords** - Don't use your main email password
3. **Restrict SMTP access** - If possible, restrict by IP in your email provider
4. **Rotate passwords** - Change SMTP passwords regularly
5. **Use environment-specific configs** - Different credentials for dev/prod

## Production Deployment (Vercel)

For Vercel deployment, add the SMTP environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `SMTP_FROM`
3. Select environments: Production, Preview, Development
4. Redeploy your application

## Email Sending Features

Once configured, the application can:
- ✅ Send documents (Quotations, Proforma Invoices, Invoices) as PDF attachments
- ✅ Select from predefined sender addresses
- ✅ Include CC and BCC recipients
- ✅ Customize email subject and body
- ✅ Log all email activity (sent/failed)
- ✅ Track email history per document

## Need Help?

If you encounter issues:
1. Check this guide first
2. Verify your SMTP credentials with your email provider
3. Test with a simple email client (like Thunderbird) to verify SMTP works
4. Check application logs for detailed error messages
