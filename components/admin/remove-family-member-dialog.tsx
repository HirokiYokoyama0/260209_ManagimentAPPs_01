"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

export function RemoveFamilyMemberDialog({
  member,
  familyId,
  familyName,
  open,
  onOpenChange,
  onSuccess,
}: {
  member: Profile;
  familyId: string;
  familyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRemove() {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/families/${familyId}/members/${member.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "メンバーの削除に失敗しました");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("メンバー削除エラー:", error);
      alert(error instanceof Error ? error.message : "メンバーの削除に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            メンバーを削除しますか？
          </DialogTitle>
          <DialogDescription className="pt-4">
            <strong className="text-foreground">{member.display_name || "このメンバー"}</strong> を{" "}
            <strong className="text-foreground">{familyName}</strong> から削除します。
            <br />
            <br />
            削除されたメンバーは個別の家族に戻ります。
            {member.family_role === "parent" && (
              <div className="mt-2 p-2 bg-amber-50 text-amber-800 rounded text-sm">
                ⚠️ このメンバーは保護者です。削除できません。
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isSubmitting || member.family_role === "parent"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                削除中...
              </>
            ) : (
              "削除する"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
