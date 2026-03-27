import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data: rewards } = await supabase.from('milestone_rewards').select('*');
  const { data: exchanges } = await supabase.from('reward_exchanges').select('*');
  const { data: oldRewards } = await supabase.from('rewards').select('*');

  console.log('milestone_rewards:', rewards?.length || 0, '件');
  console.log('reward_exchanges:', exchanges?.length || 0, '件');
  console.log('rewards:', oldRewards?.length || 0, '件');
  
  if (rewards) rewards.forEach((r, i) => console.log(`  [${i+1}] ${r.name}`));
}

check();
