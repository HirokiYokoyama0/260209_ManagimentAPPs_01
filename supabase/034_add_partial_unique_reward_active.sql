-- =====================================
-- reward_exchanges: 有効特典の一意化（部分ユニークインデックス）＝D-fix
-- =====================================
-- 作成日: 2026-07-26
-- 目的: 同一 (user_id, reward_id, milestone_reached) に「有効な特典」を2行作れないようにする。
--   有効 = status IN ('available','pending','completed')。cancelled/expired は対象外
--   （＝Phase Cの論理削除(cancelled)と両立。フルUNIQUEは cancelled+completed が残ると作成失敗するため不可）。
-- 前提（順序厳守 B→C→D-fix）:
--   B: LIFF update-not-insert(033適用済) ＋ ダッシュボード存在チェック/兄弟cancel が本番稼働。
--   C: 既存重複クリーンアップ完了（有効重複タプル=0 を確認済み：2026-07-26）。
--
-- ⚠️ 実行上の注意:
--   1) CREATE INDEX CONCURRENTLY は「トランザクション内で実行不可」。
--      → SQL Editor では【この CREATE 文だけを単独で】実行すること（BEGIN/他文と混ぜない）。
--         "cannot run inside a transaction block" が出る場合は psql（Connect の接続文字列）で実行。
--   2) オフピークに実行（CONCURRENTLYはロックを避けるが念のため）。
--   3) 失敗すると INVALID なインデックスが残ることがある → 下記④で確認し、必要なら DROP して再実行。
-- =====================================

-- ① 事前チェック: 有効重複が0であること（0以外なら D-fix を実行しない）
SELECT user_id, reward_id, milestone_reached, count(*) AS active_rows
FROM reward_exchanges
WHERE status IN ('available','pending','completed')
GROUP BY user_id, reward_id, milestone_reached
HAVING count(*) > 1;
-- ↑ 0行であることを確認してから ② へ

-- ② 本体（★この1文だけを単独実行）
CREATE UNIQUE INDEX CONCURRENTLY uq_reward_active
  ON reward_exchanges (user_id, reward_id, milestone_reached)
  WHERE status IN ('available','pending','completed');

-- ③ 事後確認: インデックスが有効(valid)で存在するか
SELECT i.relname AS index_name, idx.indisvalid AS is_valid, idx.indisready AS is_ready
FROM pg_class i
JOIN pg_index idx ON idx.indexrelid = i.oid
WHERE i.relname = 'uq_reward_active';
-- is_valid = true / is_ready = true であること

-- ④ 失敗時の後始末（INVALIDなインデックスが残った場合のみ）:
-- DROP INDEX CONCURRENTLY IF EXISTS uq_reward_active;
-- → 重複を再確認(①)して 0 にしてから ② を再実行。

-- =====================================
-- 適用後の効果
-- =====================================
-- 同一マイルストーンに available/pending/completed を2行作ろうとすると 23505(unique_violation) で拒否。
-- LIFFの exchange は update-not-insert(既存availableをUPDATE)なので有効行は増えず、施錠と両立。
-- grantMilestoneReward は存在チェック＋23505キャッチ済みで、施錠後もエラーで落ちない。
-- ⚠️ 033ポリシー（anon available→pending UPDATE許可）は必須。絶対にDROPしないこと。
-- =====================================
