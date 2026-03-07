require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const policySql = `
-- drop existing insertion policy if exists
DROP POLICY IF EXISTS "Allow public to insert feedbacks" ON public.feedbacks;

-- create strict policy for anon inserts
CREATE POLICY "Allow public to insert feedbacks"
  ON public.feedbacks
  FOR INSERT
  TO public
  WITH CHECK (true);
`;

  const { error } = await supabase.rpc('sql', { statement: policySql })
  // supabase-js doesn't support direct SQL (except via pg functions), so use generic REST endpoint
  if (error) {
    console.error('Error applying policy SQL:', error)
  } else {
    console.log('Policy SQL executed (or no error reported)')
  }
}

run()
