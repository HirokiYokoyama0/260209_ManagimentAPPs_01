import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// .env.local を読み込む
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStatus() {
  console.log('🔍 データベース状態チェック中...\n');

  try {
    // 1. reward_exchanges の状態確認
    console.log('📊 1. reward_exchanges テーブルの状態');
    const { data: exchanges, error: exchangesError } = await supabase
      .from('reward_exchanges')
      .select('*');

    if (exchangesError) throw exchangesError;

    const totalCount = exchanges?.length || 0;
    const milestoneCount = exchanges?.filter(e => e.is_milestone_based === true).length || 0;
    const oldCount = exchanges?.filter(e => e.is_milestone_based === false || e.is_milestone_based === null).length || 0;
    const pendingCount = exchanges?.filter(e => e.status === 'pending').length || 0;

    console.log(`   総数: ${totalCount}件`);
    console.log(`   マイルストーン型: ${milestoneCount}件`);
    console.log(`   旧システム: ${oldCount}件`);
    console.log(`   未引渡（pending）: ${pendingCount}件\n`);

    // 2. 旧システムの詳細
    console.log('📋 2. 旧システムの特典交換履歴（無効化される予定）');
    const oldExchanges = exchanges?.filter(e => e.is_milestone_based === false || e.is_milestone_based === null);
    if (oldExchanges && oldExchanges.length > 0) {
      oldExchanges.forEach((ex, idx) => {
        console.log(`   [${idx + 1}] user_id: ${ex.user_id}`);
        console.log(`       status: ${ex.status}`);
        console.log(`       exchanged_at: ${ex.exchanged_at}`);
        console.log(`       notes: ${ex.notes || '(なし)'}`);
        console.log('');
      });
    } else {
      console.log('   なし\n');
    }

    // 3. rewards テーブルの確認
    console.log('🎁 3. rewards マスターテーブルの状態');
    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*');

    if (rewardsError) throw rewardsError;

    const activeRewards = rewards?.filter(r => r.is_active === true).length || 0;
    console.log(`   総数: ${rewards?.length || 0}件`);
    console.log(`   有効: ${activeRewards}件\n`);

    // 4. milestone_rewards の確認
    console.log('🎯 4. milestone_rewards テーブルの存在確認');
    const { data: milestoneRewards, error: milestoneError } = await supabase
      .from('milestone_rewards')
      .select('*');

    if (milestoneError) {
      console.log(`   ❌ テーブルが存在しません（${milestoneError.message}）\n`);
    } else {
      console.log(`   ✅ テーブル存在（${milestoneRewards?.length || 0}件のレコード）\n`);
    }

    // 5. milestone_history の確認
    console.log('📜 5. milestone_history テーブルの存在確認');
    const { data: milestoneHistory, error: historyError } = await supabase
      .from('milestone_history')
      .select('*');

    if (historyError) {
      console.log(`   ❌ テーブルが存在しません（${historyError.message}）\n`);
    } else {
      console.log(`   ✅ テーブル存在（${milestoneHistory?.length || 0}件のレコード）\n`);
    }

    // まとめ
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 まとめ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 現在の特典交換履歴: ${totalCount}件`);
    console.log(`⚠️  023実行で無効化される: ${oldCount}件`);
    console.log(`   うち未引渡（pending）: ${oldCount > 0 ? oldExchanges?.filter(e => e.status === 'pending').length : 0}件`);
    console.log('');

    if (oldCount > 0 && oldExchanges?.some(e => e.status === 'pending')) {
      console.log('⚠️  警告: 未引渡の特典が無効化されます');
      console.log('   ユーザーへの事前通知を推奨します。');
    }

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

checkDatabaseStatus();
