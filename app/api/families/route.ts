import { logActivityIfStaff } from "@/lib/activity-log";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";
import type { Family, FamilyStampTotal, Profile } from "@/lib/types";

/**
 * GET /api/families
 * 家族一覧を取得（family_stamp_totals ビューから）
 * 注: 管理ダッシュボード用のため、RLSをバイパスする管理者用クライアントを使用
 */
export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("family_stamp_totals")
    .select("*")
    .order("total_stamp_count", { ascending: false });

  if (error) {
    console.error("家族一覧取得エラー:", error);
    return NextResponse.json(
      { error: "家族一覧の取得に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json(data as FamilyStampTotal[]);
}

/**
 * POST /api/families
 * 新規家族を作成し、既存ユーザーを移動
 * 注: 管理ダッシュボード用のため、RLSをバイパスする管理者用クライアントを使用
 *
 * Request Body:
 * {
 *   family_name: string,
 *   representative_user_id: string,
 *   member_ids: string[]  // 家族に追加するユーザーID配列
 * }
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();

  try {
    const body = await request.json();
    const { family_name, representative_user_id, member_ids } = body;

    // バリデーション
    if (!family_name || !representative_user_id || !Array.isArray(member_ids)) {
      return NextResponse.json(
        { error: "family_name, representative_user_id, member_ids は必須です" },
        { status: 400 }
      );
    }

    if (member_ids.length === 0) {
      return NextResponse.json(
        { error: "member_ids には少なくとも1人のユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // 代表者が member_ids に含まれているか確認
    if (!member_ids.includes(representative_user_id)) {
      return NextResponse.json(
        { error: "representative_user_id は member_ids に含まれている必要があります" },
        { status: 400 }
      );
    }

    // 新しい家族を作成
    const { data: newFamily, error: familyError } = await supabase
      .from("families")
      .insert({
        family_name,
        representative_user_id,
      })
      .select()
      .single();

    if (familyError) {
      console.error("家族作成エラー:", familyError);
      return NextResponse.json(
        { error: "家族の作成に失敗しました" },
        { status: 500 }
      );
    }

    // 各メンバーの旧家族IDを取得
    const { data: members, error: membersError } = await supabase
      .from("profiles")
      .select("id, family_id")
      .in("id", member_ids);

    if (membersError) {
      console.error("メンバー情報取得エラー:", membersError);
      return NextResponse.json(
        { error: "メンバー情報の取得に失敗しました" },
        { status: 500 }
      );
    }

    // 旧家族IDを収集（重複削除）
    const oldFamilyIds = Array.from(
      new Set(
        members
          ?.map((m) => m.family_id)
          .filter((id): id is string => id !== null && id !== newFamily.id) || []
      )
    );

    // メンバーを新しい家族に移動
    for (const member_id of member_ids) {
      const family_role = member_id === representative_user_id ? "parent" : "child";

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          family_id: newFamily.id,
          family_role,
        })
        .eq("id", member_id);

      if (updateError) {
        console.error(`メンバー ${member_id} の更新エラー:`, updateError);
      }
    }

    // 旧家族のメンバー数を確認し、0になった家族を削除
    for (const oldFamilyId of oldFamilyIds) {
      const { count, error: countError } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("family_id", oldFamilyId);

      if (countError) {
        console.error("旧家族のメンバー数確認エラー:", countError);
        continue;
      }

      // メンバーが0人になった家族を削除
      if (count === 0) {
        const { error: deleteError } = await supabase
          .from("families")
          .delete()
          .eq("id", oldFamilyId);

        if (deleteError) {
          console.error(`旧家族 ${oldFamilyId} の削除エラー:`, deleteError);
        }
      }
    }

    await logActivityIfStaff(request, "family_create", {
      targetType: "family",
      targetId: newFamily.id,
    });

    return NextResponse.json(newFamily as Family, { status: 201 });
  } catch (error) {
    console.error("家族作成処理エラー:", error);
    return NextResponse.json(
      { error: "家族の作成に失敗しました" },
      { status: 500 }
    );
  }
}
