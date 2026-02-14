"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Check, X, Trash2, Search, Filter, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MobileRewardExchangeList } from "@/components/admin/mobile/mobile-reward-exchange-list";
import type { RewardExchangeWithDetails } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RewardExchangesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // APIからデータ取得
  const queryParams = new URLSearchParams();
  if (statusFilter !== "all") {
    queryParams.set("status", statusFilter);
  }
  if (searchQuery) {
    queryParams.set("search", searchQuery);
  }

  const { data, error, mutate, isLoading } = useSWR<{
    exchanges: RewardExchangeWithDetails[];
  }>(`/api/reward-exchanges?${queryParams.toString()}`, fetcher);

  const exchanges = data?.exchanges || [];

  // 引き渡し完了処理
  const handleComplete = async (id: string) => {
    const staffName = prompt("担当者名を入力してください（例: 田中）");
    if (!staffName) return;

    setIsProcessing(id);
    try {
      const response = await fetch(`/api/reward-exchanges/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedBy: staffName }),
      });

      if (response.ok) {
        alert("引き渡し完了しました");
        mutate();
      } else {
        alert("エラーが発生しました");
      }
    } catch (error) {
      console.error("Error completing exchange:", error);
      alert("エラーが発生しました");
    } finally {
      setIsProcessing(null);
    }
  };

  // キャンセル処理
  const handleCancel = async (id: string) => {
    const notes = prompt("キャンセル理由を入力してください（例: 在庫切れ）");
    if (!notes) return;

    const confirmed = confirm(
      "キャンセルしますか？（スタンプは返却されません）"
    );
    if (!confirmed) return;

    setIsProcessing(id);
    try {
      const response = await fetch(`/api/reward-exchanges/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        alert("キャンセルしました");
        mutate();
      } else {
        alert("エラーが発生しました");
      }
    } catch (error) {
      console.error("Error cancelling exchange:", error);
      alert("エラーが発生しました");
    } finally {
      setIsProcessing(null);
    }
  };

  // 削除処理
  const handleDelete = async (id: string) => {
    const confirmed = confirm(
      "この交換履歴を完全に削除しますか？この操作は取り消せません。"
    );
    if (!confirmed) return;

    setIsProcessing(id);
    try {
      const response = await fetch(`/api/reward-exchanges/${id}/delete`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("削除しました");
        mutate();
      } else {
        alert("エラーが発生しました");
      }
    } catch (error) {
      console.error("Error deleting exchange:", error);
      alert("エラーが発生しました");
    } finally {
      setIsProcessing(null);
    }
  };

  // ステータスバッジ
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            未引渡
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            引渡済
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
            キャンセル
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-sm">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">特典交換履歴</h1>
          <p className="text-sm text-slate-500">
            患者がスタンプを使って交換した特典を管理
          </p>
        </div>
      </div>

      {/* フィルタ・検索 */}
      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:flex-row">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">全ステータス</option>
            <option value="pending">未引渡のみ</option>
            <option value="completed">引渡済のみ</option>
            <option value="cancelled">キャンセルのみ</option>
          </select>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="患者名・特典名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* PC用: テーブル（lg以上で表示） */}
      <div className="hidden lg:block rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
            <p className="text-muted-foreground text-sm">データを読み込んでいます...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            エラーが発生しました
          </div>
        ) : exchanges.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            交換履歴がありません
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>患者名</TableHead>
                  <TableHead>特典名</TableHead>
                  <TableHead className="text-center">スタンプ数</TableHead>
                  <TableHead>交換日時</TableHead>
                  <TableHead className="text-center">ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exchanges.map((exchange) => (
                  <TableRow key={exchange.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {exchange.user_picture_url && (
                          <img
                            src={exchange.user_picture_url}
                            alt={exchange.user_name}
                            className="h-8 w-8 rounded-full"
                          />
                        )}
                        <span>{exchange.user_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {exchange.reward_image_url && (
                          <img
                            src={exchange.reward_image_url}
                            alt={exchange.reward_name}
                            className="h-8 w-8 rounded object-cover"
                          />
                        )}
                        <span>{exchange.reward_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-purple-600">
                        {exchange.stamp_count_used}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(exchange.exchanged_at).toLocaleString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(exchange.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {exchange.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleComplete(exchange.id)}
                            disabled={isProcessing === exchange.id}
                            className="border-green-200 text-green-700 hover:bg-green-50"
                          >
                            <Check className="mr-1 h-3 w-3" />
                            完了
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(exchange.id)}
                            disabled={isProcessing === exchange.id}
                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                          >
                            <X className="mr-1 h-3 w-3" />
                            キャンセル
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(exchange.id)}
                            disabled={isProcessing === exchange.id}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            削除
                          </Button>
                        </div>
                      )}
                      {(exchange.status === "completed" || exchange.status === "cancelled") && (
                        <div className="flex justify-end gap-2 items-center">
                          <span className="text-xs text-slate-500">
                            {exchange.status === "completed" ? "引渡済" : "キャンセル済"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(exchange.id)}
                            disabled={isProcessing === exchange.id}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            削除
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* フッター */}
            <div className="border-t border-slate-100 px-6 py-3 text-sm text-slate-500">
              表示件数: {exchanges.length}件
            </div>
          </>
        )}
      </div>

      {/* スマホ用: カード一覧（lg未満で表示） */}
      <div className="block lg:hidden">
        <MobileRewardExchangeList
          exchanges={exchanges}
          isLoading={isLoading}
          processingId={isProcessing}
          onComplete={handleComplete}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
