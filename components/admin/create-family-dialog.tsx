"use client";

import { useState } from "react";
import useSWR from "swr";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Loader2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type SelectedMember = {
  profile: Profile;
  role: "parent" | "child";
};

export function CreateFamilyDialog({
  representativeProfile,
  open,
  onOpenChange,
  onSuccess,
}: {
  representativeProfile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [familyName, setFamilyName] = useState(
    `${representativeProfile.display_name || "ユーザー"}の家族`
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: allProfiles = [] } = useSWR<Profile[]>("/api/profiles", fetcher);

  // 検索結果をフィルタリング（代表者自身と既に選択されたメンバーを除外）
  const searchResults = allProfiles.filter((p) => {
    if (p.id === representativeProfile.id) return false;
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

  function handleRemoveMember(userId: string) {
    setSelectedMembers(selectedMembers.filter((m) => m.profile.id !== userId));
  }

  async function handleSubmit() {
    if (!familyName.trim()) {
      alert("家族名を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      // 代表者を含む全メンバーのIDリスト
      const allMemberIds = [
        representativeProfile.id,
        ...selectedMembers.map((m) => m.profile.id),
      ];

      // 家族を作成（メンバーも一括登録）
      const createResponse = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_name: familyName.trim(),
          representative_user_id: representativeProfile.id,
          member_ids: allMemberIds,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "家族の作成に失敗しました");
      }

      onSuccess();
      onOpenChange(false);

      // リセット
      setFamilyName(`${representativeProfile.display_name || "ユーザー"}の家族`);
      setSearchQuery("");
      setSelectedMembers([]);
    } catch (error) {
      console.error("家族作成エラー:", error);
      alert(error instanceof Error ? error.message : "家族の作成に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            家族を作成 - {representativeProfile.display_name || "ユーザー"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 家族名 */}
          <div className="space-y-2">
            <Label htmlFor="family-name">家族名</Label>
            <Input
              id="family-name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="例: 横山浩紀の家族"
            />
          </div>

          {/* 代表者情報 */}
          <div className="space-y-2">
            <Label>代表者</Label>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
              <Badge>保護者</Badge>
              <span className="font-medium">
                {representativeProfile.display_name || "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                診察券: {representativeProfile.ticket_number || "—"}
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold">家族メンバーを追加</Label>
          </div>

          {/* 検索ボックス */}
          <div className="space-y-2">
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
              <Label className="text-sm font-semibold">選択されたメンバー</Label>
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
                        onClick={() => handleRemoveMember(member.profile.id)}
                      >
                        <X className="h-4 w-4" />
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
            disabled={isSubmitting || !familyName.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                作成中...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                家族を作成
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
