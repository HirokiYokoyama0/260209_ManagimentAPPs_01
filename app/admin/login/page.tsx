"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") === "invalid";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-6">
        <h1 className="text-xl font-semibold">管理者ログイン</h1>
        <form action="/api/auth/login" method="post" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">ログイン</Label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">
              ログインまたはパスワードが正しくありません。
            </p>
          )}
          <Button type="submit" className="w-full">
            ログイン
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center p-4">読み込み中...</div>}>
      <LoginForm />
    </Suspense>
  );
}
