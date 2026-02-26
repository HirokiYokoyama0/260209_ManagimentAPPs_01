"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, Loader2, Users, BarChart3, Save, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Survey = {
  id: string;
  title: string;
  description: string | null;
  reward_stamps: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  showOnLiffOpen?: boolean;
};

export default function SurveyDetailPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = use(params);
  const { data: list, error, isLoading, mutate } = useSWR<Survey[]>(
    "/api/surveys",
    fetcher,
    { revalidateOnFocus: false }
  );

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showOnLiffOpen, setShowOnLiffOpen] = useState(false);
  const [savingSurvey, setSavingSurvey] = useState(false);
  const [savingLiff, setSavingLiff] = useState(false);

  const surveys = list ?? [];
  const current = surveys.find((s) => s.id === surveyId) ?? null;

  useEffect(() => {
    if (!current) return;
    setStartDate(current.start_date ? current.start_date.slice(0, 10) : "");
    setEndDate(current.end_date ? current.end_date.slice(0, 10) : "");
    setShowOnLiffOpen(current.showOnLiffOpen ?? false);
  }, [current?.id, current?.start_date, current?.end_date, current?.showOnLiffOpen]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSavePeriod = async () => {
    setSavingSurvey(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: startDate || null,
          end_date: endDate || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "更新に失敗しました");
        return;
      }
      mutate();
    } catch (e) {
      console.error(e);
      alert("更新に失敗しました");
    } finally {
      setSavingSurvey(false);
    }
  };

  const handleSaveLiff = async () => {
    setSavingLiff(true);
    try {
      const res = await fetch("/api/surveys/targets/update-liff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyId, showOnLiffOpen }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "更新に失敗しました");
        return;
      }
      mutate();
      if (data.updatedCount !== undefined) {
        alert(`${data.updatedCount}件の配信対象を更新しました`);
      }
    } catch (e) {
      console.error(e);
      alert("更新に失敗しました");
    } finally {
      setSavingLiff(false);
    }
  };

  if (error || !current) {
    return (
      <div className="container max-w-4xl py-8">
        <p className="text-destructive">アンケートの取得に失敗しました。</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/surveys">一覧へ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/surveys" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            一覧へ
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{current.title}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{current.id}</p>
          {current.is_active ? (
            <Badge className="mt-2">公開中</Badge>
          ) : (
            <Badge variant="secondary" className="mt-2">非公開</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/surveys/${surveyId}/targets`} className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              配信対象者
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/surveys/${surveyId}/results`} className="inline-flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              結果集計
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a
              href={`/api/surveys/${surveyId}/results/csv`}
              download
              className="inline-flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              CSV出力
            </a>
          </Button>
        </div>
      </div>

      {current.description && (
        <p className="mt-6 text-muted-foreground whitespace-pre-wrap">{current.description}</p>
      )}

      <dl className="mt-8 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">報酬スタンプ</dt>
          <dd>{current.reward_stamps}個</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">作成日時</dt>
          <dd>{new Date(current.created_at).toLocaleString("ja-JP")}</dd>
        </div>
      </dl>

      <section className="mt-10 rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">配信設定</h2>

        <div className="space-y-6">
          <div>
            <Label className="text-base">配信期間</Label>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="start_date" className="text-muted-foreground text-sm">開始日</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="end_date" className="text-muted-foreground text-sm">終了日</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <Button
                size="sm"
                disabled={savingSurvey}
                onClick={handleSavePeriod}
              >
                {savingSurvey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                保存
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-base">LIFFアプリ初期表示</Label>
            <p className="text-sm text-muted-foreground mt-1">
              配信対象者全員に対して、アプリ起動時にアンケートをモーダル表示するか
            </p>
            <div className="mt-2 flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="liff"
                  checked={showOnLiffOpen === true}
                  onChange={() => setShowOnLiffOpen(true)}
                />
                ON
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="liff"
                  checked={showOnLiffOpen === false}
                  onChange={() => setShowOnLiffOpen(false)}
                />
                OFF
              </label>
              <Button
                size="sm"
                variant="outline"
                disabled={savingLiff}
                onClick={handleSaveLiff}
              >
                {savingLiff ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                一括更新
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
