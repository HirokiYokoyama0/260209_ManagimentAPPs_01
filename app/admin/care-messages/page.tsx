"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { CareMessage } from "@/lib/types";
import useSWR from "swr";
import { formatJst } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CareMessagesPage() {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    startDate: "",
    endDate: "",
  });

  // APIエンドポイント構築
  const buildApiUrl = () => {
    const params = new URLSearchParams();
    if (appliedFilters.search) params.set("search", appliedFilters.search);
    if (appliedFilters.startDate) params.set("startDate", appliedFilters.startDate);
    if (appliedFilters.endDate) params.set("endDate", appliedFilters.endDate);
    return `/api/care-messages?${params.toString()}`;
  };

  const { data, error, isLoading } = useSWR(buildApiUrl(), fetcher);

  const handleApplyFilter = () => {
    setAppliedFilters({
      search,
      startDate,
      endDate,
    });
  };

  const handleClearFilter = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setAppliedFilters({
      search: "",
      startDate: "",
      endDate: "",
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <h1 className="text-3xl font-bold mb-6">個別配信ログ</h1>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-6xl py-8">
        <h1 className="text-3xl font-bold mb-6">個別配信ログ</h1>
        <p className="text-red-500">メッセージの取得に失敗しました</p>
      </div>
    );
  }

  const messages: CareMessage[] = data?.messages || [];
  const total = data?.total || 0;

  return (
    <div className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-6">個別配信ログ</h1>

      {/* フィルター */}
      <div className="bg-white p-6 rounded-lg border shadow-sm mb-6 space-y-4">
        <h2 className="text-lg font-semibold">フィルター</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">患者名で検索</Label>
            <Input
              id="search"
              placeholder="名前を入力..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="startDate">開始日</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="endDate">終了日</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleApplyFilter}>フィルター適用</Button>
          <Button variant="outline" onClick={handleClearFilter}>
            クリア
          </Button>
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <p className="text-sm text-gray-600">総件数: {total}件</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  送信日時
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  送信先
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">
                  診察券番号
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  メッセージ
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    メッセージがありません
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {formatJst(msg.sent_at)}
                    </td>
                    <td className="px-4 py-3 text-sm">{msg.patient_name}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">
                      {msg.ticket_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {msg.body.slice(0, 30)}...
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <MessageDetailDialog message={msg} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MessageDetailDialog({ message }: { message: CareMessage }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          詳細
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>メッセージ詳細</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>📅 送信日時</Label>
            <p className="text-lg">{formatJst(message.sent_at)}</p>
          </div>

          <div>
            <Label>👤 送信先</Label>
            <p className="text-lg">
              {message.patient_name}
              {message.ticket_number && (
                <span className="text-sm text-gray-500 ml-2">
                  (診察券番号: {message.ticket_number})
                </span>
              )}
            </p>
          </div>

          <div>
            <Label>💬 メッセージ内容</Label>
            <div className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap text-sm">
              {message.body}
            </div>
          </div>

          <div>
            <Label>📊 送信状態</Label>
            <p className="text-sm text-green-600">✅ 送信済み</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
