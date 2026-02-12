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
