"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

const TEMPLATES = [
  "お疲れ様でした。",
  "次回予約は〇〇です。よろしくお願いします。",
  "検診のお知らせです。",
  "ご来院ありがとうございました。",
];

type Props = {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MessageSendSheet({ profile, open, onOpenChange }: Props) {
  const [template, setTemplate] = useState("");
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [linePushSent, setLinePushSent] = useState(false);

  const body = [template, freeText].filter(Boolean).join("\n\n");

  async function handleSend() {
    if (!body.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/${profile.id}/care-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "送信に失敗しました。");
        return;
      }
      const result = await res.json();
      setLinePushSent(result.line_push === "sent");
      setSent(true);
      setTemplate("");
      setFreeText("");
      setTimeout(() => {
        onOpenChange(false);
        setSent(false);
      }, 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>個別メッセージ送信</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 py-4 overflow-auto">
          <p className="text-sm text-muted-foreground">
            {profile.display_name || "—"} さんへ送信します。内容はケア記録に保存され、患者側の「ケア記録」タブでも確認できます。
          </p>
          <div className="space-y-2">
            <Label>定型文（任意）</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              <option value="">選択してください</option>
              {TEMPLATES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="free-text">自由入力</Label>
            <textarea
              id="free-text"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="追加のメッセージを入力..."
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
            />
          </div>
          {sent && (
            <p className="text-sm text-green-600">
              {linePushSent
                ? "送信しました。ケア記録に保存し、LINEにもプッシュしました。"
                : "送信しました。ケア記録に保存されています。（LINE は未設定または送信スキップ）"}
            </p>
          )}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSend} disabled={!body.trim() || loading}>
            {loading ? "送信中..." : "送信して記録に保存"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
