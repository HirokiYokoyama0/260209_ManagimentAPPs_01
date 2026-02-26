"use client";

import { use } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ResultRow = {
  user_id: string;
  display_name: string | null;
  q1_rating: number | null;
  q2_comment: string | null;
  q3_recommend: number | null;
  created_at: string;
};

type ResultsResponse = {
  q1Distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  nps: number;
  comments: { q2_comment: string | null; created_at: string; user_id: string }[];
  list?: ResultRow[];
};

export default function SurveyResultsPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = use(params);
  const { data, error, isLoading } = useSWR<ResultsResponse>(
    `/api/surveys/results?surveyId=${encodeURIComponent(surveyId)}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-8">
        <p className="text-destructive">結果の取得に失敗しました。</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={`/admin/surveys/${surveyId}`}>詳細へ</Link>
        </Button>
      </div>
    );
  }

  const dist = data?.q1Distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const maxQ1 = Math.max(1, ...Object.values(dist));
  const nps = data?.nps ?? 0;
  const comments = data?.comments ?? [];
  const resultsList = data?.list ?? [];

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/surveys/${surveyId}`} className="inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            アンケート詳細へ
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold flex items-center gap-2">
        <BarChart3 className="h-8 w-8" />
        結果集計
      </h1>
      <p className="mt-1 text-muted-foreground font-mono text-sm">{surveyId}</p>

      <div className="mt-8 space-y-8">
        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Q1. 満足度評価（1〜5）</h2>
          <div className="space-y-2">
            {([5, 4, 3, 2, 1] as const).map((rating) => (
              <div key={rating} className="flex items-center gap-4">
                <span className="w-8 text-muted-foreground">{rating}</span>
                <div className="flex-1 h-8 bg-muted rounded overflow-hidden flex">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{
                      width: `${maxQ1 ? (dist[rating] / maxQ1) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-12 text-sm">{dist[rating]}件</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-2">NPS（推奨度 0〜10）</h2>
          <p className="text-3xl font-bold text-primary">{nps}</p>
          <p className="text-sm text-muted-foreground mt-1">
            推奨者（9-10点）の割合 − 批判者（0-6点）の割合
          </p>
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Q2. 自由記述</h2>
          {comments.length === 0 ? (
            <p className="text-muted-foreground">まだありません</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c, i) => (
                <li key={i} className="rounded-md bg-muted/50 p-3 text-sm">
                  <p className="whitespace-pre-wrap">{c.q2_comment}</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {new Date(c.created_at).toLocaleString("ja-JP")} (user_id: {c.user_id})
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">結果一覧（回答者ごと）</h2>
          {resultsList.length === 0 ? (
            <p className="text-muted-foreground">まだ回答はありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">回答日時</th>
                    <th className="text-left p-3 font-medium">ユーザー</th>
                    <th className="text-left p-3 font-medium">Q1 満足度</th>
                    <th className="text-left p-3 font-medium">Q3 推奨度(NPS)</th>
                    <th className="text-left p-3 font-medium">Q2 自由記述</th>
                  </tr>
                </thead>
                <tbody>
                  {resultsList.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString("ja-JP")}
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{row.display_name || "—"}</span>
                        <span className="ml-1 text-muted-foreground font-mono text-xs">{row.user_id}</span>
                      </td>
                      <td className="p-3">{row.q1_rating != null ? `${row.q1_rating}` : "—"}</td>
                      <td className="p-3">{row.q3_recommend != null ? `${row.q3_recommend}` : "—"}</td>
                      <td className="p-3 max-w-[240px] text-muted-foreground">
                        {row.q2_comment ? (
                          <span className="line-clamp-2" title={row.q2_comment}>
                            {row.q2_comment}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
