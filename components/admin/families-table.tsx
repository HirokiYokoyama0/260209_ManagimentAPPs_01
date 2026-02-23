"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import type { Family, FamilyStampTotal, FamilyWithMembers, Profile } from "@/lib/types";
import { formatJst } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, Users, Loader2 } from "lucide-react";
import { AddFamilyMemberDialog } from "./add-family-member-dialog";
import { EditFamilyDialog } from "./edit-family-dialog";
import { DeleteFamilyDialog } from "./delete-family-dialog";
import { RemoveFamilyMemberDialog } from "./remove-family-member-dialog";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function FamiliesTable() {
  const { data: families = [], error, isLoading } = useSWR<FamilyStampTotal[]>(
    "/api/families",
    fetcher
  );
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);
  const [addMemberFamily, setAddMemberFamily] = useState<FamilyWithMembers | null>(null);
  const [editFamily, setEditFamily] = useState<Family | null>(null);
  const [deleteFamily, setDeleteFamily] = useState<Family | null>(null);

  type SortKey = "family_name" | "total_stamp_count" | "total_visit_count" | "member_count" | "last_family_visit";
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "total_stamp_count",
    direction: "desc",
  });

  const sorted = useMemo(() => {
    // メンバー数2人以上の家族のみ表示（1人家族は本人のみなので除外）
    const data = families.filter((f: any) => f.member_count >= 2);
    data.sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      const get = (f: FamilyStampTotal): string | number => {
        switch (sort.key) {
          case "family_name":
            return (f.family_name ?? "").toLowerCase();
          case "total_stamp_count":
            return f.total_stamp_count;
          case "total_visit_count":
            return f.total_visit_count;
          case "member_count":
            return f.member_count;
          case "last_family_visit":
            return f.last_family_visit ? Date.parse(f.last_family_visit) : 0;
        }
      };
      const av = get(a);
      const bv = get(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return data;
  }, [families, sort]);

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  }

  function renderSortIndicator(column: SortKey) {
    if (sort.key !== column) {
      return <span className="ml-1 text-xs text-slate-400">⇅</span>;
    }
    return (
      <span className="ml-1 text-xs text-sky-600 font-semibold">
        {sort.direction === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  function toggleExpand(familyId: string) {
    setExpandedFamilyId((prev) => (prev === familyId ? null : familyId));
  }

  if (error) {
    return (
      <p className="text-destructive">
        家族一覧の取得に失敗しました。しばらくしてから再試行してください。
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-12 w-12 text-sky-500 animate-spin" />
        <p className="text-muted-foreground text-sm">家族データを読み込んでいます...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sorted.length}件の家族が登録されています（2人以上）
        </p>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Users className="h-4 w-4 mr-1" />
          家族を作成
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white/90 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead
                onClick={() => handleSort("family_name")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center gap-1">
                  家族名
                  {renderSortIndicator("family_name")}
                </span>
              </TableHead>
              <TableHead
                onClick={() => handleSort("member_count")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center gap-1">
                  メンバー数
                  {renderSortIndicator("member_count")}
                </span>
              </TableHead>
              <TableHead
                onClick={() => handleSort("total_stamp_count")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center gap-1">
                  家族合計スタンプ
                  {renderSortIndicator("total_stamp_count")}
                </span>
              </TableHead>
              <TableHead
                onClick={() => handleSort("total_visit_count")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center gap-1">
                  家族合計来院回数
                  {renderSortIndicator("total_visit_count")}
                </span>
              </TableHead>
              <TableHead
                onClick={() => handleSort("last_family_visit")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center gap-1">
                  最終来院日
                  {renderSortIndicator("last_family_visit")}
                </span>
              </TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  家族データがありません。
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((family) => (
                <FamilyRow
                  key={family.family_id}
                  family={family}
                  isExpanded={expandedFamilyId === family.family_id}
                  onToggleExpand={() => toggleExpand(family.family_id)}
                  onAddMember={(familyData) => setAddMemberFamily(familyData)}
                  onEdit={(id, name) => setEditFamily({
                    id,
                    family_name: name,
                    representative_user_id: family.representative_user_id,
                    created_at: family.created_at,
                    updated_at: family.updated_at
                  })}
                  onDelete={(id, name) => setDeleteFamily({
                    id,
                    family_name: name,
                    representative_user_id: family.representative_user_id,
                    created_at: family.created_at,
                    updated_at: family.updated_at
                  })}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {addMemberFamily && (
        <AddFamilyMemberDialog
          family={addMemberFamily}
          open={!!addMemberFamily}
          onOpenChange={(open) => !open && setAddMemberFamily(null)}
          onSuccess={() => {
            setAddMemberFamily(null);
            // TODO: mutate() を呼んで再取得
          }}
        />
      )}

      {editFamily && (
        <EditFamilyDialog
          family={editFamily}
          open={!!editFamily}
          onOpenChange={(open) => !open && setEditFamily(null)}
          onSuccess={() => {
            setEditFamily(null);
            // TODO: mutate() を呼んで再取得
          }}
        />
      )}

      {deleteFamily && (
        <DeleteFamilyDialog
          family={deleteFamily}
          open={!!deleteFamily}
          onOpenChange={(open) => !open && setDeleteFamily(null)}
          onSuccess={() => {
            setDeleteFamily(null);
            setExpandedFamilyId(null);
            // TODO: mutate() を呼んで再取得
          }}
        />
      )}
    </div>
  );
}

function FamilyRow({
  family,
  isExpanded,
  onToggleExpand,
  onAddMember,
  onEdit,
  onDelete,
}: {
  family: FamilyStampTotal;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddMember: (family: FamilyWithMembers) => void;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const { data: familyData, isLoading } = useSWR<FamilyWithMembers>(
    isExpanded ? `/api/families/${family.family_id}` : null,
    fetcher
  );
  const members = familyData?.members || [];
  const [removeMember, setRemoveMember] = useState<Profile | null>(null);

  return (
    <>
      <TableRow className="hover:bg-slate-50/80 transition-colors">
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            {family.family_name}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="font-semibold">
            {family.member_count}人
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="font-semibold">
            {family.total_stamp_count}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="font-semibold">
            {family.total_visit_count}回
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
          {family.last_family_visit ? formatJst(family.last_family_visit) : "—"}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(family.family_id, family.family_name)}
            >
              編集
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 hover:text-rose-700"
              onClick={() => onDelete(family.family_id, family.family_name)}
            >
              解散
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* 展開時のメンバー一覧 */}
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={7} className="bg-slate-50/50 p-0">
            <div className="p-4 pl-12">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  メンバー情報を読み込んでいます...
                </div>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">メンバー情報がありません</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 mb-3">家族メンバー</p>
                  <div className="grid gap-2">
                    {members.map((member: Profile) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between bg-white rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={member.family_role === "parent" ? "default" : "secondary"}>
                            {member.family_role === "parent"
                              ? "保護者"
                              : member.line_user_id
                                ? "子（スマホあり）"
                                : "子（スマホなし）"
                            }
                          </Badge>
                          <span className="font-medium">{member.display_name || "—"}</span>
                          <span className="text-xs text-muted-foreground">
                            診察券: {member.ticket_number || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            スタンプ: <strong>{member.stamp_count}</strong>
                          </span>
                          <span className="text-muted-foreground">
                            来院: <strong>{member.visit_count || 0}回</strong>
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:text-rose-700"
                            onClick={() => setRemoveMember(member)}
                          >
                            削除
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => familyData && onAddMember(familyData)}
                    >
                      <Users className="h-3.5 w-3.5 mr-1" />
                      メンバーを追加
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}

      {removeMember && (
        <RemoveFamilyMemberDialog
          member={removeMember}
          familyId={family.family_id}
          familyName={family.family_name}
          open={!!removeMember}
          onOpenChange={(open) => !open && setRemoveMember(null)}
          onSuccess={() => {
            setRemoveMember(null);
            // TODO: mutate() を呼んで再取得
          }}
        />
      )}
    </>
  );
}
