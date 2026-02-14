export type Profile = {
  id: string;
  line_user_id: string;
  display_name: string | null;
  picture_url: string | null;
  stamp_count: number;
  ticket_number: string | null;
  last_visit_date: string | null;
  created_at: string;
  updated_at: string;
  /** 公式アカウントの友だち登録済みか（Supabase の is_line_friend）。カラム未追加の場合は undefined */
  is_line_friend?: boolean | null;
  /** 表示モード（adult または kids） */
  view_mode?: string | null;
};

// ============================================
// 一斉配信機能の型定義
// ============================================

/** 一斉配信のセグメント条件 */
export type BroadcastSegment = {
  /** スタンプ数の範囲 */
  stampCount?: {
    min?: number;
    max?: number;
  };
  /** 最終来院からの日数範囲 */
  lastVisitDays?: {
    min?: number;
    max?: number;
  };
  /** 表示モード */
  viewMode?: 'adult' | 'kids' | null;
  /** 公式アカ友だち登録済みのみ */
  isLineFriend?: boolean;
};

/** 配信プレビューのレスポンス */
export type BroadcastPreview = {
  /** 対象者数 */
  count: number;
  /** プレビュー（最初の10件程度） */
  preview: Profile[];
  /** 推定メッセージ通数 */
  estimatedCost: number;
};

/** 配信実行のリクエスト */
export type BroadcastSendRequest = {
  /** セグメント条件 */
  segment: BroadcastSegment;
  /** メッセージ内容（変数含む） */
  message: string;
  /** 送信者名 */
  sentBy: string;
  /** テストモード（管理者にのみ送信） */
  testMode?: boolean;
};

/** 配信実行のレスポンス */
export type BroadcastSendResponse = {
  /** 成功フラグ */
  success: boolean;
  /** broadcast_logs の ID */
  broadcastLogId: string;
  /** 対象者数 */
  targetCount: number;
  /** 送信成功数 */
  successCount: number;
  /** 送信失敗数 */
  failedCount: number;
  /** エラーメッセージ（失敗時） */
  error?: string;
};

/** 配信ログ */
export type BroadcastLog = {
  id: string;
  sent_by: string;
  segment_conditions: BroadcastSegment;
  message_text: string;
  target_count: number;
  success_count: number;
  failed_count: number;
  sent_at: string;
  created_at: string;
};

// ============================================
// 特典交換履歴機能の型定義
// ============================================

/** 特典マスター */
export type Reward = {
  id: string;
  name: string;
  description: string | null;
  required_stamps: number;
  stock_count: number | null;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

/** 特典交換履歴 */
export type RewardExchange = {
  id: string;
  user_id: string;
  reward_id: string;
  stamp_count_used: number;
  status: 'pending' | 'completed' | 'cancelled';
  exchanged_at: string;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
};

/** 詳細情報付き交換履歴（JOIN結果） */
export type RewardExchangeWithDetails = RewardExchange & {
  user_name: string;
  user_picture_url: string | null;
  reward_name: string;
  reward_image_url: string | null;
};
