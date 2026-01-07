#!/bin/bash

echo "=========================================="
echo "Update .env file for Supabase"
echo "=========================================="
echo ""
echo "This script will help you update your .env file"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env 2>/dev/null || echo "# .env file" > .env
fi

echo "Current DATABASE_URL:"
grep "^DATABASE_URL" .env | head -1 || echo "DATABASE_URL not found"

echo ""
echo "=========================================="
echo "You need to manually update your .env file"
echo "=========================================="
echo ""
echo "1. Open your .env file in a text editor"
echo "2. Find the line: DATABASE_URL=\"file:./dev.db\""
echo "3. Replace it with:"
echo ""
echo "DATABASE_URL=\"postgresql://postgres.hkjdqiuvltlidwtbghtx:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true\""
echo ""
echo "4. Replace [YOUR-PASSWORD] with your Supabase database password"
echo "5. Replace [REGION] with your region (e.g., ap-southeast-1)"
echo ""
echo "To get your connection string:"
echo "  - Go to: https://supabase.com/dashboard/project/hkjdqiuvltlidwtbghtx"
echo "  - Click: Settings → Database"
echo "  - Copy the 'URI' connection string"
echo ""
echo "After updating, run: npm run db:push"




