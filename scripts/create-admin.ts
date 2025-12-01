import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@admin.com'
  const password = '123@Admin'
  const name = 'Administrator'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      email,
      deletedAt: null,
    },
  })

  if (existingAdmin) {
    // Update existing admin password
    const hashedPassword = await hash(password, 12)
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        password: hashedPassword,
        role: 'ADMIN',
      },
    })
    console.log('✅ Admin password updated successfully!')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log(`Role: ADMIN`)
  } else {
    // Create new admin
    const hashedPassword = await hash(password, 12)
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
      },
    })
    console.log('✅ Admin created successfully!')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log(`Role: ADMIN`)
    console.log(`User ID: ${admin.id}`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

