/**
 * 管理ダッシュボード ナビゲーション設定
 * 分析は将来サブメニュー化する想定で items を配列にしておく。
 */

export type NavItem = {
  label: string;
  href: string;
  badge?: string; // バッジテキスト（「開発中」など）
};

/** プライマリ（主要業務）: 日常的によく使う機能 */
export const primaryNav: NavItem[] = [
  { label: "患者一覧", href: "/admin" },
  { label: "一斉配信", href: "/admin/broadcast" },
  { label: "特典交換", href: "/admin/reward-exchanges" },
];

/** セカンダリ（分析・設定）: 定期的に確認する機能 */
export const secondaryNav: NavItem[] = [
  { label: "アンケート", href: "/admin/surveys", badge: "開発中" },
  { label: "分析", href: "/admin/analysis", badge: "開発中" },
  // 将来: 分析をドロップダウンにする場合はここにサブ項目を追加
  // { label: "利用状況", href: "/admin/analysis" },
  // { label: "イベント分析", href: "/admin/analysis/events" },
];

/** 後方互換のため mainNav を残す（primaryNav + secondaryNav の結合） */
export const mainNav: NavItem[] = [...primaryNav, ...secondaryNav];

/** ツール */
export const toolNav: NavItem[] = [
  { label: "テストQR", href: "/admin/qr" },
  { label: "スタッフ一覧", href: "/admin/staff" },
];

/** ログ（ドロップダウン用） */
export const logNav: NavItem[] = [
  { label: "スタッフ操作ログ", href: "/admin/activity-logs" },
  { label: "ユーザログ", href: "/admin/user-logs" },
];

/** アカウント系（パスワード変更はリンク、ログアウトは form で別扱い） */
export const accountNav: NavItem[] = [
  { label: "パスワード変更", href: "/admin/change-password" },
];

/** パスがログ系か */
export function isLogPath(pathname: string): boolean {
  return pathname.startsWith("/admin/activity-logs") || pathname.startsWith("/admin/user-logs");
}

/** 指定 href が現在パスでアクティブか（メイン・ツール用） */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname === href || pathname.startsWith(href + "/");
}
