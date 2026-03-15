import { logActivityIfStaff } from "@/lib/activity-log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * 単身ユーザーにリセット
 * family_id と family_role を NULL に設定
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createSupabaseServerClient();

    // 現在のプロフィール情報を取得
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("display_name, real_name, family_id, family_role")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "プロフィールが見つかりません" },
        { status: 404 }
      );
    }

    const oldFamilyId = profile.family_id;
    const oldFamilyRole = profile.family_role;

    console.log(`🔄 単身ユーザーにリセット: ${profile.display_name || profile.real_name || id}`);
    console.log(`   family_id: ${oldFamilyId} → NULL`);
    console.log(`   family_role: ${oldFamilyRole} → NULL`);

    // family_id と family_role を NULL に設定
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        family_id: null,
        family_role: null,
      })
      .eq("id", id);

    if (updateError) {
      console.error("❌ 単身ユーザーリセットエラー:", updateError);
      return NextResponse.json(
        { error: `リセット失敗: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log("✅ 単身ユーザーにリセットしました");

    // activity_logs に記録
    await logActivityIfStaff(request, "reset_to_individual", {
      targetType: "profile",
      targetId: id,
      details: {
        old_family_id: oldFamilyId,
        old_family_role: oldFamilyRole,
        new_family_id: null,
        new_family_role: null,
      },
    });

    // 更新後のプロフィールを取得して返却
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    return NextResponse.json(updatedProfile || { id, family_id: null, family_role: null });
  } catch (error: any) {
    console.error("❌ 単身ユーザーリセットエラー:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
