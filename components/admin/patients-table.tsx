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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PatientsTable() {
  const { data: profiles = [], error, mutate } = useSWR<Profile[]>("/api/profiles", fetcher);
  const [search, setSearch] = useState("");
  const [messageProfile, setMessageProfile] = useState<Profile | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return profiles;
    const q = search.trim().toLowerCase();
    return profiles.filter(
      (p) =>
        (p.display_name?.toLowerCase().includes(q)) ||
        (p.ticket_number?.toLowerCase().includes(q))
    );
  }, [profiles, search]);

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
    data: { ticket_number?: string | null; last_visit_date?: string | null }
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

  if (error) {
    return (
      <p className="text-destructive">一覧の取得に失敗しました。しばらくしてから再試行してください。</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="名前または診察券番号で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>氏名</TableHead>
              <TableHead>診察券番号</TableHead>
              <TableHead>スタンプ数</TableHead>
              <TableHead>最終来院</TableHead>
              <TableHead>更新</TableHead>
              <TableHead className="w-[300px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {profiles.length === 0 ? "患者データがありません。" : "該当する患者がいません。"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
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
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatJst(p.updated_at)}
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
  onSave: (data: { ticket_number: string | null; last_visit_date: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(profile.ticket_number ?? "");
  const [lastVisitDate, setLastVisitDate] = useState(
    profile.last_visit_date ? profile.last_visit_date.slice(0, 10) : ""
  );

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setTicketNumber(profile.ticket_number ?? "");
      setLastVisitDate(profile.last_visit_date ? profile.last_visit_date.slice(0, 10) : "");
    }
  };

  const handleSave = () => {
    onSave({
      ticket_number: ticketNumber.trim() || null,
      last_visit_date: lastVisitDate.trim() || null,
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
          <DialogTitle>診察券番号・最終来院日を編集</DialogTitle>
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
