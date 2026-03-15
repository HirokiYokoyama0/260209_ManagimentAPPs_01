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
} from "@/components/ui/dialog";
import { Loader2, UserX } from "lucide-react";
import type { Profile } from "@/lib/types";

interface ResetToIndividualDialogProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ResetToIndividualDialog({
  profile,
  open,
  onOpenChange,
  onSuccess,
}: ResetToIndividualDialogProps) {
  const [isResetting, setIsResetting] = useState(false);

  async function handleReset() {
    setIsResetting(true);
    try {
      const res = await fetch(`/api/profiles/${profile.id}/reset-to-individual`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("リセットエラー:", error);
        alert(`リセットに失敗しました: ${error.error || "不明なエラー"}`);
        return;
      }

      console.log("✅ 単身ユーザーにリセットしました");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("リセットエラー:", error);
      alert("リセットに失敗しました。");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-orange-600" />
            単身ユーザーにリセット
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <div className="bg-slate-50 p-3 rounded-lg border">
              <div className="text-sm font-medium text-slate-700">
                {profile.real_name || profile.display_name || "ユーザー"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {profile.family_id ? `家族ID: ${profile.family_id.slice(0, 8)}...` : "家族なし"}
              </div>
            </div>

            <div className="text-sm text-slate-600 space-y-2">
              <p>このユーザーを<strong className="text-orange-600">単身ユーザー</strong>の状態にリセットします。</p>
              <div className="bg-orange-50 border border-orange-200 rounded p-3 space-y-1.5">
                <div className="font-medium text-orange-900 text-xs">変更内容:</div>
                <ul className="text-xs text-orange-800 space-y-1 list-disc list-inside">
                  <li><code className="bg-orange-100 px-1 rounded">family_id</code> → <code className="bg-orange-100 px-1 rounded">NULL</code></li>
                  <li><code className="bg-orange-100 px-1 rounded">family_role</code> → <code className="bg-orange-100 px-1 rounded">NULL</code></li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                ※ 元の家族情報には影響しません。このユーザーのみがリセットされます。
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isResetting}
          >
            キャンセル
          </Button>
          <Button
            variant="default"
            onClick={handleReset}
            disabled={isResetting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isResetting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                リセット中...
              </>
            ) : (
              <>
                <UserX className="mr-2 h-4 w-4" />
                単身ユーザーにリセット
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
