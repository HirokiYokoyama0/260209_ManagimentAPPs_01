"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== newPasswordConfirm) {
      setError("新しいパスワードと確認が一致しません。");
      return;
    }
    if (newPassword.length < 6) {
      setError("新しいパスワードは6文字以上にしてください。");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "パスワードの変更に失敗しました。");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setTimeout(() => router.push("/admin"), 2000);
    } catch {
      setError("エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-xl font-semibold">パスワードの変更</h1>
      <p className="text-sm text-slate-600">
        現在のパスワードを入力し、新しいパスワードを設定してください。
      </p>

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          パスワードを変更しました。管理画面に戻ります。
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current_password">現在のパスワード</Label>
          <Input
            id="current_password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={submitting || success}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new_password">新しいパスワード（6文字以上）</Label>
          <Input
            id="new_password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            disabled={submitting || success}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new_password_confirm">新しいパスワード（確認）</Label>
          <Input
            id="new_password_confirm"
            type="password"
            autoComplete="new-password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            required
            minLength={6}
            disabled={submitting || success}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button type="submit" disabled={submitting || success}>
          {submitting ? "変更中..." : "パスワードを変更する"}
        </Button>
      </form>
    </div>
  );
}
