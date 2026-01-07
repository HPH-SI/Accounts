// Quick script to check .env file format
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file does not exist!');
  console.log('\nCreate a .env file with:');
  console.log('DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/^DATABASE_URL=(.+)$/m);

if (!dbUrlMatch) {
  console.log('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

const dbUrl = dbUrlMatch[1].replace(/^["']|["']$/g, ''); // Remove quotes

if (dbUrl.startsWith('file:')) {
  console.log('❌ ERROR: DATABASE_URL is set to SQLite format!');
  console.log('Current value:', dbUrl.substring(0, 50) + '...');
  console.log('\nYou need to change it to PostgreSQL format:');
  console.log('DATABASE_URL="postgresql://postgres.hkjdqiuvltlidwtbghtx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"');
  process.exit(1);
}

if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
  console.log('❌ ERROR: DATABASE_URL must start with postgresql:// or postgres://');
  console.log('Current value:', dbUrl.substring(0, 50) + '...');
  process.exit(1);
}

console.log('✅ DATABASE_URL format looks correct!');
console.log('URL starts with:', dbUrl.substring(0, 20) + '...');




