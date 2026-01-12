
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Checking saved_ideas table...');
  const { data, error } = await sb.from('saved_ideas').select('*').limit(1);
  if (error) {
    console.error('Error selecting from saved_ideas:', error);
  } else {
    console.log('Success! Table exists. Row count:', data.length);
    console.log('Sample row:', data[0]);
  }
}

main();
