"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteProfileDialogProps {
  profile: {
    id: string;
    display_name: string | null;
    real_name?: string | null;
    ticket_number?: string | null;
    stamp_count: number;
    family_id?: string | null;
  };
  onDelete: (profileId: string) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteProfileDialog({
  profile,
  onDelete,
  open: controlledOpen,
  onOpenChange,
}: DeleteProfileDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const displayName = profile.real_name || profile.display_name || "名前未設定";

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(profile.id);
      alert(`${displayName} さんを削除しました`);
      setOpen(false);
    } catch (error: any) {
      alert(`削除に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            患者情報の削除
          </DialogTitle>
          <DialogDescription>
            この操作は取り消せません。すべての関連データ（スタンプ履歴、特典交換履歴、ケア記録など）が完全に削除されます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* 患者情報 */}
          <div className="bg-slate-50 p-3 rounded-lg border">
            <h3 className="font-semibold mb-2 text-sm">削除対象</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">患者名:</span> {displayName}
              </p>
              {profile.ticket_number && (
                <p>
                  <span className="font-medium">診察券番号:</span>{" "}
                  {profile.ticket_number}
                </p>
              )}
              <p>
                <span className="font-medium">スタンプ数:</span>{" "}
                {profile.stamp_count / 10} 個
              </p>
            </div>
          </div>

          {/* 警告メッセージ */}
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ スタンプ履歴、特典交換履歴、ケア記録などすべての関連データが削除されます
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "削除中..." : "削除する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
