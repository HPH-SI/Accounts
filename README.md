# Heritage Park Hotel Accounts

A comprehensive financial document management system for creating and managing Quotations, Proforma Invoices, and Invoices.

## Features

- **Customer Management**: Manage companies and individuals
- **Document Types**: Quotation, Proforma Invoice, Invoice
- **Auto-numbering**: Automatic document number generation
- **Email System**: Send documents with CC/BCC support
- **Payment Tracking**: Track payments with variance calculations
- **Dashboard & Analytics**: Monthly contribution graphs
- **Reports**: Download reports in PDF, Excel, CSV formats
- **Role-based Access**: Admin, Staff, and Viewer roles

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env file (see EMAIL_SETUP.md for email configuration)
# Edit .env with your Supabase database password and SMTP settings
# Get your password from: Supabase Dashboard → Settings → Database
# Replace [YOUR-PASSWORD] in DATABASE_URL
```

3. Set up the database:
```bash
npm run db:generate
npm run db:push
```

**Note**: The application uses Supabase (PostgreSQL). Make sure you have:
- Your Supabase database password
- Connection strings configured in `.env` (see `.env.example`)
- See `SUPABASE_SETUP.md` for detailed instructions

4. Create an admin user (run once):
```bash
npm run seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login

After seeding:
- **Admin**: admin@hphaccounts.com / admin123
- **Staff**: staff@hphaccounts.com / staff123
- **Viewer**: viewer@hphaccounts.com / viewer123

## Tech Stack

- **Framework**: Next.js 14
- **Database**: Supabase (PostgreSQL with Prisma ORM)
- **Authentication**: NextAuth.js
- **UI**: React + Tailwind CSS
- **Charts**: Chart.js
- **PDF**: jsPDF
- **Email**: Nodemailer

## Project Structure

```
├── app/              # Next.js app directory
├── components/       # React components
├── lib/              # Utilities and helpers
├── prisma/           # Database schema
├── public/           # Static assets
└── types/            # TypeScript types
```

# Accounts
# Accounts