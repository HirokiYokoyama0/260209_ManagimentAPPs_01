"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Users } from "lucide-react";
import type { BroadcastSegment, Profile, BroadcastLog } from "@/lib/types";
import useSWR from "swr";
import { formatJst } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// 未設定ユーザー向け定型文
const UNREGISTERED_USER_TEMPLATE = `いつも当院をご利用いただき、誠にありがとうございます。

こちらのメッセージは、会員制アプリの初期設定が完了していない患者様にお送りしております。

下記の流れに沿ってご登録のご協力をお願い致します。

·····················································
トーク画面内のメニュー
↓
デジタル会員証
↓
設定（画面右下）
↓
患者情報の編集マークより
①お名前（漢字フルネーム）
②診察券番号（診察券アプリ：私の歯医者さんに記載あり）
③誕生月
の3項目の入力をお願い致します。
·······················································

ご不明な点がございましたら医院までお問い合わせ頂けますと幸いです。
今後とも、つくばホワイト歯科をよろしくお願い致します。`;

export default function BroadcastPage() {
  return (
    <div className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-6">一斉配信</h1>

      <Tabs defaultValue="new" className="space-y-4">
        <TabsList>
          <TabsTrigger value="new">新規配信</TabsTrigger>
          <TabsTrigger value="history">配信履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <NewBroadcastTab />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type MessageType = "text" | "flex";

interface FlexTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  variables: string[];
  category: string;
}

function NewBroadcastTab() {
  const [segment, setSegment] = useState<BroadcastSegment>({});
  const [messageType, setMessageType] = useState<MessageType>("text");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [flexTemplates, setFlexTemplates] = useState<FlexTemplate[]>([]);
  const [preview, setPreview] = useState<{
    count: number;
    profiles: Profile[];
    estimatedCost: number;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Flex Messageテンプレートを読み込み
  useEffect(() => {
    fetch("/api/flex-templates")
      .then((res) => res.json())
      .then((data) => {
        setFlexTemplates(data.templates || []);
        if (data.templates && data.templates.length > 0) {
          setSelectedTemplate(data.templates[0].id);
        }
      })
      .catch((err) => console.error("Failed to load flex templates:", err));
  }, []);

  // プレビュー取得
  const handlePreview = async () => {
    setIsLoadingPreview(true);
    setExcludedIds(new Set()); // 除外IDsをリセット
    try {
      const res = await fetch("/api/broadcast/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(segment),
      });
      const data = await res.json();
      setPreview(data);
    } catch (error) {
      console.error("Preview error:", error);
      alert("プレビューの取得に失敗しました");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // 未設定ユーザー向け定型文の挿入
  const handleInsertUnregisteredUserTemplate = () => {
    if (message.trim().length > 0) {
      const confirmed = confirm(
        "現在の内容を定型文で置き換えます。よろしいですか？"
      );
      if (!confirmed) return;
    }
    setMessage(UNREGISTERED_USER_TEMPLATE);
  };

  // 送信実行
  const handleSend = async () => {
    if (messageType === "text" && !message.trim()) {
      alert("メッセージを入力してください");
      return;
    }

    if (messageType === "flex" && !selectedTemplate) {
      alert("カードテンプレートを選択してください");
      return;
    }

    if (!preview || preview.count === 0) {
      alert("対象者がいません");
      return;
    }

    const actualCount = preview.count - excludedIds.size;

    if (actualCount === 0) {
      alert("送信対象者がいません（全員除外されています）");
      return;
    }

    const messageTypeLabel = messageType === "text" ? "テキストメッセージ" : "カードタイプメッセージ";
    const excludedMessage = excludedIds.size > 0 ? `\n除外: ${excludedIds.size}名` : "";
    const confirmed = confirm(
      `${actualCount}名に${messageTypeLabel}を送信します。よろしいですか？\n\n推定メッセージ通数: ${actualCount}通${excludedMessage}`
    );

    if (!confirmed) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/broadcast/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment,
          message,
          messageType,
          flexTemplateId: messageType === "flex" ? selectedTemplate : undefined,
          sentBy: "admin",
          excludedIds: Array.from(excludedIds),
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(
          `送信完了しました\n対象者: ${data.targetCount}名\n成功: ${data.successCount}名\n失敗: ${data.failedCount}名`
        );
        // リセット
        setMessage("");
        setSegment({});
        setPreview(null);
        setExcludedIds(new Set());
      } else {
        alert(`送信に失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error("Send error:", error);
      alert("送信に失敗しました");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* セグメント条件 */}
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">対象者の絞り込み</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>スタンプ数（最小）</Label>
            <Input
              type="number"
              placeholder="例: 10"
              value={segment.stampCount?.min || ""}
              onChange={(e) =>
                setSegment({
                  ...segment,
                  stampCount: {
                    ...segment.stampCount,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>

          <div>
            <Label>スタンプ数（最大）</Label>
            <Input
              type="number"
              placeholder="例: 20"
              value={segment.stampCount?.max || ""}
              onChange={(e) =>
                setSegment({
                  ...segment,
                  stampCount: {
                    ...segment.stampCount,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>

          <div>
            <Label>最終来院日数（最小）</Label>
            <Input
              type="number"
              placeholder="例: 90（日）"
              value={segment.lastVisitDays?.min || ""}
              onChange={(e) =>
                setSegment({
                  ...segment,
                  lastVisitDays: {
                    ...segment.lastVisitDays,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>

          <div>
            <Label>最終来院日数（最大）</Label>
            <Input
              type="number"
              placeholder="例: 180（日）"
              value={segment.lastVisitDays?.max || ""}
              onChange={(e) =>
                setSegment({
                  ...segment,
                  lastVisitDays: {
                    ...segment.lastVisitDays,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Label>
            <input
              type="checkbox"
              className="mr-2"
              checked={segment.isLineFriend || false}
              onChange={(e) =>
                setSegment({ ...segment, isLineFriend: e.target.checked })
              }
            />
            LINE友だち登録済みのみ
          </Label>
        </div>

        {/* 誕生月フィルター */}
        <div className="space-y-2">
          <Label>誕生月で絞り込み</Label>
          <div className="grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
              const isSelected = segment.birthMonths?.includes(month) || false;
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => {
                    const current = segment.birthMonths || [];
                    if (isSelected) {
                      // 選択解除
                      setSegment({
                        ...segment,
                        birthMonths: current.filter((m) => m !== month),
                      });
                    } else {
                      // 選択追加
                      setSegment({
                        ...segment,
                        birthMonths: [...current, month],
                      });
                    }
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {month}月
                </button>
              );
            })}
          </div>
          {segment.birthMonths && segment.birthMonths.length > 0 && (
            <p className="text-sm text-gray-600">
              選択中: {segment.birthMonths.sort((a, b) => a - b).map(m => `${m}月`).join(", ")}
            </p>
          )}
        </div>

        {/* 未入力項目フィルター */}
        <div className="space-y-2 pt-4 border-t">
          <Label className="text-base font-semibold">未入力項目で絞り込み</Label>
          <p className="text-sm text-gray-600">
            ※ 複数選択した場合、いずれか1つでも該当すれば抽出されます（OR条件）
          </p>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={segment.missingFields?.name || false}
                onChange={(e) =>
                  setSegment({
                    ...segment,
                    missingFields: {
                      ...segment.missingFields,
                      name: e.target.checked,
                    },
                  })
                }
              />
              氏名が未入力の人
            </Label>

            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={segment.missingFields?.ticketNumber || false}
                onChange={(e) =>
                  setSegment({
                    ...segment,
                    missingFields: {
                      ...segment.missingFields,
                      ticketNumber: e.target.checked,
                    },
                  })
                }
              />
              診察券番号が未入力の人
            </Label>

            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={segment.missingFields?.birthMonth || false}
                onChange={(e) =>
                  setSegment({
                    ...segment,
                    missingFields: {
                      ...segment.missingFields,
                      birthMonth: e.target.checked,
                    },
                  })
                }
              />
              誕生月が未入力の人
            </Label>
          </div>
        </div>

        <Button onClick={handlePreview} disabled={isLoadingPreview}>
          {isLoadingPreview ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              読み込み中...
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              対象者を確認
            </>
          )}
        </Button>
      </div>

      {/* プレビュー */}
      {preview && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">対象者プレビュー</h3>
            <p className="text-2xl font-bold text-blue-600 mb-1">
              {preview.count - excludedIds.size}名
            </p>
            {excludedIds.size > 0 && (
              <p className="text-sm text-gray-600">
                （除外: {excludedIds.size}名）
              </p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              推定メッセージ通数: {preview.count - excludedIds.size}通
            </p>
          </div>

          {preview.count > 500 && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
              ⚠️ 対象者が500名を超えています。個別除外機能を使う場合は、セグメント条件でさらに絞り込むことを推奨します。
            </div>
          )}

          <Button onClick={() => setShowAllModal(true)} variant="outline" className="w-full">
            全員を表示・編集
          </Button>
        </div>
      )}

      {/* メッセージタイプ選択 */}
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">📩 メッセージタイプ</h2>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: messageType === "text" ? "#3b82f6" : "#e5e7eb" }}>
            <input
              type="radio"
              name="messageType"
              value="text"
              checked={messageType === "text"}
              onChange={(e) => setMessageType(e.target.value as MessageType)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium">テキストメッセージ</div>
              <div className="text-sm text-gray-600">シンプルな文字メッセージを送信</div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: messageType === "flex" ? "#3b82f6" : "#e5e7eb" }}>
            <input
              type="radio"
              name="messageType"
              value="flex"
              checked={messageType === "flex"}
              onChange={(e) => setMessageType(e.target.value as MessageType)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium">カードタイプメッセージ (Flex Message)</div>
              <div className="text-sm text-gray-600">画像・ボタン付きのリッチメッセージを送信</div>
            </div>
          </label>
        </div>
      </div>

      {/* カードテンプレート選択 (Flex Messageの場合) */}
      {messageType === "flex" && (
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">カードテンプレート選択</h2>

          {flexTemplates.length === 0 ? (
            <p className="text-gray-500 text-sm">テンプレートを読み込んでいます...</p>
          ) : (
            <div className="space-y-3">
              {flexTemplates.map((template) => (
                <label
                  key={template.id}
                  className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: selectedTemplate === template.id ? "#3b82f6" : "#e5e7eb" }}
                >
                  <input
                    type="radio"
                    name="flexTemplate"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {template.emoji} {template.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{template.description}</div>
                    {template.variables.length > 0 && (
                      <div className="text-xs text-gray-500 mt-2">
                        使用できる変数: {template.variables.map((v) => `{${v}}`).join(", ")}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="text-blue-800">
              💡 <strong>ヒント:</strong> カードテンプレートは <code className="bg-blue-100 px-1 py-0.5 rounded">lib/flex-templates/</code> フォルダに配置されています。新しいテンプレートを追加するには、TypeScriptファイルとして作成し、<code className="bg-blue-100 px-1 py-0.5 rounded">index.ts</code> に登録してください。
            </p>
          </div>
        </div>
      )}

      {/* メッセージ (テキストメッセージの場合) */}
      {messageType === "text" && (
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">メッセージ</h2>

        <div>
          <Label>メッセージ内容</Label>
          <textarea
            className="w-full p-3 border rounded-md min-h-[200px]"
            placeholder="メッセージを入力してください&#10;&#10;変数を使えます:&#10;{name} - 患者名&#10;{stamp_count} - スタンプ数&#10;{ticket_number} - 診察券番号"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
          />
          <p className="text-sm text-gray-500 mt-1">
            {message.length} / 1000文字
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMessage(message + "{name}")}
          >
            {"{name}"}を挿入
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMessage(message + "{stamp_count}")}
          >
            {"{stamp_count}"}を挿入
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMessage(message + "{ticket_number}")}
          >
            {"{ticket_number}"}を挿入
          </Button>

          {/* 未設定ユーザー向け定型文 */}
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInsertUnregisteredUserTemplate}
            className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
          >
            📝 未設定ユーザー用配信文章
          </Button>
        </div>
      </div>
      )}

      {/* 送信ボタン */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <Button
          onClick={handleSend}
          disabled={!preview || preview.count === 0 || isSending}
          size="lg"
          className="w-full"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              送信中...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {preview ? `${preview.count - excludedIds.size}名に送信` : "送信"}
            </>
          )}
        </Button>
      </div>

      {/* 全員表示・除外機能モーダル */}
      {preview && (
        <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                対象者一覧 ({preview.profiles.length}名)
              </DialogTitle>
            </DialogHeader>

            {/* 検索 */}
            <Input
              placeholder="氏名または診察券番号で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />

            {/* 一括操作 */}
            <div className="flex gap-2 mb-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExcludedIds(new Set())}
              >
                全員選択
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const allIds = new Set(preview.profiles.map(p => p.id));
                  setExcludedIds(allIds);
                }}
              >
                全員解除
              </Button>
            </div>

            {/* 対象者リスト */}
            <div className="overflow-y-auto flex-1 space-y-2 border rounded p-2">
              {preview.profiles
                .filter((p) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  const name = (p.display_name || p.real_name || "").toLowerCase();
                  const ticket = (p.ticket_number || "").toLowerCase();
                  return name.includes(query) || ticket.includes(query);
                })
                .map((p) => {
                  const isExcluded = excludedIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`p-3 border rounded ${
                        isExcluded ? "bg-gray-100 opacity-60" : "bg-white"
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={(e) => {
                            const newExcluded = new Set(excludedIds);
                            if (e.target.checked) {
                              newExcluded.delete(p.id);
                            } else {
                              newExcluded.add(p.id);
                            }
                            setExcludedIds(newExcluded);
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            {p.display_name || p.real_name || "名前未設定"}
                            {isExcluded && (
                              <Badge variant="secondary" className="ml-2">
                                除外済み
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            診察券: {p.ticket_number || "なし"} / スタンプ:{" "}
                            {p.stamp_count}個 / 最終来院:{" "}
                            {p.last_visit_date || "未設定"}
                          </div>
                        </div>
                      </label>
                    </div>
                  );
                })}
            </div>

            {/* フッター */}
            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                除外: {excludedIds.size}名 / 送信対象:{" "}
                {preview.profiles.length - excludedIds.size}名
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAllModal(false)}>
                  キャンセル
                </Button>
                <Button onClick={() => setShowAllModal(false)}>選択を確定</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function HistoryTab() {
  const { data, error, isLoading } = useSWR("/api/broadcast/logs", fetcher);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">配信履歴の取得に失敗しました</p>;
  }

  const logs: BroadcastLog[] = data?.logs || [];

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">
                送信日時
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                送信者
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                対象者数
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                成功/失敗
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                メッセージ
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                アクション
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  配信履歴がありません
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {formatJst(log.sent_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">{log.sent_by}</td>
                  <td className="px-4 py-3 text-sm">{log.target_count}名</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="secondary" className="mr-1">
                      成功 {log.success_count}
                    </Badge>
                    {log.failed_count > 0 && (
                      <Badge variant="destructive">
                        失敗 {log.failed_count}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">
                    {log.message_text.slice(0, 30)}...
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <LogDetailDialog log={log} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LogDetailDialog({ log }: { log: BroadcastLog }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          詳細
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>配信詳細</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>送信日時</Label>
            <p>{formatJst(log.sent_at)}</p>
          </div>
          <div>
            <Label>送信者</Label>
            <p>{log.sent_by}</p>
          </div>
          <div>
            <Label>対象者数</Label>
            <p>{log.target_count}名</p>
          </div>
          <div>
            <Label>送信結果</Label>
            <p>
              成功: {log.success_count}名 / 失敗: {log.failed_count}名
            </p>
          </div>
          <div>
            <Label>セグメント条件</Label>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(log.segment_conditions, null, 2)}
            </pre>
          </div>
          <div>
            <Label>メッセージ内容</Label>
            <div className="bg-gray-100 p-3 rounded whitespace-pre-wrap">
              {log.message_text}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
