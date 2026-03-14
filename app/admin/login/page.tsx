"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginSecret } from "@/app/admin/LoginSecretContext";
import { getOrCreateDeviceId } from "@/lib/device-id";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") === "invalid";
  const signupSuccess = searchParams.get("signup") === "success";
  const signupError = searchParams.get("signup") === "error";
  const loginSecret = useLoginSecret();
  const signupRevealed = loginSecret?.signupRevealed ?? false;
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // クライアントサイドでのみデバイスIDを取得
  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  // ログインフォーム送信処理
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          deviceId, // デバイスIDを送信
        }),
      });

      if (response.redirected) {
        window.location.href = response.url;
      } else if (response.ok) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/admin/login?error=invalid';
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      window.location.href = '/admin/login?error=invalid';
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-6">
        <h1 className="text-xl font-semibold">管理者ログイン</h1>
        <form onSubmit={handleLoginSubmit} className="space-y-4">
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
          {signupSuccess && (
            <p className="text-sm text-green-600">
              登録しました。下のログインで入ってください。
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </Button>
        </form>

        {signupRevealed && (
          <>
            <hr className="border-slate-200" />
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-slate-600">
                スタッフ登録（初回のみ）
              </h2>
              <form
                action="/api/auth/signup"
                method="post"
                className="space-y-4"
                onSubmit={() => setSignupSubmitting(true)}
              >
                <div className="space-y-2">
                  <Label htmlFor="signup_login_id">ログインID</Label>
                  <Input
                    id="signup_login_id"
                    name="login_id"
                    type="text"
                    autoComplete="username"
                    required
                    minLength={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup_password">パスワード</Label>
                  <Input
                    id="signup_password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup_display_name">表示名（任意）</Label>
                  <Input
                    id="signup_display_name"
                    name="display_name"
                    type="text"
                    autoComplete="name"
                  />
                </div>
                {signupError && (
                  <p className="text-sm text-destructive">
                    登録に失敗しました（既にスタッフがいる場合は登録できません）。
                  </p>
                )}
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={signupSubmitting}
                >
                  {signupSubmitting ? "登録中..." : "登録する"}
                </Button>
              </form>
            </div>
          </>
        )}
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
