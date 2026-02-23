"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import type { Profile } from "@/lib/types";
import { formatJst } from "@/lib/format";
import { formatVisitDate, isPastDate } from "@/lib/memo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MessageSendSheet } from "./message-send-sheet";
import { MobilePatientList } from "./mobile/mobile-patient-list";
import { CreateFamilyDialog } from "./create-family-dialog";
import { Minus, Plus, Hash, MessageCircle, Pencil, Loader2, AlertCircle, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PatientsTable() {
  const { data: profiles = [], error, mutate, isLoading} = useSWR<Profile[]>("/api/profiles", fetcher);
  const { data: families = [] } = useSWR<any[]>("/api/families", fetcher);
  const [search, setSearch] = useState("");
  const [messageProfile, setMessageProfile] = useState<Profile | null>(null);
  const [createFamilyProfile, setCreateFamilyProfile] = useState<Profile | null>(null);
  type SortKey = "ticket_number" | "stamp_count" | "last_visit_date" | "updated_at" | "is_line_friend" | "view_mode" | "family_category";
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "updated_at",
    direction: "desc",
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return profiles;
    const q = search.trim().toLowerCase();
    return profiles.filter(
      (p) =>
        (p.display_name?.toLowerCase().includes(q)) ||
        (p.real_name?.toLowerCase().includes(q)) ||
        (p.ticket_number?.toLowerCase().includes(q))
    );
  }, [profiles, search]);

  const sorted = useMemo(() => {
    const data = [...filtered];
    data.sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      const get = (p: Profile): string | number => {
        switch (sort.key) {
          case "ticket_number":
            return (p.ticket_number ?? "").toLowerCase();
          case "stamp_count":
            return p.stamp_count;
          case "last_visit_date":
            return p.last_visit_date ? Date.parse(p.last_visit_date) : 0;
          case "updated_at":
            return p.updated_at ? Date.parse(p.updated_at) : 0;
          case "is_line_friend":
            return p.is_line_friend ? 1 : 0;
          case "view_mode":
            return (p.view_mode ?? "").toLowerCase();
          case "family_category":
            return getFamilyCategory(p);
        }
      };
      const av = get(a);
      const bv = get(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return data;
  }, [filtered, sort]);

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

  async function updateStampDelta(id: string, delta: number) {
    const res = await fetch(`/api/profiles/${id}/stamp`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    mutate(
      profiles.map((p) => (p.id === id ? updated : p)),
      { revalidate: false }
    );
  }

  async function setStampCount(id: string, stamp_count: number) {
    const res = await fetch(`/api/profiles/${id}/stamp-set`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stamp_count }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    mutate(
      profiles.map((p) => (p.id === id ? updated : p)),
      { revalidate: false }
    );
  }

  async function updateProfile(
    id: string,
    data: {
      real_name?: string | null;
      ticket_number?: string | null;
      last_visit_date?: string | null;
      view_mode?: string | null;
      next_visit_date?: string | null;
      next_memo?: string | null;
    }
  ) {
    const res = await fetch(`/api/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const updated = await res.json();
    mutate(
      profiles.map((p) => (p.id === id ? updated : p)),
      { revalidate: false }
    );
  }

  async function toggleViewMode(id: string, currentMode: string | null | undefined) {
    // 現在のモードに基づいて切り替え
    // 未設定または"adult"の場合は"kids"に、"kids"の場合は"adult"に
    const newMode = currentMode === "kids" ? "adult" : "kids";
    await updateProfile(id, { view_mode: newMode });
  }

  // 区分を計算する関数
  function getFamilyCategory(profile: Profile): string {
    if (!profile.family_id || !profile.family_role) {
      return "なし";
    }

    // 家族のメンバー数を取得
    const family = families.find((f: any) => f.family_id === profile.family_id);
    const memberCount = family?.member_count || 0;

    // 1人家族の場合は「なし」と表示
    if (memberCount === 1) {
      return "なし";
    }

    if (profile.family_role === "parent") {
      return "保護者";
    }
    // family_role === "child"
    return profile.line_user_id ? "子（スマホあり）" : "子（スマホなし）";
  }

  if (error) {
    return (
      <p className="text-destructive">一覧の取得に失敗しました。しばらくしてから再試行してください。</p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-12 w-12 text-sky-500 animate-spin" />
        <p className="text-muted-foreground text-sm">患者データを読み込んでいます...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="名前または診察券番号で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full lg:max-w-sm bg-white/80"
        />
        <span className="hidden text-xs text-muted-foreground md:inline">
          Supabase の `profiles` テーブルとリアルタイム連携しています。
        </span>
      </div>

      {/* PC用: 既存のTable（lg以上で表示） */}
      <div className="hidden lg:block overflow-hidden rounded-xl border bg-white/90 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>LINE表示名</TableHead>
              <TableHead>本名</TableHead>
              <TableHead
                onClick={() => handleSort("family_category")}
                className="cursor-pointer select-none w-[140px]"
              >
                <span className="inline-flex items-center gap-1">
                  区分
                  {renderSortIndicator("family_category")}
                </span>
              </TableHead>
              <TableHead
                onClick={() => handleSort("ticket_number")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center gap-1">
                  診察券番号
                  {renderSortIndicator("ticket_number")}
                </span>
              </TableHead>
              <TableHead
                onClick={() => handleSort("stamp_count")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center gap-1">
                  スタンプ数
                  {renderSortIndicator("stamp_count")}
                </span>
              </TableHead>
              <TableHead
                onClick={() => handleSort("last_visit_date")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center gap-1">
                  最終来院
                  {renderSortIndicator("last_visit_date")}
                </span>
              </TableHead>
              <TableHead
                onClick={() => handleSort("updated_at")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center gap-1">
                  最新ログイン
                  {renderSortIndicator("updated_at")}
                </span>
              </TableHead>
              <TableHead
                onClick={() => handleSort("is_line_friend")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center gap-1">
                  公式アカ友だち
                  {renderSortIndicator("is_line_friend")}
                </span>
              </TableHead>
              <TableHead
                onClick={() => handleSort("view_mode")}
                className="cursor-pointer select-none"
              >
                <span className="inline-flex items-center gap-1">
                  表示モード
                  {renderSortIndicator("view_mode")}
                </span>
              </TableHead>
              <TableHead>次回来院予定日</TableHead>
              <TableHead className="w-[200px]">次回メモ</TableHead>
              <TableHead className="w-[300px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                  {profiles.length === 0 ? "患者データがありません。" : "該当する患者がいません。"}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((p) => (
                <TableRow
                  key={p.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <TableCell className="font-medium">
                    {p.display_name || "—"}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    {p.real_name || "—"}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {getFamilyCategory(p)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.ticket_number || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-semibold">
                      {p.stamp_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {p.last_visit_date ? formatJst(p.last_visit_date) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap" title="最新ログイン">
                    {formatJst(p.updated_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    {p.is_line_friend === true ? (
                      <span className="text-emerald-600 font-medium" title="公式アカウントの友だち登録済み">〇 済</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.view_mode === "kids"}
                        onCheckedChange={() => toggleViewMode(p.id, p.view_mode)}
                        aria-label={`${p.display_name || p.id}の表示モードを切り替え`}
                      />
                      <span className="text-sm text-muted-foreground min-w-[40px]">
                        {p.view_mode === "kids" ? "キッズ" : "大人"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap align-top">
                    {p.next_visit_date ? formatVisitDate(p.next_visit_date) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[11px] max-w-[200px] align-top">
                    <div className="whitespace-pre-wrap break-words leading-relaxed">
                      {p.next_memo || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ProfileEditDialog
                        profile={p}
                        onSave={(data) => updateProfile(p.id, data)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-800"
                        onClick={() => updateStampDelta(p.id, -1)}
                        disabled={p.stamp_count <= 0}
                      >
                        <Minus className="h-3.5 w-3.5" /> -1
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-800"
                        onClick={() => updateStampDelta(p.id, 1)}
                      >
                        <Plus className="h-3.5 w-3.5" /> +1
                      </Button>
                      <StampEditDialog profile={p} onSave={(count) => setStampCount(p.id, count)} />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400"
                        onClick={() => setCreateFamilyProfile(p)}
                      >
                        <Users className="h-3.5 w-3.5" />
                        家族作成
                      </Button>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm"
                        onClick={() => setMessageProfile(p)}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        メッセージ
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* スマホ用: 新規のCard一覧（lg未満で表示） */}
      <div className="block lg:hidden">
        <MobilePatientList
          patients={sorted}
          onStampChange={updateStampDelta}
          onEdit={updateProfile}
          onStampSet={setStampCount}
          onMessage={setMessageProfile}
          onViewModeToggle={toggleViewMode}
        />
      </div>

      {messageProfile && (
        <MessageSendSheet
          profile={messageProfile}
          open={!!messageProfile}
          onOpenChange={(open) => !open && setMessageProfile(null)}
        />
      )}

      {createFamilyProfile && (
        <CreateFamilyDialog
          representativeProfile={createFamilyProfile}
          open={!!createFamilyProfile}
          onOpenChange={(open) => !open && setCreateFamilyProfile(null)}
          onSuccess={() => mutate()}
        />
      )}
    </div>
  );
}

function ProfileEditDialog({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (data: {
    real_name: string | null;
    ticket_number: string | null;
    last_visit_date: string | null;
    view_mode: string | null;
    next_visit_date: string | null;
    next_memo: string | null;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [realName, setRealName] = useState(profile.real_name ?? "");
  const [ticketNumber, setTicketNumber] = useState(profile.ticket_number ?? "");
  const [lastVisitDate, setLastVisitDate] = useState(
    profile.last_visit_date ? profile.last_visit_date.slice(0, 10) : ""
  );
  const [viewMode, setViewMode] = useState(profile.view_mode ?? "");
  const [nextVisitDate, setNextVisitDate] = useState(profile.next_visit_date ?? "");
  const [nextMemo, setNextMemo] = useState(profile.next_memo ?? "");

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setRealName(profile.real_name ?? "");
      setTicketNumber(profile.ticket_number ?? "");
      setLastVisitDate(profile.last_visit_date ? profile.last_visit_date.slice(0, 10) : "");
      setViewMode(profile.view_mode ?? "");
      setNextVisitDate(profile.next_visit_date ?? "");
      setNextMemo(profile.next_memo ?? "");
    }
  };

  const handleSave = () => {
    onSave({
      real_name: realName.trim() || null,
      ticket_number: ticketNumber.trim() || null,
      last_visit_date: lastVisitDate.trim() || null,
      view_mode: viewMode.trim() || null,
      next_visit_date: nextVisitDate.trim() || null,
      next_memo: nextMemo.trim() || null,
    });
    setOpen(false);
  };

  const isNextDatePast = nextVisitDate ? isPastDate(nextVisitDate) : false;
  const isMemoTooLong = nextMemo.length > 200;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-amber-300 text-amber-800 hover:bg-amber-50 hover:border-amber-400"
        >
          <Pencil className="h-3.5 w-3.5" />
          編集
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>患者情報を編集</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* 基本情報セクション */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">基本情報</h3>
            <div className="grid gap-2">
              <Label htmlFor="real-name">本名（管理画面専用）</Label>
              <Input
                id="real-name"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="例: 山田 太郎"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ticket-number">診察券番号</Label>
                <Input
                  id="ticket-number"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="例: 12345"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-visit-date">最終来院日</Label>
                <Input
                  id="last-visit-date"
                  type="date"
                  value={lastVisitDate}
                  onChange={(e) => setLastVisitDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="view-mode">表示モード</Label>
              <select
                id="view-mode"
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

          <Separator />

          {/* 次回来院予定セクション */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">次回来院予定</h3>
            <div className="grid gap-2">
              <Label htmlFor="next-visit-date">次回来院予定日</Label>
              <Input
                id="next-visit-date"
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
                <Label htmlFor="next-memo">次回メモ</Label>
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
                  id="next-memo"
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
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isMemoTooLong}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StampEditDialog({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (count: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(profile.stamp_count));

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) setValue(String(profile.stamp_count));
  };

  const handleSave = () => {
    const n = parseInt(value, 10);
    if (!Number.isInteger(n) || n < 0 || n > 999) return;
    onSave(n);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400"
        >
          <Hash className="h-3.5 w-3.5" />
          数値
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>スタンプ数を直接入力</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="stamp-count">
              {profile.display_name || profile.id} のスタンプ数（0〜999）
            </Label>
            <Input
              id="stamp-count"
              type="number"
              min={0}
              max={999}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
