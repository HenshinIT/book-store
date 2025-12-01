import { getUserByEmail, verifyPassword } from '../lib/auth'
import { hash } from 'bcryptjs'

async function testLogin() {
  const email = 'admin@admin.com'
  const password = '123@Admin'

  console.log('Testing login for:', email)
  
  // Check user exists
  const user = await getUserByEmail(email)
  if (!user) {
    console.log('❌ User not found!')
    return
  }

  console.log('✅ User found:', {
    id: user.id,
    email: user.email,
    role: user.role,
    passwordHash: user.password.substring(0, 20) + '...',
  })

  // Test password verification
  const isValid = await verifyPassword(password, user.password)
  console.log('Password verification:', isValid ? '✅ PASSED' : '❌ FAILED')

  if (!isValid) {
    // Try to create a new hash and compare
    const testHash = await hash(password, 12)
    console.log('Test hash:', testHash.substring(0, 30) + '...')
    console.log('Stored hash:', user.password.substring(0, 30) + '...')
    
    // Try verify again with test hash
    const testVerify = await verifyPassword(password, testHash)
    console.log('Test hash verification:', testVerify ? '✅ PASSED' : '❌ FAILED')
  }
}

testLogin()
  .then(() => {
    console.log('Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Test error:', error)
    process.exit(1)
  })

