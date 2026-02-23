"use client";

import { useState } from "react";
import type { Family } from "@/lib/types";
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

export function DeleteFamilyDialog({
  family,
  open,
  onOpenChange,
  onSuccess,
}: {
  family: Family;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/families/${family.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "家族の解散に失敗しました");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("家族解散エラー:", error);
      alert(error instanceof Error ? error.message : "家族の解散に失敗しました。もう一度お試しください。");
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
            家族を解散しますか？
          </DialogTitle>
          <DialogDescription className="pt-4">
            <strong className="text-foreground">{family.family_name}</strong> を解散します。
            <br />
            <br />
            すべてのメンバーは個別の家族に戻ります。この操作は取り消せません。
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
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                解散中...
              </>
            ) : (
              "解散する"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
