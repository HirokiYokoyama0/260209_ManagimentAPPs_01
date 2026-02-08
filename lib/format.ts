/**
 * ISO 日時文字列を JST でフォーマット
 */
export function formatJst(isoString: string): string {
  const d = new Date(isoString);
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
