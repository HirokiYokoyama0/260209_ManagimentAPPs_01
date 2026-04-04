/**
 * マイルストーン型特典システム - マイルストーン判定ロジック
 *
 * 機能:
 * - スタンプ数変更時にマイルストーン到達を判定
 * - 優先度ルールに基づいて特典を選択
 * - 特典の自動付与
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

// 特典の種類
export enum RewardType {
  TOOTHBRUSH = 'toothbrush',    // 歯ブラシ
  POIC = 'poic',                 // POIC殺菌剤
  PREMIUM_MENU = 'premium_menu'  // 選べる自費メニュー
}

// 優先度: 数値が大きいほど優先度が高い
const REWARD_PRIORITY = {
  [RewardType.TOOTHBRUSH]: 1,
  [RewardType.POIC]: 2,
  [RewardType.PREMIUM_MENU]: 3
};

/**
 * マイルストーンごとの特典タイプを判定
 *
 * 優先度ルール:
 * - 選べる自費メニュー > POIC > 歯ブラシ
 * - 複数のマイルストーンが重なる場合、優先度が高い方のみ付与
 *
 * @param milestone - マイルストーン数（例: 10, 50, 300）
 * @returns 特典タイプ
 */
function getRewardTypeForMilestone(milestone: number): RewardType {
  // 300以降150の倍数チェック（最優先）
  if (milestone === 300 || (milestone > 300 && (milestone - 300) % 150 === 0)) {
    return RewardType.PREMIUM_MENU;
  }

  // 50の倍数チェック（次優先）
  if (milestone % 50 === 0) {
    return RewardType.POIC;
  }

  // 10の倍数チェック（最低優先）
  if (milestone % 10 === 0) {
    return RewardType.TOOTHBRUSH;
  }

  throw new Error(`Invalid milestone: ${milestone}`);
}

/**
 * スタンプ数変更時にマイルストーンを判定
 *
 * 例:
 * - 95 → 105: マイルストーン 100 (POIC)
 * - 45 → 55: マイルストーン 50 (POIC)
 * - 290 → 310: マイルストーン 300 (自費メニュー), 310 (歯ブラシ)
 *
 * @param oldStampCount - 変更前のスタンプ数
 * @param newStampCount - 変更後のスタンプ数
 * @returns 到達したマイルストーンと特典タイプの配列
 */
export function checkMilestones(
  oldStampCount: number,
  newStampCount: number
): Array<{ milestone: number; rewardType: RewardType }> {
  const results: Array<{ milestone: number; rewardType: RewardType }> = [];

  // 通過した全マイルストーンを取得
  const allMilestones: number[] = [];

  // 10の倍数を収集
  const old10 = Math.floor(oldStampCount / 10);
  const new10 = Math.floor(newStampCount / 10);
  for (let i = old10 + 1; i <= new10; i++) {
    allMilestones.push(i * 10);
  }

  // 重複を除去してソート
  const uniqueMilestones = [...new Set(allMilestones)].sort((a, b) => a - b);

  // 各マイルストーンに対して優先度の高い特典を選択
  for (const milestone of uniqueMilestones) {
    const rewardType = getRewardTypeForMilestone(milestone);
    results.push({ milestone, rewardType });
  }

  return results;
}

/**
 * 有効期限を計算
 *
 * - 歯ブラシ: 当日限り（翌日0時まで）
 * - POIC: 5ヶ月間
 * - 自費メニュー: 5ヶ月間
 *
 * @param rewardType - 特典タイプ
 * @returns 有効期限（Date）または null（無期限）
 */
function calculateValidUntil(rewardType: RewardType): Date | null {
  const now = new Date();

  if (rewardType === RewardType.TOOTHBRUSH) {
    // 歯ブラシ: 当日限り（翌日0時まで）
    const validUntil = new Date(now);
    validUntil.setHours(23, 59, 59, 999);
    return validUntil;
  }

  if (rewardType === RewardType.POIC || rewardType === RewardType.PREMIUM_MENU) {
    // POIC・自費メニュー: 5ヶ月間
    const validUntil = new Date(now);
    validUntil.setMonth(validUntil.getMonth() + 5);
    return validUntil;
  }

  return null;
}

/**
 * POIC特典が初回かどうかを判定
 *
 * @param userId - ユーザーID
 * @param poicRewardId - POIC特典のID
 * @returns 初回の場合 true
 */
async function checkIfFirstTimePOIC(
  userId: string,
  poicRewardId: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('reward_exchanges')
    .select('id')
    .eq('user_id', userId)
    .eq('reward_id', poicRewardId)
    .limit(1);

  if (error) {
    console.error('❌ POIC初回判定エラー:', error);
    return true; // エラー時は初回として扱う
  }

  return !data || data.length === 0;
}

/**
 * milestone_rewards テーブルから特典を取得
 *
 * @param rewardType - 特典タイプ
 * @returns 特典データ
 */
async function getMilestoneReward(rewardType: RewardType) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('milestone_rewards')
    .select('*')
    .eq('reward_type', rewardType)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error(`❌ milestone_rewards 取得エラー (${rewardType}):`, error);
    throw new Error(`Reward not found for type: ${rewardType}`);
  }

  return data;
}

/**
 * 特典を自動付与
 *
 * @param userId - ユーザーID
 * @param milestone - マイルストーン数
 * @param rewardType - 特典タイプ
 * @returns 作成された reward_exchange レコード
 */
