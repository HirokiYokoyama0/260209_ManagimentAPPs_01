"use client";

import { useState } from "react";
import type { Family } from "@/lib/types";
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
import { Pencil, Loader2 } from "lucide-react";

export function EditFamilyDialog({
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
  const [familyName, setFamilyName] = useState(family.family_name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!familyName.trim()) {
      alert("家族名を入力してください");
      return;
    }

    if (familyName.trim() === family.family_name) {
      // 変更なし
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/families/${family.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_name: familyName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "家族名の変更に失敗しました");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("家族編集エラー:", error);
      alert(error instanceof Error ? error.message : "家族名の変更に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            家族名を編集
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="family-name">家族名</Label>
            <Input
              id="family-name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="例: 横山浩紀の家族"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !familyName.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
