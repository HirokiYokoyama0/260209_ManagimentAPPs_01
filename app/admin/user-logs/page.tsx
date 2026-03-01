"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Users, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type EventLogItem = {
  id: string;
  user_id: string | null;
  event_name: string;
  source: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profile?: {
    display_name: string | null;
    real_name: string | null;
    ticket_number: string | null;
  } | null;
};

const EVENT_LABELS: Record<string, string> = {
  app_open: "アプリ起動",
  page_view: "ページ閲覧",
  session_start: "セッション開始",
  session_end: "セッション終了",
  stamp_page_view: "スタンプページ閲覧",
  stamp_scan_start: "QRスキャン開始",
  stamp_scan_success: "QRスキャン成功",
  stamp_scan_fail: "QRスキャン失敗",
  stamp_history_view: "スタンプ履歴閲覧",
  home_page_view: "診察券ページ閲覧",
  reward_list_view: "特典一覧閲覧",
  reward_detail_view: "特典詳細閲覧",
  reward_exchange_start: "特典交換開始",
  reward_exchange_success: "特典交換成功",
  reservation_button_click: "予約ボタンクリック",
  reservation_external_link: "外部予約サイトへ遷移",
  slot_game_open: "スロットゲーム開く",
  slot_game_play: "スロットゲームプレイ",
  slot_game_win: "スロットゲーム当たり",
  slot_game_lose: "スロットゲーム外れ",
  family_join_start: "家族参加開始",
  family_join_success: "家族参加成功",
  child_mode_open: "子供モード開く",
  child_mode_switch: "子供画面切替",
  error_occurred: "エラー発生",
  api_call_failed: "API呼び出し失敗",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function userDisplayName(log: EventLogItem): string {
  const p = log.profile;
  if (!p) return log.user_id ? `${String(log.user_id).slice(0, 12)}…` : "—";
  return p.display_name || p.real_name || p.ticket_number || String(log.user_id ?? "").slice(0, 12) + "…" || "—";
}

function formatMetadata(meta: Record<string, unknown> | null): string {
  if (!meta || Object.keys(meta).length === 0) return "—";
  const parts: string[] = [];
  if (meta.current_stamp_count !== undefined) parts.push(`スタンプ: ${meta.current_stamp_count}`);
  if (meta.stamps_added !== undefined) parts.push(`+${meta.stamps_added}`);
  if (meta.type !== undefined) parts.push(String(meta.type));
  if (meta.result !== undefined) parts.push(String(meta.result));
  if (meta.stamps_won !== undefined) parts.push(`獲得: ${meta.stamps_won}`);
  if (meta.from_page !== undefined) parts.push(`from: ${meta.from_page}`);
  if (meta.error !== undefined) parts.push(`err: ${String(meta.error).slice(0, 20)}`);
  if (parts.length > 0) return parts.join(", ");
  return JSON.stringify(meta).slice(0, 60) + (JSON.stringify(meta).length > 60 ? "…" : "");
}

export default function UserLogsPage() {
  const [mounted, setMounted] = useState(false);
  const { data, error, isLoading, mutate } = useSWR<{ logs: EventLogItem[] }>(
    mounted ? "/api/event-logs?limit=200" : null,
    fetcher,
    { refreshInterval: 0 }
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const logs = data?.logs ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-600" />
            ユーザログ
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            LIFFアプリでのユーザー行動ログ。アプリ起動・QRスキャン・予約クリック・ゲームプレイなどを記録しています。
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutate()}
          disabled={isLoading}
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">更新</span>
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {error && (
          <div className="p-4 text-sm text-amber-700 bg-amber-50 border-b border-amber-100">
            読み込みに失敗しました。event_logs テーブルが作成されているか確認し、しばらくしてから再試行してください。
          </div>
        )}
        {isLoading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            まだユーザーログはありません。LIFFアプリで操作が行われると記録されます。
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[160px]">日時</TableHead>
                <TableHead className="min-w-[140px]">ユーザー</TableHead>
                <TableHead className="min-w-[140px]">氏名</TableHead>
                <TableHead className="w-[120px]">診察券</TableHead>
                <TableHead className="min-w-[140px]">イベント</TableHead>
                <TableHead className="w-[120px]">流入元</TableHead>
                <TableHead>メタデータ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-slate-600 whitespace-nowrap text-xs">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell
                    className="text-sm text-slate-800 max-w-[200px] truncate"
                    title={userDisplayName(log)}
                  >
                    {userDisplayName(log)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-800 max-w-[160px] truncate">
                    {log.profile?.real_name || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-800 whitespace-nowrap">
                    {log.profile?.ticket_number || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {EVENT_LABELS[log.event_name] ?? log.event_name}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {log.source || "—"}
                  </TableCell>
                  <TableCell
                    className="text-xs text-slate-500 max-w-[220px] truncate"
                    title={formatMetadata(log.metadata)}
                  >
                    {formatMetadata(log.metadata)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {logs.length >= 200 && (
        <p className="text-xs text-slate-500 text-center">
          直近 200 件を表示しています。
        </p>
      )}
    </div>
  );
}
