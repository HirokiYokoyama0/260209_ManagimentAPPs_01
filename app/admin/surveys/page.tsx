"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Plus, FileQuestion, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Survey = {
  id: string;
  title: string;
  description: string | null;
  reward_stamps: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  targetCount?: number;
  answeredCount?: number;
  answerRate?: number;
  showOnLiffOpen?: boolean;
};

export default function SurveysPage() {
  const { data: surveys, error, isLoading } = useSWR<Survey[]>(
    "/api/surveys",
    fetcher
  );

  const list = surveys ?? [];

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">アンケート管理</h1>
        <Button asChild>
          <Link href="/admin/surveys/new" className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新規アンケート作成
          </Link>
        </Button>
      </div>

      <div className="mt-6 rounded-lg border bg-card">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <p className="p-6 text-destructive">
            一覧の取得に失敗しました。しばらくしてから再読み込みしてください。
          </p>
        )}
        {!isLoading && !error && list.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
            <FileQuestion className="h-12 w-12" />
            <p>アンケートがまだありません</p>
            <Button asChild variant="outline">
              <Link href="/admin/surveys/new">最初のアンケートを作成</Link>
            </Button>
          </div>
        )}
        {!isLoading && !error && list.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>タイトル</TableHead>
                <TableHead>報酬</TableHead>
                <TableHead>配信対象</TableHead>
                <TableHead>回答率</TableHead>
                <TableHead>状態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.id}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/surveys/${s.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {s.title}
                    </Link>
                  </TableCell>
                  <TableCell>{s.reward_stamps}個</TableCell>
                  <TableCell>
                    {s.targetCount != null ? `${s.targetCount}人` : "—"}
                  </TableCell>
                  <TableCell>
                    {s.targetCount != null && s.targetCount > 0
                      ? `${s.answerRate ?? 0}% (${s.answeredCount ?? 0})`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {s.is_active ? (
                      <Badge variant="default">公開中</Badge>
                    ) : (
                      <Badge variant="secondary">非公開</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/surveys/${s.id}/targets`}>
                        配信対象者
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
