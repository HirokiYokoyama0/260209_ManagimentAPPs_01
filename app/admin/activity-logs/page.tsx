"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { ClipboardList, Loader2, RefreshCw, Download, Eye, Filter, X } from "lucide-react";
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
  survey_targets_distribute: "アンケート配信",
  survey_answer_reset: "アンケート未回答に戻す",
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
  if (details.targetCount !== undefined && details.surveyId !== undefined)
    return `アンケート: ${details.surveyId} / ${details.targetCount}人`;
  if (details.surveyId !== undefined && details.userId !== undefined)
    return `survey: ${String(details.surveyId)} / user: ${String(details.userId).slice(0, 8)}…`;
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
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterStaff, setFilterStaff] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{ logs: LogItem[] }>(
    mounted ? "/api/activity-logs?limit=200" : null,
    fetcher,
    { refreshInterval: 0 }
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const logs = data?.logs ?? [];

  // フィルタリング処理
  const filteredLogs = logs.filter((log) => {
    if (filterAction !== "all" && log.action !== filterAction) return false;
    if (filterStaff !== "all") {
      if (filterStaff === "admin" && log.staff_id !== null) return false;
      if (filterStaff !== "admin" && log.staff_id !== filterStaff) return false;
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const staffName = log.staff?.display_name || log.staff?.login_id || "";
      const targetName = targetDetailName(log);
      const actionLabel = ACTION_LABELS[log.action] || log.action;
      if (
        !staffName.toLowerCase().includes(searchLower) &&
        !targetName.toLowerCase().includes(searchLower) &&
        !actionLabel.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    return true;
  });

  // ユニークなスタッフリスト
  const uniqueStaff = Array.from(
    new Map(
      logs
        .filter((log) => log.staff_id !== null && log.staff)
        .map((log) => [
          log.staff_id,
          {
            id: log.staff_id!,
            name: log.staff?.display_name || log.staff?.login_id || "",
          },
        ])
    ).values()
  );

  // CSV エクスポート
  const handleExport = () => {
    const headers = ["日時", "操作者", "操作", "対象種別", "対象ID", "詳細対象", "詳細"];
    const rows = filteredLogs.map((log) => [
      formatDate(log.created_at),
      log.staff_id == null
        ? "admin"
        : log.staff?.display_name || log.staff?.login_id || targetShort(log.staff_id),
      ACTION_LABELS[log.action] ?? log.action,
      log.target_type ? TARGET_TYPE_LABELS[log.target_type] ?? log.target_type : "",
      log.target_id || "",
      targetDetailName(log),
      formatDetails(log.details),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

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
                setFilterAction("all");
                setFilterStaff("all");
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
                操作種類
              </label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                操作者
              </label>
              <Select value={filterStaff} onValueChange={setFilterStaff}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                  {uniqueStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
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
                placeholder="操作者、対象、操作..."
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
            読み込みに失敗しました。しばらくしてから再試行してください。
          </div>
        )}
        {isLoading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            {logs.length === 0
              ? "まだ操作ログはありません。"
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
                    <TableHead className="w-[120px]">操作者</TableHead>
                    <TableHead className="min-w-[140px]">操作</TableHead>
                    <TableHead className="w-[100px]">対象</TableHead>
                    <TableHead className="min-w-[140px]">詳細対象</TableHead>
                    <TableHead>詳細</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
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
                        {ACTION_LABELS[log.action] ?? log.action}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {formatDate(log.created_at)}
                      </div>
                    </div>
                    {log.staff_id == null ? (
                      <Badge variant="secondary" className="font-normal">
                        admin
                      </Badge>
                    ) : log.staff ? (
                      <div className="text-sm text-slate-700">
                        {log.staff.display_name || log.staff.login_id}
                      </div>
                    ) : null}
                  </div>
                  {log.target_type && (
                    <div className="text-xs text-slate-600 mb-1">
                      {TARGET_TYPE_LABELS[log.target_type] ?? log.target_type}:{" "}
                      {targetDetailName(log)}
                    </div>
                  )}
                  {log.details && (
                    <div className="text-xs text-slate-500">
                      {formatDetails(log.details)}
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
            <DialogTitle>操作ログ詳細</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">日時</div>
                  <div className="text-sm">{formatDate(selectedLog.created_at)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">操作者</div>
                  <div className="text-sm">
                    {selectedLog.staff_id == null ? (
                      <Badge variant="secondary">admin</Badge>
                    ) : selectedLog.staff ? (
                      selectedLog.staff.display_name || selectedLog.staff.login_id
                    ) : (
                      targetShort(selectedLog.staff_id)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">操作</div>
                  <div className="text-sm">
                    {ACTION_LABELS[selectedLog.action] ?? selectedLog.action}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">対象種別</div>
                  <div className="text-sm">
                    {selectedLog.target_type
                      ? TARGET_TYPE_LABELS[selectedLog.target_type] ?? selectedLog.target_type
                      : "—"}
                  </div>
                </div>
              </div>
              {selectedLog.target_id && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">対象ID</div>
                  <div className="text-sm font-mono bg-slate-50 p-2 rounded break-all">
                    {selectedLog.target_id}
                  </div>
                </div>
              )}
              {selectedLog.target_profile && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">対象患者</div>
                  <div className="text-sm">
                    {targetDetailName(selectedLog)}
                  </div>
                </div>
              )}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">詳細情報</div>
                  <pre className="text-xs bg-slate-50 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
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
