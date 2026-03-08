"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { ToothDiagram } from "@/components/admin/dental-records/tooth-diagram";
import { StatusButtons } from "@/components/admin/dental-records/status-buttons";
import type { Profile } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ToothState = {
  status: string;
  status_label: string;
  color: string;
  updated_at: string;
};

export default function DentalRecordsPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const { data: patient, error } = useSWR<Profile>(
    `/api/profiles/${patientId}`,
    fetcher
  );

  const { data: history = [] } = useSWR(
    `/api/admin/dental-records/history?patientId=${patientId}`,
    fetcher
  );

  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [toothStates, setToothStates] = useState<{ [key: string]: ToothState }>({});
  const [nextVisitMemo, setNextVisitMemo] = useState("");
  const [staffMemo, setStaffMemo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastRecord, setLastRecord] = useState<any>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // 最新記録を自動取得して表示
  useEffect(() => {
    if (history.length > 0 && !isNewRecord) {
      const latest = history[0];
      setLastRecord(latest);
      setToothStates(latest.tooth_data || {});
      setNextVisitMemo(latest.next_visit_memo || "");
      setStaffMemo(latest.staff_memo || "");
    }
  }, [history, isNewRecord]);

  const handleToothClick = (toothNumber: string) => {
    setSelectedTeeth((prev) =>
      prev.includes(toothNumber)
        ? prev.filter((t) => t !== toothNumber)
        : [...prev, toothNumber]
    );
  };

  const handleStatusSelect = (
    status: string,
    statusLabel: string,
    color: string
  ) => {
    if (selectedTeeth.length === 0) return;

    const now = new Date().toISOString();
    const newStates = { ...toothStates };

    selectedTeeth.forEach((toothNumber) => {
      if (status === "clear") {
        delete newStates[toothNumber];
      } else {
        newStates[toothNumber] = {
          status,
          status_label: statusLabel,
          color,
          updated_at: now,
        };
      }
    });

    setToothStates(newStates);
    setSelectedTeeth([]); // 選択解除
  };

  const handleNewRecord = () => {
    setIsNewRecord(true);
    setToothStates({});
    setNextVisitMemo("");
    setStaffMemo("");
    setSelectedTeeth([]);
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/dental-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          tooth_data: toothStates,
          next_visit_memo: nextVisitMemo.trim() || null,
          staff_memo: staffMemo.trim() || null,
          recorded_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("保存に失敗しました");
      }

      alert("ケア記録を保存しました");
      router.push("/admin");
    } catch (error) {
      console.error("Save error:", error);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
        </div>
        <p className="text-red-600">患者情報の取得に失敗しました。</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-12 w-12 text-sky-500 animate-spin" />
        <p className="text-muted-foreground text-sm">患者情報を読み込んでいます...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            患者: {patient.real_name || patient.display_name || "—"} さんのケア記録
          </h1>
        </div>
      </div>

      {/* 前回記録情報 */}
      {lastRecord && !isNewRecord && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                📅 前回記録: {formatDate(lastRecord.recorded_at)}
                <span className="ml-2 text-blue-700">
                  （{getDaysAgo(lastRecord.recorded_at)}日前）
                </span>
              </p>
              <p className="text-xs text-blue-700">
                💡 前回の状態を表示しています。変更した歯だけ保存してください
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewRecord}
              className="ml-4 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              🔄 新規記録
            </Button>
          </div>
        </div>
      )}

      {/* 新規記録モードの表示 */}
      {isNewRecord && (
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-sm">
          <p className="text-sm font-semibold text-green-900">
            ✨ 新規記録モード
          </p>
          <p className="text-xs text-green-700 mt-1">
            空の状態から記録を作成します
          </p>
        </div>
      )}

      {/* 歯並び図 */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">歯並び図</h2>
          {selectedTeeth.length > 0 && (
            <div className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
              選択中: {selectedTeeth.join(", ")}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          歯をクリックして選択してから、下の状態ボタンを押してください
        </p>
        <ToothDiagram
          toothStates={toothStates}
          selectedTeeth={selectedTeeth}
          onToothClick={handleToothClick}
          isKidsMode={patient.view_mode === "kids"}
        />
      </div>

      {/* 状態ボタン */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">状態を選択</h2>
        <StatusButtons
          onStatusSelect={handleStatusSelect}
          disabled={selectedTeeth.length === 0}
        />
      </div>

      {/* メモ欄 */}
      <div className="bg-white rounded-lg border p-6 shadow-sm space-y-6">
        <div>
          <Label htmlFor="next-visit-memo" className="text-base font-semibold">
            次回予定メモ（患者にも表示されます）
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            LIFFアプリの「My Dental Map」に表示されます
          </p>
          <Textarea
            id="next-visit-memo"
            value={nextVisitMemo}
            onChange={(e) => setNextVisitMemo(e.target.value)}
            placeholder="例: 次回は右下の詰め物チェック予定"
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {nextVisitMemo.length}/200文字
          </p>
        </div>

        <div>
          <Label htmlFor="staff-memo" className="text-base font-semibold">
            スタッフメモ（内部用・患者には非表示）
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            管理画面のみで表示されます
          </p>
          <Textarea
            id="staff-memo"
            value={staffMemo}
            onChange={(e) => setStaffMemo(e.target.value)}
            placeholder="例: 知覚過敏の訴えあり。様子見"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {staffMemo.length}/500文字
          </p>
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end gap-4">
        <Link href="/admin">
          <Button variant="outline" size="lg">
            キャンセル
          </Button>
        </Link>
        <Button
          size="lg"
          onClick={handleSave}
          disabled={isSaving || Object.keys(toothStates).length === 0}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            "保存して記録"
          )}
        </Button>
      </div>

      {/* ケア記録履歴 */}
      {history.length > 0 && (
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">ケア記録履歴</h2>
          <div className="space-y-3">
            {history.slice(0, 5).map((record: any) => (
              <div
                key={record.id}
                className="border-l-4 border-teal-500 bg-slate-50 p-4 rounded-r-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-medium text-slate-700">
                    {new Date(record.recorded_at).toLocaleString("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(record.tooth_data || {}).map(([tooth, data]: [string, any]) => (
                    <div
                      key={tooth}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: data.color + "20",
                        borderLeft: `3px solid ${data.color}`,
                      }}
                    >
                      <span className="font-semibold">{tooth}番</span>
                      <span className="text-slate-600">{data.status_label}</span>
                    </div>
                  ))}
                </div>
                {record.next_visit_memo && (
                  <div className="mt-2 text-sm text-slate-600 bg-white p-2 rounded border-l-2 border-blue-300">
                    <span className="font-medium text-blue-700">次回予定:</span> {record.next_visit_memo}
                  </div>
                )}
                {record.staff_memo && (
                  <div className="mt-2 text-sm text-slate-600 bg-white p-2 rounded border-l-2 border-amber-300">
                    <span className="font-medium text-amber-700">スタッフメモ:</span> {record.staff_memo}
                  </div>
                )}
              </div>
            ))}
          </div>
          {history.length > 5 && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              直近5件を表示中（全{history.length}件）
            </p>
          )}
        </div>
      )}
    </div>
  );
}
