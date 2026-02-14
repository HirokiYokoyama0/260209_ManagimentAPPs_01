"use client";

import type { RewardExchangeWithDetails } from "@/lib/types";
import { formatJst } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { MobileRewardExchangeActions } from "./mobile-reward-exchange-actions";
import { Gift, Calendar, Award } from "lucide-react";

type Props = {
  exchange: RewardExchangeWithDetails;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  isProcessing: boolean;
};

const statusConfig = {
  pending: { label: "未引渡", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
  completed: { label: "引渡完了", variant: "secondary" as const, color: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "キャンセル", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
};

export function MobileRewardExchangeCard({
  exchange,
  onComplete,
  onCancel,
  onDelete,
  isProcessing,
}: Props) {
  const config = statusConfig[exchange.status];

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
      {/* 上段: 患者名とステータス */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base truncate">
              {exchange.user_name || "—"}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Gift className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{exchange.reward_name}</span>
          </div>
        </div>
        <Badge className={`${config.color} shrink-0 ml-2`}>
          {config.label}
        </Badge>
      </div>

      {/* 中段: 詳細情報 */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">スタンプ数:</span>
          <span className="font-semibold">{exchange.stamp_count_used}個</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">交換日時:</span>
          <span className="font-medium">{formatJst(exchange.exchanged_at)}</span>
        </div>
      </div>

      {/* 下段: アクションボタン */}
      <div className="pt-2 border-t">
        <MobileRewardExchangeActions
          exchangeId={exchange.id}
          status={exchange.status}
          onComplete={onComplete}
          onCancel={onCancel}
          onDelete={onDelete}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}
