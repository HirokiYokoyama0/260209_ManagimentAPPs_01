import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
  console.log('🔍 milestone_rewards の重複チェック\n');

  const { data: rewards } = await supabase
    .from('milestone_rewards')
    .select('*')
    .order('created_at');

  if (!rewards) {
    console.log('❌ データ取得失敗');
    return;
  }

  console.log(`総レコード数: ${rewards.length}件\n`);

  rewards.forEach((r, idx) => {
    console.log(`[${idx + 1}] ${r.name}`);
    console.log(`    ID: ${r.id}`);
    console.log(`    reward_type: ${r.reward_type}`);
    console.log(`    milestone_type: ${r.milestone_type}`);
    console.log(`    created_at: ${r.created_at}`);
    console.log('');
  });

  // 重複を検出
  const duplicates = rewards.reduce((acc: any, r) => {
    const key = `${r.reward_type}_${r.milestone_type}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(r.id);
    return acc;
  }, {});

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 重複検出結果');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let hasDuplicates = false;
  Object.entries(duplicates).forEach(([key, ids]: [string, any]) => {
    if (ids.length > 1) {
      hasDuplicates = true;
      console.log(`⚠️  ${key}: ${ids.length}件`);
      ids.forEach((id: string, idx: number) => {
        console.log(`    ${idx === 0 ? '保持' : '削除候補'}: ${id}`);
      });
    }
  });

  if (!hasDuplicates) {
    console.log('✅ 重複なし');
  } else {
    console.log('\n⚠️  重複が検出されました。');
    console.log('   古いレコードを削除することを推奨します。');
  }
}

checkDuplicates();
