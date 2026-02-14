/**
 * 次回来院メモ機能のユーティリティ関数
 */

/**
 * 日付文字列を「YYYY年MM月DD日」形式に変換
 * タイムゾーンの影響を受けないよう、文字列分割を使用
 *
 * @param dateString - YYYY-MM-DD 形式の日付文字列
 * @returns 「YYYY年MM月DD日」形式の文字列、または null
 *
 * @example
 * formatVisitDate("2026-04-13") // => "2026年4月13日"
 * formatVisitDate(null) // => null
 */
export function formatVisitDate(dateString: string | null): string | null {
  if (!dateString) return null;

  const [year, month, day] = dateString.split('-').map(Number);
  return `${year}年${month}月${day}日`;
}

/**
 * 指定日が過去かどうかを判定
 *
 * @param dateString - YYYY-MM-DD 形式の日付文字列
 * @returns 過去の日付であれば true
 *
 * @example
 * isPastDate("2026-01-01") // => true (今日が2026-02-14の場合)
 * isPastDate("2026-03-01") // => false
 */
export function isPastDate(dateString: string | null): boolean {
  if (!dateString) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateString + 'T00:00:00');
  return target < today;
}

/**
 * 次回メモが200文字以内かを判定
 *
 * @param memo - メモテキスト
 * @returns 200文字以内であれば true
 *
 * @example
 * isValidMemoLength("テスト") // => true
 * isValidMemoLength("あ".repeat(201)) // => false
 */
export function isValidMemoLength(memo: string | null): boolean {
  if (!memo) return true;
  return memo.length <= 200;
}
