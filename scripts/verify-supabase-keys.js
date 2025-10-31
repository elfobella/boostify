/**
 * Script to verify Supabase environment variables
 * Run this to check if your keys are correctly formatted
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

console.log('\n🔍 Supabase Environment Variables Check\n')

// Check URL
console.log('1. NEXT_PUBLIC_SUPABASE_URL:')
if (!supabaseUrl) {
  console.log('   ❌ MISSING')
} else {
  const isValid = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')
  console.log(`   ${isValid ? '✅' : '❌'} Format: ${supabaseUrl.substring(0, 40)}...`)
  if (!isValid) {
    console.log('   ⚠️  Should start with "https://" and contain ".supabase.co"')
  }
}

// Check Anon Key
console.log('\n2. NEXT_PUBLIC_SUPABASE_ANON_KEY:')
if (!supabaseAnonKey) {
  console.log('   ❌ MISSING')
} else {
  const startsWith = supabaseAnonKey.startsWith('eyJ')
  const length = supabaseAnonKey.length
  const isValid = startsWith && length > 200
  
  console.log(`   ${isValid ? '✅' : '❌'} Length: ${length} chars`)
  console.log(`   ${startsWith ? '✅' : '❌'} Format: Starts with "eyJ"`)
  console.log(`   Preview: ${supabaseAnonKey.substring(0, 30)}...`)
  
  if (!isValid) {
    if (!startsWith) {
      console.log('   ⚠️  Should start with "eyJ" (JWT format)')
    }
    if (length < 200) {
      console.log('   ⚠️  Seems too short (might be truncated)')
    }
  }
}

// Check Service Role Key
console.log('\n3. SUPABASE_SERVICE_ROLE_KEY:')
if (!supabaseServiceKey) {
  console.log('   ❌ MISSING - Email registration will NOT work!')
} else {
  const startsWith = supabaseServiceKey.startsWith('eyJ')
  const length = supabaseServiceKey.length
  const isValid = startsWith && length > 200
  
  console.log(`   ${isValid ? '✅' : '❌'} Length: ${length} chars`)
  console.log(`   ${startsWith ? '✅' : '❌'} Format: Starts with "eyJ"`)
  console.log(`   Preview: ${supabaseServiceKey.substring(0, 30)}...`)
  
  // Check if it contains 'service_role'
  try {
    const payload = JSON.parse(Buffer.from(supabaseServiceKey.split('.')[1], 'base64').toString())
    const hasServiceRole = payload.role === 'service_role'
    console.log(`   ${hasServiceRole ? '✅' : '❌'} Role: ${payload.role || 'unknown'}`)
    if (!hasServiceRole) {
      console.log('   ⚠️  Key should have role="service_role"')
    }
  } catch (e) {
    console.log('   ⚠️  Could not decode JWT payload')
  }
  
  if (!isValid) {
    if (!startsWith) {
      console.log('   ⚠️  Should start with "eyJ" (JWT format)')
    }
    if (length < 200) {
      console.log('   ⚠️  Seems too short (might be truncated)')
    }
  }
}

console.log('\n📝 Summary:')
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.log('   ❌ Some environment variables are missing')
  console.log('   Please check your .env.local file or Vercel settings')
} else {
  console.log('   ✅ All variables are present')
  console.log('   ⚠️  If you still get "Invalid API key" errors,')
  console.log('      make sure Vercel has the same values as .env.local')
}

console.log('\n')

