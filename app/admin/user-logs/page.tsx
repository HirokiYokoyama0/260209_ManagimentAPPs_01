"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Users, Loader2, RefreshCw, Download, Eye, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
  const [selectedLog, setSelectedLog] = useState<EventLogItem | null>(null);
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{ logs: EventLogItem[] }>(
    mounted ? "/api/event-logs?limit=200" : null,
    fetcher,
    { refreshInterval: 0 }
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const logs = data?.logs ?? [];

  // フィルタリング処理
  const filteredLogs = logs.filter((log) => {
    if (filterEvent !== "all" && log.event_name !== filterEvent) return false;
    if (filterSource !== "all" && log.source !== filterSource) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const userName = userDisplayName(log);
      const realName = log.profile?.real_name || "";
      const ticketNumber = log.profile?.ticket_number || "";
      const eventLabel = EVENT_LABELS[log.event_name] || log.event_name;
      if (
        !userName.toLowerCase().includes(searchLower) &&
        !realName.toLowerCase().includes(searchLower) &&
        !ticketNumber.toLowerCase().includes(searchLower) &&
        !eventLabel.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    return true;
  });

  // ユニークなソースリスト
  const uniqueSources = Array.from(
    new Set(logs.filter((log) => log.source).map((log) => log.source))
  ).filter(Boolean) as string[];

  // CSV エクスポート
  const handleExport = () => {
    const headers = ["日時", "ユーザー", "氏名", "診察券", "イベント", "流入元", "メタデータ"];
    const rows = filteredLogs.map((log) => [
      formatDate(log.created_at),
      userDisplayName(log),
      log.profile?.real_name || "",
      log.profile?.ticket_number || "",
      EVENT_LABELS[log.event_name] ?? log.event_name,
      log.source || "",
      formatMetadata(log.metadata),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `user-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <Filter className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">フィルター</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className="shrink-0"
          >
            <Download className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">CSV</span>
          </Button>
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
            <span className="ml-2 hidden sm:inline">更新</span>
          </Button>
        </div>
      </div>

      {/* フィルターセクション */}
      {showFilters && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">フィルター</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterEvent("all");
                setFilterSource("all");
                setSearchTerm("");
              }}
            >
              <X className="h-4 w-4 mr-1" />
              クリア
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                イベント種類
              </label>
              <Select value={filterEvent} onValueChange={setFilterEvent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {Object.entries(EVENT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                流入元
              </label>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {uniqueSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                キーワード検索
              </label>
              <Input
                type="text"
                placeholder="ユーザー、氏名、診察券..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="text-xs text-slate-600">
            {filteredLogs.length} / {logs.length} 件を表示
          </div>
        </div>
      )}

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
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            {logs.length === 0
              ? "まだユーザーログはありません。LIFFアプリで操作が行われると記録されます。"
              : "フィルター条件に一致するログがありません。"}
          </div>
        ) : (
          <>
            {/* デスクトップ用テーブル */}
            <div className="hidden lg:block">
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
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
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
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* モバイル用カードリスト */}
            <div className="block lg:hidden divide-y divide-slate-200">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/50 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {EVENT_LABELS[log.event_name] ?? log.event_name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {formatDate(log.created_at)}
                      </div>
                    </div>
                    {log.source && (
                      <div className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {log.source}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-slate-700 mb-1">
                    {log.profile?.real_name || userDisplayName(log)}
                  </div>
                  {log.profile?.ticket_number && (
                    <div className="text-xs text-slate-600 mb-1">
                      診察券: {log.profile.ticket_number}
                    </div>
                  )}
                  {log.metadata && (
                    <div className="text-xs text-slate-500">
                      {formatMetadata(log.metadata)}
                    </div>
                  )}
                  <div className="flex justify-end mt-2">
                    <Eye className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {filteredLogs.length >= 200 && (
        <p className="text-xs text-slate-500 text-center">
          直近 200 件を表示しています。
        </p>
      )}

      {/* 詳細表示モーダル */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ユーザログ詳細</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">日時</div>
                  <div className="text-sm">{formatDate(selectedLog.created_at)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">イベント</div>
                  <div className="text-sm">
                    {EVENT_LABELS[selectedLog.event_name] ?? selectedLog.event_name}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">流入元</div>
                  <div className="text-sm">{selectedLog.source || "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">診察券番号</div>
                  <div className="text-sm">{selectedLog.profile?.ticket_number || "—"}</div>
                </div>
              </div>
              {selectedLog.user_id && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">ユーザーID</div>
                  <div className="text-sm font-mono bg-slate-50 p-2 rounded break-all">
                    {selectedLog.user_id}
                  </div>
                </div>
              )}
              {selectedLog.profile && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">ユーザー情報</div>
                  <div className="text-sm space-y-1">
                    <div>表示名: {selectedLog.profile.display_name || "—"}</div>
                    <div>氏名: {selectedLog.profile.real_name || "—"}</div>
                  </div>
                </div>
              )}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">メタデータ</div>
                  <pre className="text-xs bg-slate-50 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
