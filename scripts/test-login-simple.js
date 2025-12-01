// Simple test using Node.js fetch
const testLogin = async () => {
  try {
    console.log('🚀 Testing Login API...\n')
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: '123@Admin',
        rememberMe: true
      }),
    })

    console.log('📊 Response Status:', response.status, response.statusText)
    console.log('📊 Response OK:', response.ok)
    console.log('📊 Content-Type:', response.headers.get('content-type'))
    
    const text = await response.text()
    console.log('\n📄 Response Body:')
    console.log(text)
    
    try {
      const data = JSON.parse(text)
      console.log('\n✅ Parsed JSON:')
      console.log(JSON.stringify(data, null, 2))
      
      if (data.token) {
        console.log('\n✅ Token exists:', data.token.substring(0, 30) + '...')
      }
      if (data.user) {
        console.log('✅ User:', data.user.email, '- Role:', data.user.role)
      }
      if (data.error) {
        console.log('❌ Error:', data.error)
      }
    } catch (e) {
      console.log('\n❌ Not valid JSON response')
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

testLogin()

