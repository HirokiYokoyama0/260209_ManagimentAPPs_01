import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function completeInspection() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Supabase データベース完全調査');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // ==========================================
    // 1. テーブルの存在確認
    // ==========================================
    console.log('🔍 1. テーブル存在確認\n');

    const tables = ['rewards', 'milestone_rewards', 'reward_exchanges', 'milestone_history', 'profiles'];

    for (const tableName of tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${tableName}: 存在しない or アクセス不可 (${error.message})`);
      } else {
        console.log(`   ✅ ${tableName}: 存在（レコード数: ${data?.length || 0}件）`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ==========================================
    // 2. rewards テーブル（旧特典マスター）
    // ==========================================
    console.log('🎁 2. rewards テーブル（旧特典マスター）\n');

    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .order('created_at');

    if (rewardsError) {
      console.log(`   ❌ エラー: ${rewardsError.message}\n`);
    } else if (!rewards || rewards.length === 0) {
      console.log('   ⚠️  データなし\n');
    } else {
      console.log(`   総レコード数: ${rewards.length}件\n`);
      rewards.forEach((r, idx) => {
        console.log(`   [${idx + 1}] ${r.name}`);
        console.log(`       ID: ${r.id}`);
        console.log(`       必要スタンプ: ${r.stamps_required}個`);
        console.log(`       is_active: ${r.is_active ? '✅ 有効' : '❌ 無効'}`);
        console.log(`       created_at: ${r.created_at}`);
        console.log('');
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ==========================================
    // 3. milestone_rewards テーブル（新特典マスター）
    // ==========================================
    console.log('🎯 3. milestone_rewards テーブル（新特典マスター）\n');

    const { data: milestoneRewards, error: milestoneError } = await supabase
      .from('milestone_rewards')
      .select('*')
      .order('created_at');

    if (milestoneError) {
      console.log(`   ❌ エラー: ${milestoneError.message}\n`);
    } else if (!milestoneRewards || milestoneRewards.length === 0) {
      console.log('   ⚠️  データなし（これが問題の原因です！）\n');
    } else {
      console.log(`   総レコード数: ${milestoneRewards.length}件\n`);
      milestoneRewards.forEach((r, idx) => {
        console.log(`   [${idx + 1}] ${r.name}`);
        console.log(`       ID: ${r.id}`);
        console.log(`       reward_type: ${r.reward_type}`);
        console.log(`       milestone_type: ${r.milestone_type}`);
        console.log(`       validity_months: ${r.validity_months === 0 ? '当日限り' : r.validity_months === null ? '無期限' : `${r.validity_months}ヶ月`}`);
        console.log(`       is_active: ${r.is_active ? '✅' : '❌'}`);
        console.log(`       display_order: ${r.display_order}`);
        console.log(`       created_at: ${r.created_at}`);
        console.log('');
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ==========================================
    // 4. reward_exchanges テーブル（交換履歴）
    // ==========================================
    console.log('📋 4. reward_exchanges テーブル（交換履歴）\n');

    const { data: exchanges, error: exchangesError } = await supabase
      .from('reward_exchanges')
      .select('*')
      .order('exchanged_at', { ascending: false });

    if (exchangesError) {
      console.log(`   ❌ エラー: ${exchangesError.message}\n`);
    } else if (!exchanges || exchanges.length === 0) {
      console.log('   ⚠️  データなし\n');
    } else {
      console.log(`   総レコード数: ${exchanges.length}件\n`);

      const milestoneCount = exchanges.filter(e => e.is_milestone_based === true).length;
      const oldCount = exchanges.filter(e => e.is_milestone_based === false || e.is_milestone_based === null).length;
      const pendingCount = exchanges.filter(e => e.status === 'pending').length;

      console.log(`   📊 サマリー:`);
      console.log(`      マイルストーン型: ${milestoneCount}件`);
      console.log(`      旧システム: ${oldCount}件`);
      console.log(`      未引渡（pending）: ${pendingCount}件\n`);

      console.log('   📝 直近5件:');
      exchanges.slice(0, 5).forEach((e, idx) => {
        console.log(`   [${idx + 1}] user_id: ${e.user_id.slice(0, 20)}...`);
        console.log(`       reward_id: ${e.reward_id}`);
        console.log(`       status: ${e.status}`);
        console.log(`       is_milestone_based: ${e.is_milestone_based === true ? '✅ 新' : e.is_milestone_based === false ? '❌ 旧' : '❓ NULL'}`);
        console.log(`       milestone_reached: ${e.milestone_reached || 'なし'}`);
        console.log(`       exchanged_at: ${e.exchanged_at}`);
        console.log(`       notes: ${e.notes?.substring(0, 50)}${e.notes?.length > 50 ? '...' : ''}`);
        console.log('');
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ==========================================
    // 5. milestone_history テーブル
    // ==========================================
    console.log('📜 5. milestone_history テーブル\n');

    const { data: history, error: historyError } = await supabase
      .from('milestone_history')
      .select('*')
      .order('reached_at', { ascending: false });

    if (historyError) {
      console.log(`   ❌ エラー: ${historyError.message}\n`);
    } else if (!history || history.length === 0) {
      console.log('   ⚠️  データなし（まだマイルストーン到達なし）\n');
    } else {
      console.log(`   総レコード数: ${history.length}件\n`);
      history.slice(0, 5).forEach((h, idx) => {
        console.log(`   [${idx + 1}] user_id: ${h.user_id.slice(0, 20)}...`);
        console.log(`       milestone: ${h.milestone}`);
        console.log(`       reached_at: ${h.reached_at}`);
        console.log('');
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ==========================================
    // 6. profiles テーブル（スタンプ数確認）
    // ==========================================
    console.log('👥 6. profiles テーブル（上位5名のスタンプ数）\n');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, line_display_name, stamp_count')
      .order('stamp_count', { ascending: false })
      .limit(5);

    if (profilesError) {
      console.log(`   ❌ エラー: ${profilesError.message}\n`);
    } else if (!profiles || profiles.length === 0) {
      console.log('   ⚠️  データなし\n');
    } else {
      profiles.forEach((p, idx) => {
        console.log(`   [${idx + 1}] ${p.line_display_name}: ${p.stamp_count}個`);
      });
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ==========================================
    // まとめ
    // ==========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 調査結果まとめ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`✅ rewards テーブル: ${rewards?.length || 0}件`);
    console.log(`   - 有効: ${rewards?.filter(r => r.is_active).length || 0}件`);
    console.log(`   - 無効: ${rewards?.filter(r => !r.is_active).length || 0}件\n`);

    console.log(`🎯 milestone_rewards テーブル: ${milestoneRewards?.length || 0}件`);
    if (!milestoneRewards || milestoneRewards.length === 0) {
      console.log('   ⚠️  【重大】データが空です！これがミニアプリで0件になる原因です。\n');
    } else {
      console.log(`   - 有効: ${milestoneRewards?.filter(r => r.is_active).length || 0}件\n`);
    }

    console.log(`📋 reward_exchanges テーブル: ${exchanges?.length || 0}件`);
    console.log(`   - マイルストーン型: ${exchanges?.filter(e => e.is_milestone_based === true).length || 0}件`);
    console.log(`   - 旧システム: ${exchanges?.filter(e => e.is_milestone_based === false || e.is_milestone_based === null).length || 0}件\n`);

    console.log(`📜 milestone_history テーブル: ${history?.length || 0}件\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 致命的エラー:', error);
  }
}

completeInspection();
