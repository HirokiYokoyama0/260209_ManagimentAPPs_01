"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoginPage = pathname === "/admin/login";
  const isAnalysis = pathname.startsWith("/admin/analysis");
  const isBroadcast = pathname.startsWith("/admin/broadcast");
  const isRewardExchanges = pathname.startsWith("/admin/reward-exchanges");

  return (
    <>
    <header className="border-b border-slate-200 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 text-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-full bg-white shadow-sm overflow-hidden flex-shrink-0">
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
                  !isAnalysis && !isBroadcast && !isRewardExchanges
                    ? "bg-white/20 text-white shadow-sm"
                    : "bg-white/5 text-sky-50/80 hover:bg-white/10"
                }`}
              >
                患者一覧
                {!isAnalysis && !isBroadcast && !isRewardExchanges && <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />}
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
            </nav>
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
          <nav className="container px-4 py-3 space-y-1">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                !isAnalysis && !isBroadcast && !isRewardExchanges
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
          </nav>
        </div>
      )}
    </header>
    </>
  );
}
