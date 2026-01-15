# Email Configuration - Quick Start

## Required Environment Variables

Add these to your `.env` file:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"
```

## Quick Setup for Gmail

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Heritage Park Hotel Accounts"
   - Copy the 16-character password (no spaces)
3. **Add to `.env`**:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="xxxx xxxx xxxx xxxx"  # Your app password
   SMTP_FROM="your-email@gmail.com"
   ```

## Quick Setup for Custom Domain (heritageparkhotel.com.sb)

1. **Get SMTP credentials** from your email hosting provider
2. **Add to `.env`**:
   ```env
   SMTP_HOST="mail.heritageparkhotel.com.sb"  # or your SMTP server
   SMTP_PORT=587
   SMTP_USER="info@heritageparkhotel.com.sb"
   SMTP_PASSWORD="your-email-password"
   SMTP_FROM="info@heritageparkhotel.com.sb"
   ```

## Test Email Configuration

1. Log in as Admin or Staff
2. Go to **Settings** → **Email Configuration**
3. Enter a test email address
4. Click **Send Test Email**
5. Check your inbox (and spam folder)

## Available Sender Addresses

The application allows selecting from these sender addresses when sending documents:
- `info@heritageparkhotel.com.sb`
- `rdm@heritageparkhotel.com.sb`
- `reservations@heritageparkhotel.com.sb`

**Note:** The "From" address must be configured in your SMTP server. If using Gmail/Outlook, the "From" usually must match the authenticated account.

## Troubleshooting

**"Authentication failed"**
- Check `SMTP_USER` and `SMTP_PASSWORD` are correct
- For Gmail, ensure you're using an App Password (not your regular password)
- Verify 2FA is enabled (for Gmail)

**"Connection failed"**
- Check `SMTP_HOST` and `SMTP_PORT` are correct
- Verify firewall allows port 587 or 465
- Try port 465 with SSL instead

**"Email sent but not received"**
- Check spam/junk folder
- Verify recipient email is correct
- Check email logs in the application

## More Help

See `EMAIL_SETUP.md` for:
- Detailed configuration for different email providers
- Common issues and solutions
- Security best practices
- Production deployment guide
