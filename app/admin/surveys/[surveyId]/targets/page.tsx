"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, Loader2, Users, Send, X, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Candidate = {
  id: string;
  ticket_number: string | null;
  real_name: string | null;
  display_name: string | null;
};

type TargetRow = {
  id: string;
  survey_id: string;
  user_id: string;
  survey_title: string;
  real_name: string | null;
  display_name: string | null;
  show_on_liff_open: boolean;
  answered_at: string | null;
  status: string;
  postponed_count: number;
  created_at: string;
};

type ListResponse = {
  targets: TargetRow[];
  stats: {
    totalCount: number;
    answeredCount: number;
    unansweredCount: number;
    answerRate: number;
  };
};

export default function SurveyTargetsPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = use(params);
  const [targetType, setTargetType] = useState<"all" | "filter" | "manual">("all");
  const [showOnLiffOpen, setShowOnLiffOpen] = useState(true);
  const [lastVisitDays, setLastVisitDays] = useState("");
  const [minStamps, setMinStamps] = useState("");
  const [ticketInput, setTicketInput] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

  const fetchCandidates = useCallback(async (ticket: string) => {
    if (!ticket.trim()) {
      setCandidates([]);
      return;
    }
    setCandidatesLoading(true);
    try {
      const res = await fetch(
        `/api/surveys/targets/candidates?ticket=${encodeURIComponent(ticket)}`
      );
      const data = await res.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch {
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = ticketInput.trim();
    if (!t) {
      setCandidates([]);
      return;
    }
    const timer = window.setTimeout(() => fetchCandidates(t), 300);
    return () => clearTimeout(timer);
  }, [ticketInput, fetchCandidates]);

  const addCandidate = (c: Candidate) => {
    if (selectedCandidates.some((s) => s.id === c.id)) return;
    setSelectedCandidates((prev) => [...prev, c]);
    setTicketInput("");
    setCandidates([]);
  };

  const removeCandidate = (id: string) => {
    setSelectedCandidates((prev) => prev.filter((s) => s.id !== id));
  };

  const handleResetAnswer = async (userId: string) => {
    if (!confirm("この対象者を「未回答」に戻します。回答データは削除されます。よろしいですか？")) return;
    setResettingUserId(userId);
    try {
      const res = await fetch("/api/surveys/targets/reset-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyId, userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "未回答に戻せませんでした");
        return;
      }
      mutate();
    } catch (e) {
      console.error(e);
      alert("未回答に戻せませんでした");
    } finally {
      setResettingUserId(null);
    }
  };

  const { data, error, isLoading, mutate } = useSWR<ListResponse>(
    `/api/surveys/targets/list?surveyId=${encodeURIComponent(surveyId)}`,
    fetcher
  );

  const handleCreateTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        surveyId,
        targetType,
        showOnLiffOpen,
      };
      if (targetType === "filter") {
        body.filterConditions = {};
        if (lastVisitDays) body.filterConditions.lastVisitDays = Number(lastVisitDays);
        if (minStamps) body.filterConditions.minStamps = Number(minStamps);
      }
      if (targetType === "manual") {
        body.manualUserIds = selectedCandidates.map((c) => c.id);
        if ((body.manualUserIds as string[]).length === 0) {
          alert("個別選択の場合は診察券番号で検索し、候補から1人以上選んでください");
          setIsSubmitting(false);
          return;
        }
      }

      const res = await fetch("/api/surveys/targets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error ?? "登録に失敗しました");
        return;
      }
      alert(`${result.targetCount}人を配信対象に登録しました`);
      mutate();
    } catch (e) {
      console.error(e);
      alert("登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const targets = data?.targets ?? [];
  const stats = data?.stats;

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/surveys/${surveyId}`} className="inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            アンケート詳細へ
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Users className="h-8 w-8" />
        配信対象者
      </h1>
      <p className="mt-1 text-muted-foreground font-mono text-sm">{surveyId}</p>

      {/* 配信対象者を追加 */}
      <div className="mt-8 rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">配信対象者を追加</h2>
        <form onSubmit={handleCreateTargets} className="space-y-4">
          <div>
            <Label>配信方法</Label>
            <div className="mt-2 flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="targetType"
                  checked={targetType === "all"}
                  onChange={() => setTargetType("all")}
                />
                全員
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="targetType"
                  checked={targetType === "filter"}
                  onChange={() => setTargetType("filter")}
                />
                条件で絞る
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="targetType"
                  checked={targetType === "manual"}
                  onChange={() => setTargetType("manual")}
                />
                個別選択
              </label>
            </div>
          </div>
          {targetType === "filter" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>最終来院日（○日以内）</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="例: 30"
                  value={lastVisitDays}
                  onChange={(e) => setLastVisitDays(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>スタンプ数（○個以上）</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="例: 5"
                  value={minStamps}
                  onChange={(e) => setMinStamps(e.target.value)}
                />
              </div>
            </div>
          )}
          {targetType === "manual" && (
            <div className="space-y-2">
              <Label>診察券番号で検索</Label>
              <Input
                type="text"
                placeholder="診察券番号を入力すると候補が表示されます"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                className="max-w-md"
              />
              {candidatesLoading && (
                <p className="text-sm text-muted-foreground">検索中…</p>
              )}
              {!candidatesLoading && ticketInput.trim() && candidates.length > 0 && (
                <ul className="max-w-md rounded-md border bg-card py-1 shadow-sm">
                  {candidates.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => addCandidate(c)}
                      >
                        <span className="font-medium">
                          {c.real_name ?? c.display_name ?? "—"}
                        </span>
                        {c.ticket_number && (
                          <span className="ml-2 text-muted-foreground">
                            （診察券: {c.ticket_number}）
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!candidatesLoading && ticketInput.trim() && candidates.length === 0 && (
                <p className="text-sm text-muted-foreground">該当する患者がいません</p>
              )}
              {selectedCandidates.length > 0 && (
                <div className="space-y-2">
                  <Label>選択した対象者（{selectedCandidates.length}人）</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidates.map((c) => (
                      <Badge
                        key={c.id}
                        variant="secondary"
                        className="flex items-center gap-1 py-1.5 pl-2 pr-1"
                      >
                        {c.real_name ?? c.display_name ?? c.ticket_number ?? c.id.slice(0, 8)}
                        {c.ticket_number && (
                          <span className="text-muted-foreground font-normal">
                            （{c.ticket_number}）
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label="削除"
                          className="rounded p-0.5 hover:bg-muted-foreground/20"
                          onClick={() => removeCandidate(c.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showOnLiffOpen"
              checked={showOnLiffOpen}
              onChange={(e) => setShowOnLiffOpen(e.target.checked)}
            />
            <Label htmlFor="showOnLiffOpen">LIFFアプリ起動時にモーダル表示する</Label>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登録中…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                配信対象者を登録
              </>
            )}
          </Button>
        </form>
      </div>

      {/* 一覧・回答率 */}
      <div className="mt-8 rounded-lg border">
        {stats && (
          <div className="border-b px-6 py-4 flex flex-wrap gap-4">
            <span>対象者: <strong>{stats.totalCount}</strong>人</span>
            <span>回答済み: <strong>{stats.answeredCount}</strong>人</span>
            <span>未回答: <strong>{stats.unansweredCount}</strong>人</span>
            <span>回答率: <strong>{stats.answerRate}%</strong></span>
          </div>
        )}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <p className="p-6 text-destructive">一覧の取得に失敗しました。</p>
        )}
        {!isLoading && !error && targets.length === 0 && (
          <p className="p-6 text-muted-foreground">まだ配信対象者が登録されていません。上記フォームで追加してください。</p>
        )}
        {!isLoading && !error && targets.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>表示名 / 本名</TableHead>
                <TableHead>LIFF表示</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>後回し</TableHead>
                <TableHead>登録日時</TableHead>
                <TableHead className="w-[120px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <span className="font-medium">{t.display_name ?? t.real_name ?? "—"}</span>
                    {(t.real_name || t.display_name) && (
                      <span className="ml-2 text-muted-foreground text-sm">
                        {t.real_name && t.display_name ? `（${t.real_name}）` : ""}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{t.show_on_liff_open ? "ON" : "OFF"}</TableCell>
                  <TableCell>
                    {t.status === "回答済み" ? (
                      <Badge>回答済み</Badge>
                    ) : (
                      <Badge variant="secondary">未回答</Badge>
                    )}
                  </TableCell>
                  <TableCell>{t.postponed_count}回</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(t.created_at).toLocaleString("ja-JP")}
                  </TableCell>
                  <TableCell>
                    {t.status === "回答済み" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        disabled={resettingUserId === t.user_id}
                        onClick={() => handleResetAnswer(t.user_id)}
                      >
                        {resettingUserId === t.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Undo2 className="mr-1 h-4 w-4" />
                            未回答に戻す
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
