"use client";

import type { Profile } from "@/lib/types";
import { formatJst } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MessageCircle, Plus } from "lucide-react";
import { MobilePatientActionsMenu } from "./mobile-patient-actions-menu";

type Props = {
  profile: Profile;
  onStampChange: (delta: number) => void;
  onEdit: (data: {
    ticket_number: string | null;
    last_visit_date: string | null;
    view_mode: string | null;
    next_visit_date: string | null;
    next_memo: string | null;
  }) => void;
  onStampSet: (count: number) => void;
  onMessage: () => void;
  onViewModeToggle: () => void;
};

export function MobilePatientCard({
  profile,
  onStampChange,
  onEdit,
  onStampSet,
  onMessage,
  onViewModeToggle,
}: Props) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
      {/* 上段: 名前とスタンプ数 */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">
            {profile.display_name || "—"}
          </h3>
          <p className="text-sm text-muted-foreground">
            診察券: {profile.ticket_number || "—"}
          </p>
        </div>
        <Badge variant="secondary" className="text-lg font-bold px-3 py-1 ml-3 shrink-0">
          {profile.stamp_count}
        </Badge>
      </div>

      {/* 中段: 詳細情報 */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">最終来院:</span>
          <br />
          <span className="font-medium">
            {profile.last_visit_date ? formatJst(profile.last_visit_date) : "—"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">最新ログイン:</span>
          <br />
          <span className="font-medium">
            {formatJst(profile.updated_at)}
          </span>
        </div>
      </div>

      {/* 公式アカウント友だち状態 */}
      <div className="text-sm">
        <span className="text-muted-foreground">公式アカ: </span>
        {profile.is_line_friend === true ? (
          <span className="text-emerald-600 font-medium">○ 済</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>

      {/* 表示モード切り替え */}
      <div className="flex items-center gap-2 pt-1">
        <Switch
          checked={profile.view_mode === "kids"}
          onCheckedChange={onViewModeToggle}
          aria-label={`${profile.display_name || profile.id}の表示モードを切り替え`}
        />
        <span className="text-sm text-muted-foreground">
          {profile.view_mode === "kids" ? "キッズモード" : "大人モード"}
        </span>
      </div>

      {/* 下段: アクションボタン */}
      <div className="flex items-center gap-2 pt-2">
        {/* メッセージボタン（左） */}
        <Button
          size="default"
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm"
          onClick={onMessage}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          メッセージ
        </Button>

        {/* +1ボタン（右・大きめ） */}
        <Button
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 shadow-sm"
          onClick={() => onStampChange(1)}
        >
          <Plus className="h-5 w-5 mr-1" />
          +1
        </Button>

        {/* 3点メニュー */}
        <MobilePatientActionsMenu
          profile={profile}
          onStampChange={onStampChange}
          onEdit={onEdit}
          onStampSet={onStampSet}
        />
      </div>
    </div>
  );
}
