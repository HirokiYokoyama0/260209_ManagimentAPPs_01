"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { User, Clock, Calendar, CheckCircle2, XCircle } from "lucide-react";
import type { StaffWithLastLogin } from "@/app/api/admin/staff/route";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StaffListPage() {
  const { data, error, isLoading } = useSWR<{ staff: StaffWithLastLogin[] }>(
    "/api/admin/staff",
    fetcher
  );

  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">スタッフアカウント一覧</h1>
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          スタッフ一覧の取得に失敗しました
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">スタッフアカウント一覧</h1>
        <div className="text-sm text-slate-500">読み込み中...</div>
      </div>
    );
  }

  // フィルタリング
  const filteredStaff = data.staff.filter((s) => {
    if (filterActive === "active") return s.is_active;
    if (filterActive === "inactive") return !s.is_active;
    return true;
  });

  // 統計情報
  const totalStaff = data.staff.length;
  const activeStaff = data.staff.filter((s) => s.is_active).length;
  const inactiveStaff = totalStaff - activeStaff;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">スタッフアカウント一覧</h1>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <User className="h-4 w-4" />
          <span>
            全 {totalStaff} 名（有効 {activeStaff} / 無効 {inactiveStaff}）
          </span>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterActive("all")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filterActive === "all"
              ? "bg-sky-500 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          すべて ({totalStaff})
        </button>
        <button
          onClick={() => setFilterActive("active")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filterActive === "active"
              ? "bg-emerald-500 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          有効 ({activeStaff})
        </button>
        <button
          onClick={() => setFilterActive("inactive")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filterActive === "inactive"
              ? "bg-slate-500 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          無効 ({inactiveStaff})
        </button>
      </div>

      {/* スタッフ一覧テーブル */}
      {filteredStaff.length === 0 ? (
        <div className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">
          該当するスタッフがいません
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  ログインID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  表示名
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  最終ログイン
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  アカウント作成日
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50 transition">
                  <td className="whitespace-nowrap px-6 py-4">
                    {staff.is_active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        有効
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        <XCircle className="h-3.5 w-3.5" />
                        無効
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="font-mono text-sm font-medium text-slate-900">
                        {staff.login_id}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {staff.display_name || (
                      <span className="text-slate-400">（未設定）</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {staff.last_login_at ? (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>
                          {format(new Date(staff.last_login_at), "yyyy/MM/dd HH:mm", {
                            locale: ja,
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">ログインなし</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>
                        {format(new Date(staff.created_at), "yyyy/MM/dd", {
                          locale: ja,
                        })}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 補足情報 */}
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-medium">ℹ️ スタッフアカウントについて</p>
        <ul className="mt-2 ml-4 list-disc space-y-1 text-blue-600">
          <li>「無効」に設定されたアカウントはログインできません</li>
          <li>最終ログイン時刻は activity_logs の login イベントから取得しています</li>
          <li>アカウントの追加・編集・削除機能は将来実装予定です</li>
        </ul>
      </div>
    </div>
  );
}
