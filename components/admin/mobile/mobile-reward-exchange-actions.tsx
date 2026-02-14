"use client";

import { Button } from "@/components/ui/button";
import { Check, X, Trash2 } from "lucide-react";

type Props = {
  exchangeId: string;
  status: "pending" | "completed" | "cancelled";
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  isProcessing: boolean;
};

export function MobileRewardExchangeActions({
  exchangeId,
  status,
  onComplete,
  onCancel,
  onDelete,
  isProcessing,
}: Props) {
  if (status !== "pending") {
    // 完了・キャンセル済みは削除ボタンのみ
    return (
      <Button
        size="sm"
        variant="outline"
        className="w-full border-red-300 text-red-700 hover:bg-red-50"
        onClick={() => onDelete(exchangeId)}
        disabled={isProcessing}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        削除
      </Button>
    );
  }

  // pending状態は3つのボタン
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => onComplete(exchangeId)}
        disabled={isProcessing}
      >
        <Check className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">完了</span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="border-orange-300 text-orange-700 hover:bg-orange-50"
        onClick={() => onCancel(exchangeId)}
        disabled={isProcessing}
      >
        <X className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">キャンセル</span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="border-red-300 text-red-700 hover:bg-red-50"
        onClick={() => onDelete(exchangeId)}
        disabled={isProcessing}
      >
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">削除</span>
      </Button>
    </div>
  );
}
