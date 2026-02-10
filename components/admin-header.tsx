"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminHeader() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const isAnalysis = pathname.startsWith("/admin/analysis");

  return (
    <header className="border-b border-slate-200 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 text-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold shadow-sm">
            TW
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-wide">
              つくばホワイト歯科 管理ダッシュボード
            </span>
            {!isLoginPage && (
              <span className="text-[11px] text-sky-50/90">
                患者一覧・スタンプ・メッセージをまとめて管理
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        {!isLoginPage && (
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-3 text-sm">
              <Link
                href="/admin"
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                  !isAnalysis
                    ? "bg-white/20 text-white shadow-sm"
                    : "bg-white/5 text-sky-50/80 hover:bg-white/10"
                }`}
              >
                患者一覧
                {!isAnalysis && <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />}
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
        )}
      </div>
    </header>
  );
}
