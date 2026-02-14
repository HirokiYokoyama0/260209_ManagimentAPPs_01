"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { MoreVertical, Pencil, Minus, Hash } from "lucide-react";

type Props = {
  profile: Profile;
  onStampChange: (delta: number) => void;
  onEdit: (data: { ticket_number: string | null; last_visit_date: string | null; view_mode: string | null }) => void;
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

  const [stampValue, setStampValue] = useState(String(profile.stamp_count));

  const handleEditOpen = (isOpen: boolean) => {
    setEditDialogOpen(isOpen);
    if (isOpen) {
      setTicketNumber(profile.ticket_number ?? "");
      setLastVisitDate(profile.last_visit_date ? profile.last_visit_date.slice(0, 10) : "");
      setViewMode(profile.view_mode ?? "");
    }
  };

  const handleEditSave = () => {
    onEdit({
      ticket_number: ticketNumber.trim() || null,
      last_visit_date: lastVisitDate.trim() || null,
      view_mode: viewMode.trim() || null,
    });
    setEditDialogOpen(false);
  };

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>診察券番号・最終来院日・表示モードを編集</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEditSave}>保存</Button>
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
