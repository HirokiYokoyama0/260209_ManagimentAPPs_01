"use client";

import type { RewardExchangeWithDetails } from "@/lib/types";
import { MobileRewardExchangeCard } from "./mobile-reward-exchange-card";
import { Loader2 } from "lucide-react";

type Props = {
  exchanges: RewardExchangeWithDetails[];
  isLoading: boolean;
  processingId: string | null;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
};

export function MobileRewardExchangeList({
  exchanges,
  isLoading,
  processingId,
  onComplete,
  onCancel,
  onDelete,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-12 w-12 text-sky-500 animate-spin" />
        <p className="text-muted-foreground text-sm">読み込み中...</p>
      </div>
    );
  }

  if (exchanges.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 bg-white rounded-lg border">
        該当する交換履歴がありません。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {exchanges.map((exchange) => (
        <MobileRewardExchangeCard
          key={exchange.id}
          exchange={exchange}
          onComplete={onComplete}
          onCancel={onCancel}
          onDelete={onDelete}
          isProcessing={processingId === exchange.id}
        />
      ))}
    </div>
  );
}
