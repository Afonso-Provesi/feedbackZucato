require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  console.log('URL:', url)
  console.log('Anon Key:', anon ? anon.slice(0, 20) + '...' : '<none>')
  const supabase = createClient(url, anon)
  try {
    const { data, error, status } = await supabase
      .from('feedbacks')
      .insert([{ rating: 5, comment: 'teste', sentiment: 'positivo', is_anonymous: true, source: 'web' }])
    console.log('status', status)
    if (error) {
      console.error('error', error)
    } else {
      console.log('inserted', data)
    }
  } catch (e) {
    console.error('exception', e)
  }
}

run()