export async function grantMilestoneReward(
  userId: string,
  milestone: number,
  rewardType: RewardType
) {
  const supabase = await createSupabaseServerClient();

  // 1. 特典タイプに応じてマスターデータを取得
  const reward = await getMilestoneReward(rewardType);

  if (!reward) {
    throw new Error(`Reward not found for type: ${rewardType}`);
  }

  // 2. 初回判定（POIC用）
  let isFirstTime = false;
  if (rewardType === RewardType.POIC) {
    isFirstTime = await checkIfFirstTimePOIC(userId, reward.id);
  }

  // 3. 有効期限計算
  const validUntil = calculateValidUntil(rewardType);

  // 4. 特典付与レコード作成
  const { data: exchange, error } = await supabase
    .from('reward_exchanges')
    .insert({
      user_id: userId,
      reward_id: reward.id,
      milestone_reached: milestone,
      status: 'available', // ✅ 修正: 'pending' → 'available'（この特典と交換する状態）
      valid_until: validUntil?.toISOString(),
      is_first_time: isFirstTime,
      is_milestone_based: true,
      stamp_count_used: milestone, // 参考値
      notes: `${milestone}スタンプ到達で自動付与（${rewardType}）`,
      exchanged_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('❌ reward_exchanges 作成エラー:', error);
    throw new Error(`Failed to grant reward: ${error.message}`);
  }

  console.log(`✅ マイルストーン特典付与成功: ${userId}, ${milestone}, ${rewardType}`);

  // 5. マイルストーン履歴に記録
  const { error: historyError } = await supabase
    .from('milestone_history')
    .insert({
      user_id: userId,
      milestone: milestone,
      reward_exchange_id: exchange?.id,
      reached_at: new Date().toISOString()
    });

  if (historyError) {
    console.error('⚠️ milestone_history 記録エラー:', historyError);
    // エラーでも特典付与は成功しているので続行
  }

  return exchange;
}

/**
 * スタンプ減少時のマイルストーン特典無効化
 *
 * スタンプ数が減少した際、該当するマイルストーン特典を無効化する
 *
 * ⚠️ 管理ダッシュボード専用: SERVICE_ROLE_KEYを使用してRLSをバイパス
 *
 * @param userId - ユーザーID
 * @param oldStampCount - 変更前のスタンプ数
 * @param newStampCount - 変更後のスタンプ数
 * @returns 無効化された特典の配列
 */
export async function invalidateMilestoneRewards(
  userId: string,
  oldStampCount: number,
  newStampCount: number
) {
  // スタンプが減少していない場合は何もしない
  if (newStampCount >= oldStampCount) {
    return [];
  }

  // ✅ 修正: AdminClient を使用（026マイグレーション後はANON_KEYでUPDATEできない）
  const { createSupabaseAdminClient } = await import('@/lib/supabase/server-admin');
  const supabase = createSupabaseAdminClient();

  // 新しいスタンプ数を超えるマイルストーン特典を取得
  const { data: rewards, error: fetchError } = await supabase
    .from('reward_exchanges')
    .select('*')
    .eq('user_id', userId)
    .eq('is_milestone_based', true)
    .gt('milestone_reached', newStampCount)
    .in('status', ['available', 'pending']); // 未使用の特典のみ

  if (fetchError) {
    console.error('❌ マイルストーン特典取得エラー:', fetchError);
    throw new Error(`Failed to fetch milestone rewards: ${fetchError.message}`);
  }

  if (!rewards || rewards.length === 0) {
    console.log(`ℹ️ 無効化対象のマイルストーン特典なし: ${oldStampCount} → ${newStampCount}`);
    return [];
  }

  console.log(`🔄 ${rewards.length}件のマイルストーン特典を無効化します`);

  // 各特典を 'cancelled' ステータスに変更
  const cancelledRewards = [];

  for (const reward of rewards) {
    try {
      const { error: updateError } = await supabase
        .from('reward_exchanges')
        .update({
          status: 'cancelled',
          notes: `${reward.notes || ''}\n【自動キャンセル】スタンプ数が ${oldStampCount} から ${newStampCount} に減少したため無効化`
        })
        .eq('id', reward.id);

      if (updateError) {
        console.error(`❌ 特典無効化エラー (ID: ${reward.id}):`, updateError);
      } else {
        console.log(`✅ 特典無効化成功: マイルストーン ${reward.milestone_reached}`);
        cancelledRewards.push(reward);
      }
    } catch (error) {
      console.error(`❌ 特典無効化処理エラー (ID: ${reward.id}):`, error);
      // エラーでも続行（他の特典は処理する）
    }
  }

  console.log(`✅ マイルストーン特典無効化完了: ${cancelledRewards.length}件`);

  return cancelledRewards;
}

/**
 * スタンプ付与時の処理フロー全体
 *
 * スタンプ付与APIから呼び出される
 *
 * @param userId - ユーザーID
 * @param oldStampCount - 変更前のスタンプ数
 * @param newStampCount - 変更後のスタンプ数
 * @returns 付与された特典の配列
 */
export async function handleStampMilestones(
  userId: string,
  oldStampCount: number,
  newStampCount: number
) {
  // 1. マイルストーンを判定
  const milestones = checkMilestones(oldStampCount, newStampCount);

  if (milestones.length === 0) {
    console.log(`ℹ️ マイルストーン到達なし: ${oldStampCount} → ${newStampCount}`);
    return [];
  }

  console.log(`🎯 マイルストーン到達: ${milestones.length}件`, milestones);

  // 2. 各マイルストーンに対して特典を付与
  const grantedRewards = [];

  for (const { milestone, rewardType } of milestones) {
    try {
      const exchange = await grantMilestoneReward(userId, milestone, rewardType);
      grantedRewards.push({
        milestone,
        rewardType,
        exchange
      });
    } catch (error) {
      console.error(`❌ マイルストーン特典付与エラー (${milestone}, ${rewardType}):`, error);
      // エラーでも続行（他のマイルストーンは処理する）
    }
  }

  console.log(`✅ マイルストーン処理完了: ${grantedRewards.length}件付与`);

  return grantedRewards;
}
