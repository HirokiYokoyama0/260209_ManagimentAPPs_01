"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoginSecret } from "@/app/admin/LoginSecretContext";

type StaffInfo = { display_name: string | null; login_id: string };

export function AdminHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffInfo | null>(null);
  const loginSecret = useLoginSecret();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { staff: StaffInfo | null }) => {
        if (data.staff) setCurrentStaff(data.staff);
      })
      .catch(() => {});
  }, [isLoginPage]);
  const isAnalysis = pathname.startsWith("/admin/analysis");
  const isBroadcast = pathname.startsWith("/admin/broadcast");
  const isRewardExchanges = pathname.startsWith("/admin/reward-exchanges");
  const isQr = pathname.startsWith("/admin/qr");
  const isActivityLogs = pathname.startsWith("/admin/activity-logs");
  const isUserLogs = pathname.startsWith("/admin/user-logs");

  return (
    <>
    <header className="border-b border-slate-200 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 text-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-2 md:gap-3">
          <div
            role={isLoginPage ? "button" : undefined}
            tabIndex={isLoginPage ? 0 : undefined}
            onClick={isLoginPage ? () => loginSecret?.revealSignup() : undefined}
            onKeyDown={
              isLoginPage
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") loginSecret?.revealSignup();
                  }
                : undefined
            }
            className={`relative h-10 w-10 md:h-12 md:w-12 rounded-full bg-white shadow-sm overflow-hidden flex-shrink-0 ${isLoginPage ? "cursor-pointer hover:ring-2 hover:ring-white/50 focus:outline-none focus:ring-2 focus:ring-white" : ""}`}
          >
            <Image
              src="/images/haburashiika-icon.png"
              alt="ハブラシーカ"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            {/* PCではフルタイトル、スマホでは短縮 */}
            <span className="hidden md:block text-sm font-semibold tracking-wide">
              つくばホワイト歯科 管理ダッシュボード
            </span>
            <span className="block md:hidden text-xs font-semibold tracking-wide">
              つくばホワイト歯科
            </span>
            {/* 説明文はPCのみ表示 */}
            {!isLoginPage && (
              <span className="hidden md:block text-[11px] text-sky-50/90">
                患者一覧・スタンプ・メッセージ・一斉配信・特典交換をまとめて管理
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        {!isLoginPage && (
          <div className="flex items-center gap-2">
            {/* ハンバーガーメニューボタン（スマホのみ） */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/30 bg-white/10 h-11 w-11 rounded-lg shadow-sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>

            {/* PC用ナビゲーション */}
            <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-3 text-sm">
              <Link
                href="/admin"
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                  !isAnalysis && !isBroadcast && !isRewardExchanges && !isQr && !isActivityLogs && !isUserLogs
                    ? "bg-white/20 text-white shadow-sm"
                    : "bg-white/5 text-sky-50/80 hover:bg-white/10"
                }`}
              >
                患者一覧
                {!isAnalysis && !isBroadcast && !isRewardExchanges && !isQr && !isActivityLogs && !isUserLogs && <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />}
              </Link>
              <Link
                href="/admin/analysis"
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                  isAnalysis
                    ? "bg-white/20 text-white shadow-sm"
                    : "bg-white/5 text-sky-50/80 hover:bg-white/10"
                }`}
              >
                分析
              </Link>
              <Link
                href="/admin/broadcast"
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                  isBroadcast
                    ? "bg-white/20 text-white shadow-sm"
                    : "bg-white/5 text-sky-50/80 hover:bg-white/10"
                }`}
              >
                一斉配信
              </Link>
              <Link
                href="/admin/reward-exchanges"
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                  isRewardExchanges
                    ? "bg-white/20 text-white shadow-sm"
                    : "bg-white/5 text-sky-50/80 hover:bg-white/10"
                }`}
              >
                特典交換
              </Link>
              <Link
                href="/admin/qr"
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                  isQr
                    ? "bg-white/20 text-white shadow-sm"
                    : "bg-white/5 text-sky-50/80 hover:bg-white/10"
                }`}
              >
                テストQR
              </Link>
              <Link
                href="/admin/activity-logs"
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                  isActivityLogs
                    ? "bg-white/20 text-white shadow-sm"
                    : "bg-white/5 text-sky-50/80 hover:bg-white/10"
                }`}
              >
                スタッフ操作ログ
              </Link>
              <Link
                href="/admin/user-logs"
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                  isUserLogs
                    ? "bg-white/20 text-white shadow-sm"
                    : "bg-white/5 text-sky-50/80 hover:bg-white/10"
                }`}
              >
                ユーザログ
              </Link>
              <Link
                href="/admin/change-password"
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white/90 hover:bg-white/10"
              >
                パスワード変更
              </Link>
            </nav>
            {currentStaff && (
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/95">
                <User className="h-3.5 w-3.5" />
                {currentStaff.display_name || currentStaff.login_id} でログイン中
              </span>
            )}
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-white/20"
              >
                ログアウト
              </button>
            </form>
            </div>
          </div>
        )}
      </div>

      {/* スマホ用ドロップダウンメニュー */}
      {!isLoginPage && mobileMenuOpen && (
        <div className="md:hidden border-t border-white/20 bg-sky-600">
          {currentStaff && (
            <div className="container px-4 py-2 flex items-center gap-2 text-xs text-white/90 border-b border-white/10">
              <User className="h-4 w-4 flex-shrink-0" />
              <span>{currentStaff.display_name || currentStaff.login_id} でログイン中</span>
            </div>
          )}
          <nav className="container px-4 py-3 space-y-1">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                !isAnalysis && !isBroadcast && !isRewardExchanges && !isQr && !isActivityLogs && !isUserLogs
                  ? "bg-white/20 text-white"
                  : "text-sky-50 hover:bg-white/10"
              }`}
            >
              患者一覧
            </Link>
            <Link
              href="/admin/analysis"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isAnalysis
                  ? "bg-white/20 text-white"
                  : "text-sky-50 hover:bg-white/10"
              }`}
            >
              分析
            </Link>
            <Link
              href="/admin/broadcast"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isBroadcast
                  ? "bg-white/20 text-white"
                  : "text-sky-50 hover:bg-white/10"
              }`}
            >
              一斉配信
            </Link>
            <Link
              href="/admin/reward-exchanges"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isRewardExchanges
                  ? "bg-white/20 text-white"
                  : "text-sky-50 hover:bg-white/10"
              }`}
            >
              特典交換
            </Link>
            <Link
              href="/admin/qr"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isQr
                  ? "bg-white/20 text-white"
                  : "text-sky-50 hover:bg-white/10"
              }`}
            >
              テストQR
            </Link>
            <Link
              href="/admin/activity-logs"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isActivityLogs
                  ? "bg-white/20 text-white"
                  : "text-sky-50 hover:bg-white/10"
              }`}
            >
              スタッフ操作ログ
            </Link>
            <Link
              href="/admin/user-logs"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isUserLogs
                  ? "bg-white/20 text-white"
                  : "text-sky-50 hover:bg-white/10"
              }`}
            >
              ユーザログ
            </Link>
            <Link
              href="/admin/change-password"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-sky-50 hover:bg-white/10"
            >
              パスワード変更
            </Link>
          </nav>
        </div>
      )}
    </header>
    </>
  );
}
