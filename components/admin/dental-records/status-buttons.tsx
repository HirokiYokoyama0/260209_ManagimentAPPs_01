"use client";

import { Button } from "@/components/ui/button";

type StatusButtonsProps = {
  onStatusSelect: (status: string, statusLabel: string, color: string) => void;
  disabled?: boolean;
};

// 医療UIカラールール:
// - 緑系(#10b981): 完了・良好な状態
// - 黄系(#eab308): 経過観察
// - オレンジ系(#f97316): 治療中
// - 赤系(#dc2626): 要治療
// - 青系(#3b82f6): 処置済み
// - 水色系(#06b6d4): メンテナンス済み
// - 紫系(#a855f7): 予防ケア
// - グレー系(#9ca3af): クリア

const STATUSES = [
  {
    status: "cavity_completed",
    label: "虫歯治療済",
    color: "#10b981",
    bgClass: "bg-emerald-500 hover:bg-emerald-600",
  },
  {
    status: "observation",
    label: "経過観察",
    color: "#eab308",
    bgClass: "bg-yellow-500 hover:bg-yellow-600",
  },
  {
    status: "cavity_planned",
    label: "治療予定",
    color: "#dc2626",
    bgClass: "bg-red-600 hover:bg-red-700",
  },
  {
    status: "in_treatment",
    label: "治療中",
    color: "#f97316",
    bgClass: "bg-orange-500 hover:bg-orange-600",
  },
  {
    status: "crown",
    label: "被せ物",
    color: "#3b82f6",
    bgClass: "bg-blue-500 hover:bg-blue-600",
  },
  {
    status: "scaling_completed",
    label: "歯石除去",
    color: "#06b6d4",
    bgClass: "bg-cyan-500 hover:bg-cyan-600",
  },
  {
    status: "cleaning",
    label: "クリーニング",
    color: "#a855f7",
    bgClass: "bg-purple-500 hover:bg-purple-600",
  },
  {
    status: "clear",
    label: "クリア",
    color: "#9ca3af",
    bgClass: "bg-gray-400 hover:bg-gray-500",
  },
];

export function StatusButtons({ onStatusSelect, disabled = false }: StatusButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {STATUSES.map((s) => (
        <Button
          key={s.status}
          onClick={() => onStatusSelect(s.status, s.label, s.color)}
          disabled={disabled}
          className={`${s.bgClass} text-white font-medium text-xs py-3 px-2 shadow-sm transition-all duration-150`}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
