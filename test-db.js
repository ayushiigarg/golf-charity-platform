import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '.env')
const envContent = readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.trim()
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabase() {
  console.log('Testing database tables for draws functionality...\n')

  try {
    // Test subscriptions table
    console.log('1. Testing subscriptions table...')
    const { data: subs, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1)

    if (subsError) {
      console.error('[FAIL] Subscriptions table error:', subsError.message)
    } else {
      console.log('[OK] Subscriptions table exists')
    }

    // Test scores table
    console.log('2. Testing scores table...')
    const { data: scores, error: scoresError } = await supabase
      .from('scores')
      .select('*')
      .limit(1)

    if (scoresError) {
      console.error('[FAIL] Scores table error:', scoresError.message)
    } else {
      console.log('[OK] Scores table exists')
    }

    // Test draws table
    console.log('3. Testing draws table...')
    const { data: draws, error: drawsError } = await supabase
      .from('draws')
      .select('*')
      .limit(1)

    if (drawsError) {
      console.error('[FAIL] Draws table error:', drawsError.message)
    } else {
      console.log('[OK] Draws table exists')
    }

    // Test winners table
    console.log('4. Testing winners table...')
    const { data: winners, error: winnersError } = await supabase
      .from('winners')
      .select('*')
      .limit(1)

    if (winnersError) {
      console.error('[FAIL] Winners table error:', winnersError.message)
    } else {
      console.log('[OK] Winners table exists')
    }

    console.log('\nDatabase test completed!')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testDatabase()