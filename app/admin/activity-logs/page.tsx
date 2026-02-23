"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { ClipboardList, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type LogItem = {
  id: string;
  staff_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  staff?: { display_name: string | null; login_id: string } | null;
  target_profile?: {
    display_name: string | null;
    real_name: string | null;
    ticket_number: string | null;
  } | null;
};

const ACTION_LABELS: Record<string, string> = {
  login: "ログイン",
  logout: "ログアウト",
  profile_update: "患者情報更新",
  stamp_increment: "スタンプ加算",
  stamp_set: "スタンプ設定",
  message_send: "個別メッセージ送信",
  broadcast_send: "一斉配信",
  reward_exchange_complete: "特典引き渡し完了",
  reward_exchange_cancel: "特典交換キャンセル",
  reward_exchange_delete: "特典交換削除",
  family_create: "家族作成",
  family_update: "家族更新",
  family_delete: "家族削除",
  family_member_add: "家族メンバー追加",
  family_member_remove: "家族メンバー解除",
  staff_create: "スタッフ追加",
  staff_update: "スタッフ更新",
  staff_deactivate: "スタッフ無効化",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  profile: "患者",
  reward_exchange: "特典交換",
  family: "家族",
  staff: "スタッフ",
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

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details || Object.keys(details).length === 0) return "—";
  if (details.delta !== undefined)
    return `Δ ${Number(details.delta) >= 0 ? "+" : ""}${details.delta}`;
  if (details.value !== undefined) return `値: ${details.value}`;
  if (details.recipient_count !== undefined)
    return `対象: ${details.recipient_count}件`;
  if (details.fields && Array.isArray(details.fields))
    return `項目: ${(details.fields as string[]).join(", ")}`;
  if (details.user_id) return `user: ${String(details.user_id).slice(0, 8)}…`;
  return JSON.stringify(details);
}

function targetShort(id: string | null): string {
  if (!id) return "—";
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…`;
}

/** 対象が患者のときの表示名（display_name / real_name / 診察券番号 の優先順） */
function targetDetailName(log: LogItem): string {
  const p = log.target_profile;
  if (!p) return "—";
  const name = p.display_name || p.real_name || p.ticket_number || null;
  return name ?? "—";
}

export default function ActivityLogsPage() {
  const [mounted, setMounted] = useState(false);
  const { data, error, isLoading, mutate } = useSWR<{ logs: LogItem[] }>(
    mounted ? "/api/activity-logs?limit=200" : null,
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
            <ClipboardList className="h-5 w-5 text-slate-600" />
            スタッフ操作ログ
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            誰が・いつ・何をしたかの記録。操作者が「admin」の行は従来の環境変数ログインの操作です。
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
            読み込みに失敗しました。しばらくしてから再試行してください。
          </div>
        )}
        {isLoading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            まだ操作ログはありません。
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[160px]">日時</TableHead>
                <TableHead className="w-[120px]">操作者</TableHead>
                <TableHead className="min-w-[140px]">操作</TableHead>
                <TableHead className="w-[100px]">対象</TableHead>
                <TableHead className="min-w-[140px]">詳細対象</TableHead>
                <TableHead>詳細</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-slate-600 whitespace-nowrap text-xs">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell>
                    {log.staff_id == null ? (
                      <Badge variant="secondary" className="font-normal">
                        admin
                      </Badge>
                    ) : log.staff ? (
                      <span className="text-sm">
                        {log.staff.display_name || log.staff.login_id}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {targetShort(log.staff_id)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {log.target_type
                      ? `${TARGET_TYPE_LABELS[log.target_type] ?? log.target_type} (${targetShort(log.target_id)})`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-800 max-w-[200px] truncate" title={targetDetailName(log)}>
                    {targetDetailName(log)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-[120px] truncate">
                    {formatDetails(log.details)}
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
