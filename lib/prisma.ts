import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure PrismaClient to work with Supabase connection pooler (pgBouncer)
// CRITICAL FIX: pgBouncer uses transaction pooling, which doesn't support prepared statements
// The connection string MUST have ?pgbouncer=true for Prisma to disable prepared statements
// If your DATABASE_URL doesn't have this, add it to your .env file:
// DATABASE_URL="...?pgbouncer=true" (or add &pgbouncer=true if other params exist)
function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || ''
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  // Check if we're using Supabase connection pooler
  const isUsingPooler = databaseUrl.includes('pooler.supabase.com') || 
                        databaseUrl.includes('pgbouncer') ||
                        databaseUrl.includes('pooler')
  
  // Ensure pgbouncer=true parameter is present for Supabase pooler
  // This is CRITICAL - Prisma will use prepared statements by default, which fail with pgBouncer
  let url = databaseUrl
  if (isUsingPooler && !url.includes('pgbouncer=true')) {
    // Add pgbouncer=true parameter - this tells Prisma to disable prepared statements
    url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true'
    
    // Log warning in development to inform user to update .env
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Prisma] Added pgbouncer=true to connection string. Please add this to your .env file for consistency.')
    }
  }
  
  // Create PrismaClient with explicit datasource configuration
  // This ensures the corrected URL is used
  // IMPORTANT: If you see prepared statement errors, regenerate Prisma Client:
  // Run: npx prisma generate
  return new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

