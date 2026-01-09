import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hphaccounts.com' },
    update: {},
    create: {
      email: 'admin@hphaccounts.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  // Create staff user
  const staffPassword = await bcrypt.hash('staff123', 10)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@hphaccounts.com' },
    update: {},
    create: {
      email: 'staff@hphaccounts.com',
      password: staffPassword,
      name: 'Staff User',
      role: 'STAFF',
    },
  })

  // Create viewer user
  const viewerPassword = await bcrypt.hash('viewer123', 10)
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@hphaccounts.com' },
    update: {},
    create: {
      email: 'viewer@hphaccounts.com',
      password: viewerPassword,
      name: 'Viewer User',
      role: 'VIEWER',
    },
  })

  console.log('Seeded users:', { admin, staff, viewer })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

