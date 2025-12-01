const email = 'admin@admin.com'
const password = '123@Admin'
const rememberMe = true

async function testAPILogin() {
  console.log('Testing API Login...')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('Remember Me:', rememberMe)
  console.log('---')

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, rememberMe }),
    })

    console.log('Response Status:', response.status)
    console.log('Response OK:', response.ok)
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))

    const data = await response.json()
    console.log('\nResponse Data:')
    console.log(JSON.stringify(data, null, 2))

    if (data.token) {
      console.log('\n✅ Token received:', data.token.substring(0, 50) + '...')
      console.log('Token length:', data.token.length)
    } else {
      console.log('\n❌ No token in response')
    }

    if (data.user) {
      console.log('\n✅ User data received:')
      console.log('  - ID:', data.user.id)
      console.log('  - Email:', data.user.email)
      console.log('  - Name:', data.user.name)
      console.log('  - Role:', data.user.role)
    } else {
      console.log('\n❌ No user data in response')
    }

    if (data.error) {
      console.log('\n❌ Error:', data.error)
    }

    // Check cookies
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      console.log('\n✅ Cookie Set-Cookie header:', setCookieHeader.substring(0, 100) + '...')
    } else {
      console.log('\n❌ No Set-Cookie header')
    }

  } catch (error: any) {
    console.error('\n❌ Request failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

testAPILogin()

