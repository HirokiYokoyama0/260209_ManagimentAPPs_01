"use client";

import { useState } from "react";
import useSWR from "swr";
import type { Profile, FamilyWithMembers } from "@/lib/types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type SelectedMember = {
  profile: Profile;
  role: "parent" | "child";
};

export function AddFamilyMemberDialog({
  family,
  open,
  onOpenChange,
  onSuccess,
}: {
  family: FamilyWithMembers;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: allProfiles = [] } = useSWR<Profile[]>("/api/profiles", fetcher);

  // 既に家族に所属しているメンバーのIDリスト
  const existingMemberIds = family.members.map((m) => m.id);

  // 検索結果をフィルタリング（既存メンバーと選択済みメンバーを除外）
  const searchResults = allProfiles.filter((p) => {
    if (existingMemberIds.includes(p.id)) return false;
    if (selectedMembers.some((m) => m.profile.id === p.id)) return false;
    if (!searchQuery.trim()) return false;

    const query = searchQuery.toLowerCase();
    return (
      p.display_name?.toLowerCase().includes(query) ||
      p.ticket_number?.toLowerCase().includes(query)
    );
  });

  function handleToggleMember(profile: Profile) {
    const exists = selectedMembers.find((m) => m.profile.id === profile.id);
    if (exists) {
      setSelectedMembers(selectedMembers.filter((m) => m.profile.id !== profile.id));
    } else {
      setSelectedMembers([...selectedMembers, { profile, role: "child" }]);
    }
  }

  function handleRoleChange(userId: string, role: "parent" | "child") {
    setSelectedMembers(
      selectedMembers.map((m) =>
        m.profile.id === userId ? { ...m, role } : m
      )
    );
  }

  async function handleSubmit() {
    if (selectedMembers.length === 0) {
      alert("追加するメンバーを選択してください");
      return;
    }

    setIsSubmitting(true);

    try {
      // 各メンバーを家族に追加
      for (const member of selectedMembers) {
        const response = await fetch(`/api/families/${family.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: member.profile.id,
            family_role: member.role,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `${member.profile.display_name} の追加に失敗しました`);
        }
      }

      onSuccess();
      onOpenChange(false);

      // リセット
      setSearchQuery("");
      setSelectedMembers([]);
    } catch (error) {
      console.error("メンバー追加エラー:", error);
      alert(error instanceof Error ? error.message : "メンバーの追加に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            メンバーを追加 - {family.family_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 現在のメンバー数表示 */}
          <div className="text-sm text-muted-foreground">
            現在のメンバー数: {family.member_count}人
          </div>

          {/* 検索ボックス */}
          <div className="space-y-2">
            <Label>追加するメンバーを検索</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="名前または診察券番号で検索..."
                className="pl-10"
              />
            </div>
          </div>

          {/* 検索結果 */}
          {searchQuery.trim() && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-2">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  該当する患者がいません
                </p>
              ) : (
                searchResults.map((profile) => {
                  const isSelected = selectedMembers.some(
                    (m) => m.profile.id === profile.id
                  );
                  return (
                    <div
                      key={profile.id}
                      className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                      onClick={() => handleToggleMember(profile)}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1">
                        <span className="font-medium">
                          {profile.display_name || "—"}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({profile.ticket_number || "診察券なし"})
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 選択されたメンバー */}
          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">追加するメンバー ({selectedMembers.length}人)</Label>
              <div className="space-y-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member.profile.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-medium">
                        {member.profile.display_name || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {member.profile.ticket_number || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value: "parent" | "child") =>
                          handleRoleChange(member.profile.id, value)
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">保護者</SelectItem>
                          <SelectItem value="child">子ども</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setSelectedMembers(
                            selectedMembers.filter((m) => m.profile.id !== member.profile.id)
                          )
                        }
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            disabled={isSubmitting || selectedMembers.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                追加中...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                メンバーを追加
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
