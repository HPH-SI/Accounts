# Setup Guide

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL`: SQLite database path (default: `file:./dev.db`)
   - `NEXTAUTH_SECRET`: A random secret string for NextAuth
   - `NEXTAUTH_URL`: Your application URL (default: `http://localhost:3000`)
   - Email settings (SMTP configuration)

3. **Set Up Database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Seed Initial Users**
   ```bash
   npm run seed
   ```
   
   This creates three default users:
   - **Admin**: admin@example.com / admin123
   - **Staff**: staff@example.com / staff123
   - **Viewer**: viewer@example.com / viewer123

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Access the Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Email Configuration

To enable email functionality, configure SMTP settings in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `SMTP_PASSWORD`

## Document Number Prefixes

You can customize document number prefixes in `.env`:

```env
QUOTATION_PREFIX=QUO
PROFORMA_PREFIX=PI
INVOICE_PREFIX=INV
```

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. For production, consider:
   - Using PostgreSQL instead of SQLite
   - Setting up proper environment variables
   - Configuring a production email service
   - Setting up SSL/HTTPS

## Database Management

- View database: `npm run db:studio`
- Reset database: Delete `prisma/dev.db` and run `npm run db:push` again

## Troubleshooting

### Database Issues
- If you see Prisma errors, run `npm run db:generate` again
- Make sure the database file has write permissions

### Email Issues
- Verify SMTP credentials are correct
- Check firewall settings for SMTP port
- For Gmail, ensure App Password is used (not regular password)

### Authentication Issues
- Clear browser cookies and try again
- Verify `NEXTAUTH_SECRET` is set in `.env`
- Check that `NEXTAUTH_URL` matches your application URL

