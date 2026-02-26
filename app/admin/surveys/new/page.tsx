"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewSurveyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    id: "",
    title: "",
    description: "",
    reward_stamps: "3",
    is_active: "true",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id.trim() || !form.title.trim()) {
      alert("ID と タイトル は必須です");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id.trim(),
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          reward_stamps: Number(form.reward_stamps) || 3,
          is_active: form.is_active === "true",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "作成に失敗しました");
        return;
      }
      router.push(`/admin/surveys/${data.id}`);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/surveys" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            一覧へ
          </Link>
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-6">新規アンケート作成</h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6">
        <div className="space-y-2">
          <Label htmlFor="id">アンケートID（半角英数字・ハイフン・アンダースコア）</Label>
          <Input
            id="id"
            value={form.id}
            onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
            placeholder="例: satisfaction_2026Q1"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            作成後は変更できません。LIFF側のURLにも使われます。
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="例: ご利用満足度アンケート"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">説明文（任意）</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="回答者に表示する説明"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reward_stamps">報酬スタンプ（個）</Label>
          <Input
            id="reward_stamps"
            type="number"
            min={0}
            step={1}
            value={form.reward_stamps}
            onChange={(e) => setForm((f) => ({ ...f, reward_stamps: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            整数で入力（例: 3 → 3個）
          </p>
        </div>
        <div className="space-y-2">
          <Label>公開状態</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="is_active"
                value="true"
                checked={form.is_active === "true"}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value }))}
              />
              公開する
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="is_active"
                value="false"
                checked={form.is_active === "false"}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value }))}
              />
              非公開
            </label>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                作成中…
              </>
            ) : (
              "作成する"
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/surveys">キャンセル</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
