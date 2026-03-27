import { logActivityIfStaff } from "@/lib/activity-log";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { handleStampMilestones } from "@/lib/milestones";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { delta } = body as { delta: number };

  // バリデーション
  if (typeof delta !== "number" || !Number.isInteger(delta)) {
    return NextResponse.json({ error: "Invalid delta" }, { status: 400 });
  }

  try {
    // 1️⃣ 通常のクライアント（ANON_KEY）
    const supabase = await createSupabaseServerClient();

    // 2️⃣ SERVICE_ROLE_KEY クライアント（DELETE操作用）
    const supabaseAdmin = createSupabaseAdminClient();

    // 現在のスタンプ数を取得
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stamp_count")
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "プロフィールが見つかりません" },
        { status: 404 }
      );
    }

    const currentStampCount = profile.stamp_count;
    const newCount = Math.max(0, currentStampCount + delta);

    console.log(`📊 スタンプ増減: ${currentStampCount} → ${newCount} (delta: ${delta})`);

    // ⚠️ 重要：スタンプ数を減らす場合、過去の大きい値を削除
    if (newCount < currentStampCount) {
      console.log(`🗑️ スタンプ数を減らすため、stamp_number > ${newCount} のレコードを削除`);

      // SERVICE_ROLE_KEY で削除（ANON_KEY では RLS により DELETE 不可）
      const { error: deleteError, count } = await supabaseAdmin
        .from("stamp_history")
        .delete({ count: "exact" })
        .eq("user_id", id)
        .gt("stamp_number", newCount);

      if (deleteError) {
        console.error("❌ 過去レコード削除エラー:", deleteError);
        return NextResponse.json(
          { error: `過去レコード削除失敗: ${deleteError.message}` },
          { status: 500 }
        );
      }

      console.log(`✅ ${count}件 の過去レコードを削除しました`);
    }

    // 3️⃣ stamp_history に新しいレコードを INSERT
    const { error: historyError } = await supabase
      .from("stamp_history")
      .insert({
        user_id: id,
        visit_date: new Date().toISOString(),
        stamp_number: newCount, // 変更後の値
        amount: delta, // 差分（マイナスもあり得る）
        stamp_method: "manual_admin",
        qr_code_id: `admin-incr-${Date.now()}`, // 一意なID
        notes: `管理ダッシュボードからスタンプ増減 (${delta > 0 ? "+" : ""}${delta})`,
      });

    if (historyError) {
      console.error("❌ stamp_history INSERT エラー:", historyError);
      return NextResponse.json(
        { error: `履歴記録失敗: ${historyError.message}` },
        { status: 500 }
      );
    }

    console.log("✅ stamp_history に記録しました");

    // 4️⃣ トリガーの不整合対策：念のため手動でも profiles を更新
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        stamp_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("❌ profiles 更新エラー:", updateError);
      console.warn("⚠️ 手動更新は失敗しましたが、トリガーで更新されているはずです");
    } else {
      console.log("✅ profiles を手動更新しました");
    }

    // 5️⃣ activity_logs に記録
    await logActivityIfStaff(request, "stamp_increment", {
      targetType: "profile",
      targetId: id,
      details: {
        old_value: currentStampCount,
        new_value: newCount,
        delta: delta,
      },
    });

    // 6️⃣ マイルストーン判定と特典自動付与
    let milestones: any[] = [];
    try {
      console.log(`🎯 マイルストーン判定開始: ${currentStampCount} → ${newCount}`);
      milestones = await handleStampMilestones(id, currentStampCount, newCount);
      if (milestones.length > 0) {
        console.log(`✅ マイルストーン特典付与: ${milestones.length}件`);
      }
    } catch (milestoneError) {
      console.error("❌ マイルストーン処理エラー:", milestoneError);
      // エラーでもスタンプ付与は成功しているので続行
    }

    // 7️⃣ 更新後のプロフィールを取得して返却
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    console.log(`✅ スタンプ数を ${currentStampCount} → ${newCount} に変更しました`);

    return NextResponse.json({
      ...updatedProfile || { id, stamp_count: newCount },
      milestones: milestones // マイルストーン情報も返却
    });
  } catch (error: any) {
    console.error("❌ スタンプ増減エラー:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
