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
    preview: Profile[];
    estimatedCost: number;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);

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

    const messageTypeLabel = messageType === "text" ? "テキストメッセージ" : "カードタイプメッセージ";
    const confirmed = confirm(
      `${preview.count}名に${messageTypeLabel}を送信します。よろしいですか？\n\n推定メッセージ通数: ${preview.estimatedCost}通`
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
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold mb-2">対象者プレビュー</h3>
          <p className="text-2xl font-bold text-blue-600 mb-2">
            {preview.count}名
          </p>
          <p className="text-sm text-gray-600 mb-4">
            推定メッセージ通数: {preview.estimatedCost}通
          </p>

          {preview.preview.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium">最初の10名:</p>
              {preview.preview.map((p, i) => (
                <div key={p.id} className="text-sm text-gray-700">
                  {i + 1}. {p.display_name || "名前未設定"} (スタンプ:{" "}
                  {p.stamp_count}個)
                </div>
              ))}
            </div>
          )}
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

        <div className="flex gap-2">
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
              {preview ? `${preview.count}名に送信` : "送信"}
            </>
          )}
        </Button>
      </div>
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
