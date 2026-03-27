import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('✅ 023マイグレーション実行結果の確認\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. reward_exchanges の確認
    console.log('📊 1. reward_exchanges テーブルの確認');
    const { data: exchanges } = await supabase
      .from('reward_exchanges')
      .select('*')
      .order('exchanged_at', { ascending: false });

    console.log(`   総レコード数: ${exchanges?.length || 0}件`);
    console.log(`   無効化メッセージ付き: ${exchanges?.filter(e => e.notes?.includes('[旧仕様]')).length || 0}件\n`);

    // 2. rewards テーブルの確認
    console.log('🎁 2. rewards テーブルの確認（旧特典マスター）');
    const { data: rewards } = await supabase
      .from('rewards')
      .select('*');

    console.log(`   総レコード数: ${rewards?.length || 0}件`);
    console.log(`   有効（is_active = true）: ${rewards?.filter(r => r.is_active).length || 0}件`);
    console.log(`   無効（is_active = false）: ${rewards?.filter(r => !r.is_active).length || 0}件`);

    if (rewards) {
      rewards.forEach(r => {
        console.log(`      - ${r.name}: ${r.is_active ? '✅ 有効' : '❌ 無効'}`);
      });
    }
    console.log('');

    // 3. milestone_rewards テーブルの確認
    console.log('🎯 3. milestone_rewards テーブルの確認（新特典マスター）');
    const { data: milestoneRewards } = await supabase
      .from('milestone_rewards')
      .select('*')
      .order('display_order');

    console.log(`   総レコード数: ${milestoneRewards?.length || 0}件`);
    console.log(`   有効（is_active = true）: ${milestoneRewards?.filter(r => r.is_active).length || 0}件\n`);

    if (milestoneRewards) {
      milestoneRewards.forEach(r => {
        console.log(`      [${r.display_order}] ${r.name}`);
        console.log(`          タイプ: ${r.milestone_type}`);
        console.log(`          有効期限: ${r.validity_months === 0 ? '当日限り' : r.validity_months === null ? '無期限' : `${r.validity_months}ヶ月`}`);
        console.log(`          状態: ${r.is_active ? '✅ 有効' : '❌ 無効'}`);
      });
    }
    console.log('');

    // 4. milestone_history テーブルの確認
    console.log('📜 4. milestone_history テーブルの確認');
    const { data: history } = await supabase
      .from('milestone_history')
      .select('*');

    console.log(`   総レコード数: ${history?.length || 0}件\n`);

    // 5. カラムの確認
    console.log('🔍 5. reward_exchanges の新カラム確認');
    const { data: sampleExchange } = await supabase
      .from('reward_exchanges')
      .select('*')
      .limit(1)
      .single();

    if (sampleExchange) {
      const hasColumns = {
        milestone_reached: 'milestone_reached' in sampleExchange,
        valid_until: 'valid_until' in sampleExchange,
        is_first_time: 'is_first_time' in sampleExchange,
        is_milestone_based: 'is_milestone_based' in sampleExchange,
      };

      console.log(`   milestone_reached: ${hasColumns.milestone_reached ? '✅' : '❌'}`);
      console.log(`   valid_until: ${hasColumns.valid_until ? '✅' : '❌'}`);
      console.log(`   is_first_time: ${hasColumns.is_first_time ? '✅' : '❌'}`);
      console.log(`   is_milestone_based: ${hasColumns.is_milestone_based ? '✅' : '❌'}`);
    }
    console.log('');

    // まとめ
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 マイグレーション結果サマリー');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const allInvalidated = exchanges?.every(e => e.notes?.includes('[旧仕様]'));
    const allRewardsDisabled = rewards?.every(r => !r.is_active);
    const newRewardsActive = milestoneRewards?.some(r => r.is_active);

    console.log(`✅ 旧特典交換履歴の無効化: ${allInvalidated ? '完了' : '未完了'}`);
    console.log(`✅ 旧特典マスターの無効化: ${allRewardsDisabled ? '完了' : '未完了'}`);
    console.log(`✅ 新特典マスターの作成: ${newRewardsActive ? '完了' : '未完了'}`);
    console.log('');

    if (allInvalidated && allRewardsDisabled && newRewardsActive) {
      console.log('🎉 023マイグレーションが正常に完了しました！');
      console.log('');
      console.log('📋 次のステップ:');
      console.log('   1. 管理画面で特典交換履歴を確認');
      console.log('   2. スタンプ付与テスト（マイルストーン判定の動作確認）');
      console.log('   3. ミニアプリ側の実装開始');
    } else {
      console.log('⚠️  一部のマイグレーション処理が未完了の可能性があります。');
    }

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

verifyMigration();
