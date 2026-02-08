"use client";

import { usePathname } from "next/navigation";

export function AdminHeader() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  return (
    <header className="border-b bg-card">
      <div className="container flex h-14 items-center justify-between px-4">
        <span className="font-semibold">つくばホワイト歯科 管理</span>
        {!isLoginPage && (
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ログアウト
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
