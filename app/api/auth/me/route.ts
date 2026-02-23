import { verifySessionCookieServer, getSessionCookieName } from "@/lib/simple-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * ログイン中のスタッフ情報を返す。スタッフでない（従来の admin セッション）の場合は null を返す。
 */
export async function GET(request: NextRequest) {
  const cookieName = getSessionCookieName();
  const cookieValue = request.cookies.get(cookieName)?.value;
  const session = verifySessionCookieServer(cookieValue);
  if (!session || session.staffId === null) {
    return NextResponse.json({ staff: null });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: staff, error } = await supabase
      .from("staff")
      .select("id, login_id, display_name, is_active")
      .eq("id", session.staffId)
      .single();

    if (error || !staff || !staff.is_active) {
      return NextResponse.json({ staff: null });
    }
    return NextResponse.json({
      staff: {
        id: staff.id,
        login_id: staff.login_id,
        display_name: staff.display_name,
      },
    });
  } catch {
    return NextResponse.json({ staff: null });
  }
}
