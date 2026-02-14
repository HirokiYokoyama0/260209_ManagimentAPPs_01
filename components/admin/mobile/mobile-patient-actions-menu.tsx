"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { formatVisitDate, isPastDate } from "@/lib/memo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Minus, Hash, AlertCircle } from "lucide-react";

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
};

export function MobilePatientActionsMenu({
  profile,
  onStampChange,
  onEdit,
  onStampSet,
}: Props) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [stampDialogOpen, setStampDialogOpen] = useState(false);

  const [ticketNumber, setTicketNumber] = useState(profile.ticket_number ?? "");
  const [lastVisitDate, setLastVisitDate] = useState(
    profile.last_visit_date ? profile.last_visit_date.slice(0, 10) : ""
  );
  const [viewMode, setViewMode] = useState(profile.view_mode ?? "");
  const [nextVisitDate, setNextVisitDate] = useState(profile.next_visit_date ?? "");
  const [nextMemo, setNextMemo] = useState(profile.next_memo ?? "");

  const [stampValue, setStampValue] = useState(String(profile.stamp_count));

  const handleEditOpen = (isOpen: boolean) => {
    setEditDialogOpen(isOpen);
    if (isOpen) {
      setTicketNumber(profile.ticket_number ?? "");
      setLastVisitDate(profile.last_visit_date ? profile.last_visit_date.slice(0, 10) : "");
      setViewMode(profile.view_mode ?? "");
      setNextVisitDate(profile.next_visit_date ?? "");
      setNextMemo(profile.next_memo ?? "");
    }
  };

  const handleEditSave = () => {
    onEdit({
      ticket_number: ticketNumber.trim() || null,
      last_visit_date: lastVisitDate.trim() || null,
      view_mode: viewMode.trim() || null,
      next_visit_date: nextVisitDate.trim() || null,
      next_memo: nextMemo.trim() || null,
    });
    setEditDialogOpen(false);
  };

  const isNextDatePast = nextVisitDate ? isPastDate(nextVisitDate) : false;
  const isMemoTooLong = nextMemo.length > 200;

  const handleStampOpen = (isOpen: boolean) => {
    setStampDialogOpen(isOpen);
    if (isOpen) {
      setStampValue(String(profile.stamp_count));
    }
  };

  const handleStampSave = () => {
    const n = parseInt(stampValue, 10);
    if (!Number.isInteger(n) || n < 0 || n > 999) return;
    onStampSet(n);
    setStampDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="その他の操作">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            編集
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onStampChange(-1)}
            disabled={profile.stamp_count <= 0}
          >
            <Minus className="h-4 w-4 mr-2" />
            -1 スタンプ減らす
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStampOpen(true)}>
            <Hash className="h-4 w-4 mr-2" />
            数値入力
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onOpenChange={handleEditOpen}>
        <DialogContent className="max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>患者情報を編集</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* 基本情報セクション */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">基本情報</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="mobile-ticket-number">診察券番号</Label>
                  <Input
                    id="mobile-ticket-number"
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    placeholder="例: 12345"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mobile-last-visit-date">最終来院日</Label>
                  <Input
                    id="mobile-last-visit-date"
                    type="date"
                    value={lastVisitDate}
                    onChange={(e) => setLastVisitDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mobile-view-mode">表示モード</Label>
                  <select
                    id="mobile-view-mode"
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">未設定</option>
                    <option value="adult">大人</option>
                    <option value="kids">キッズ</option>
                  </select>
                </div>
              </div>
            </div>

            <Separator />

            {/* 次回来院予定セクション */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">次回来院予定</h3>
              <div className="grid gap-2">
                <Label htmlFor="mobile-next-visit-date">次回来院予定日</Label>
                <Input
                  id="mobile-next-visit-date"
                  type="date"
                  value={nextVisitDate}
                  onChange={(e) => setNextVisitDate(e.target.value)}
                />
                {isNextDatePast && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    過去の日付が設定されています
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobile-next-memo">次回メモ</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setNextMemo("次回は歯石除去を行います。よろしくお願いします。")}
                    >
                      歯石除去
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setNextMemo("次回は定期検診です。お待ちしております。")}
                    >
                      定期検診
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Textarea
                    id="mobile-next-memo"
                    value={nextMemo}
                    onChange={(e) => setNextMemo(e.target.value)}
                    placeholder="次回来院時のメッセージを入力（例: 歯石除去を行います）"
                    rows={4}
                    maxLength={200}
                    className="resize-none pr-16"
                  />
                  <span className={`absolute bottom-2 right-2 text-xs ${isMemoTooLong ? "text-red-600 font-semibold" : "text-slate-400"}`}>
                    {nextMemo.length}/200
                  </span>
                </div>
                {isMemoTooLong && (
                  <p className="text-xs text-red-600">
                    200文字を超えています（現在: {nextMemo.length}文字）
                  </p>
                )}
              </div>

              {/* プレビュー */}
              {(nextVisitDate || nextMemo) && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span>📱</span>
                    患者側プレビュー
                  </div>
                  <div className="text-slate-700 space-y-1">
                    {nextVisitDate && (
                      <div className="font-semibold">
                        次回来院予定: {formatVisitDate(nextVisitDate)}
                      </div>
                    )}
                    {nextMemo && (
                      <div className="whitespace-pre-wrap">{nextMemo}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button size="sm" onClick={handleEditSave} disabled={isMemoTooLong}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* スタンプ数値入力ダイアログ */}
      <Dialog open={stampDialogOpen} onOpenChange={handleStampOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>スタンプ数を直接入力</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="mobile-stamp-count">
                {profile.display_name || profile.id} のスタンプ数（0〜999）
              </Label>
              <Input
                id="mobile-stamp-count"
                type="number"
                min={0}
                max={999}
                value={stampValue}
                onChange={(e) => setStampValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStampDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleStampSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
