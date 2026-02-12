"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import type { Profile } from "@/lib/types";
import { formatJst } from "@/lib/format";
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
import { Minus, Plus, Hash, MessageCircle, Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PatientsTable() {
  const { data: profiles = [], error, mutate } = useSWR<Profile[]>("/api/profiles", fetcher);
  const [search, setSearch] = useState("");
  const [messageProfile, setMessageProfile] = useState<Profile | null>(null);
  type SortKey = "ticket_number" | "stamp_count" | "last_visit_date" | "updated_at" | "is_line_friend" | "view_mode";
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
    data: { ticket_number?: string | null; last_visit_date?: string | null; view_mode?: string | null }
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

  if (error) {
    return (
      <p className="text-destructive">一覧の取得に失敗しました。しばらくしてから再試行してください。</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="名前または診察券番号で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-white/80"
        />
        <span className="hidden text-xs text-muted-foreground md:inline">
          Supabase の `profiles` テーブルとリアルタイム連携しています。
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border bg-white/90 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>氏名</TableHead>
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
              <TableHead className="w-[300px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
      {messageProfile && (
        <MessageSendSheet
          profile={messageProfile}
          open={!!messageProfile}
          onOpenChange={(open) => !open && setMessageProfile(null)}
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
  onSave: (data: { ticket_number: string | null; last_visit_date: string | null; view_mode: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(profile.ticket_number ?? "");
  const [lastVisitDate, setLastVisitDate] = useState(
    profile.last_visit_date ? profile.last_visit_date.slice(0, 10) : ""
  );
  const [viewMode, setViewMode] = useState(profile.view_mode ?? "");

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setTicketNumber(profile.ticket_number ?? "");
      setLastVisitDate(profile.last_visit_date ? profile.last_visit_date.slice(0, 10) : "");
      setViewMode(profile.view_mode ?? "");
    }
  };

  const handleSave = () => {
    onSave({
      ticket_number: ticketNumber.trim() || null,
      last_visit_date: lastVisitDate.trim() || null,
      view_mode: viewMode.trim() || null,
    });
    setOpen(false);
  };

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>診察券番号・最終来院日・表示モードを編集</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
