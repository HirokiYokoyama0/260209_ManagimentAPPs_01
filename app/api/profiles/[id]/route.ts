import { logActivityIfStaff } from "@/lib/activity-log";
import { isValidMemoLength } from "@/lib/memo";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { real_name, ticket_number, last_visit_date, view_mode, next_visit_date, next_memo } = body as {
    real_name?: string | null;
    ticket_number?: string | null;
    last_visit_date?: string | null;
    view_mode?: string | null;
    next_visit_date?: string | null;
    next_memo?: string | null;
  };

  // バリデーション: 次回メモの文字数チェック
  if (next_memo && !isValidMemoLength(next_memo)) {
    return NextResponse.json(
      { error: "メッセージは200文字以内で入力してください" },
      { status: 400 }
    );
  }

  const updates: {
    real_name?: string | null;
    ticket_number?: string | null;
    last_visit_date?: string | null;
    view_mode?: string | null;
    next_visit_date?: string | null;
    next_memo?: string | null;
    updated_at?: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (real_name !== undefined) {
    updates.real_name = real_name === "" ? null : String(real_name);
  }
  if (ticket_number !== undefined) {
    updates.ticket_number = ticket_number === "" ? null : String(ticket_number);
  }
  if (last_visit_date !== undefined) {
    if (last_visit_date === "" || last_visit_date === null) {
      updates.last_visit_date = null;
    } else {
      const dateStr = String(last_visit_date).trim();
      if (dateStr.length >= 10) {
        updates.last_visit_date = new Date(dateStr.slice(0, 10) + "T00:00:00+09:00").toISOString();
      }
    }
  }
  if (view_mode !== undefined) {
    updates.view_mode = view_mode === "" ? null : String(view_mode);
  }
  if (next_visit_date !== undefined) {
    updates.next_visit_date = next_visit_date === "" ? null : String(next_visit_date);
  }
  if (next_memo !== undefined) {
    updates.next_memo = next_memo === "" ? null : String(next_memo);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logActivityIfStaff(request, "profile_update", {
    targetType: "profile",
    targetId: id,
    details: { fields: Object.keys(updates).filter((k) => k !== "updated_at") },
  });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log("[DELETE /api/profiles/[id]] Received ID:", id);

  try {
    const supabase = createSupabaseAdminClient();

    // ステップ1: 削除対象のプロフィールを取得
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        *,
        families!profiles_family_id_fkey (
          id,
          family_name,
          representative_user_id
        )
      `)
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      console.log("[DELETE /api/profiles/[id]] Profile not found. Error:", profileError);
      console.log("[DELETE /api/profiles/[id]] Searched ID:", id);
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    console.log("[DELETE /api/profiles/[id]] Found profile:", profile.id, profile.display_name);

    // ステップ2: 関連データ件数を取得（ログ記録用）
    const [stampHistoryCount, rewardExchangesCount, dentalRecordsCount, careMessagesCount] =
      await Promise.all([
        supabase
          .from("stamp_history")
          .select("id", { count: "exact", head: true })
          .eq("user_id", id),
        supabase
          .from("reward_exchanges")
          .select("id", { count: "exact", head: true })
          .eq("user_id", id),
        supabase
          .from("patient_dental_records")
          .select("id", { count: "exact", head: true })
          .eq("patient_id", id),
        supabase
          .from("care_messages")
          .select("id", { count: "exact", head: true })
          .eq("profile_id", id),
      ]);

    const deletedCounts = {
      stampHistory: stampHistoryCount.count || 0,
      rewardExchanges: rewardExchangesCount.count || 0,
      dentalRecords: dentalRecordsCount.count || 0,
      careMessages: careMessagesCount.count || 0,
    };

    // ステップ3: activity_logs に削除予定データを記録（スタッフ情報付き）
    await logActivityIfStaff(request, "profile_delete_initiated", {
      targetType: "profile",
      targetId: id,
      details: {
        profile: {
          id: profile.id,
          display_name: profile.display_name,
          real_name: profile.real_name,
          ticket_number: profile.ticket_number,
          stamp_count: profile.stamp_count,
          visit_count: profile.visit_count,
        },
        family: profile.families,
        relatedDataCounts: deletedCounts,
      },
    });

    // ステップ4: 家族構成の調整
    let familyAction: "family_deleted" | "new_representative_assigned" | "no_change" = "no_change";
    const familyId = profile.family_id;
    const isRepresentative = profile.families?.representative_user_id === id;

    if (familyId) {
      // 家族のメンバー数を取得
      const { data: familyMembers } = await supabase
        .from("profiles")
        .select("id, display_name, created_at")
        .eq("family_id", familyId);

      const memberCount = familyMembers?.length || 0;

      if (memberCount === 1) {
        // 単身家族 → 家族ごと削除
        await supabase.from("families").delete().eq("id", familyId);
        familyAction = "family_deleted";
      } else if (isRepresentative && memberCount >= 2) {
        // 代表者削除 → 新代表者を選出
        const newRepresentative = familyMembers
          ?.filter((m) => m.id !== id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

        if (newRepresentative) {
          await supabase
            .from("families")
            .update({ representative_user_id: newRepresentative.id })
            .eq("id", familyId);

          await supabase
            .from("profiles")
            .update({ family_role: "parent" })
            .eq("id", newRepresentative.id);

          familyAction = "new_representative_assigned";
        }
      }
    }

    // ステップ5: profiles を削除（CASCADE で関連データ自動削除）
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(`Failed to delete profile: ${deleteError.message}`);
    }

    // ステップ6: activity_logs に削除完了ログを記録（スタッフ情報付き）
    await logActivityIfStaff(request, "profile_deleted", {
      targetType: "profile",
      targetId: id,
      details: {
        deletedProfile: {
          id: profile.id,
          display_name: profile.display_name,
          real_name: profile.real_name,
          ticket_number: profile.ticket_number,
          stamp_count: profile.stamp_count,
        },
        deletedRelatedData: {
          ...deletedCounts,
          family: {
            deleted: familyAction === "family_deleted",
            familyName: profile.families?.family_name || null,
            action: familyAction,
          },
        },
      },
    });

    // レスポンス返却
    return NextResponse.json({
      success: true,
      deletedProfile: {
        id: profile.id,
        display_name: profile.display_name,
        real_name: profile.real_name,
        ticket_number: profile.ticket_number,
      },
      deletedRelatedData: {
        ...deletedCounts,
        family: {
          deleted: familyAction === "family_deleted",
          familyName: profile.families?.family_name || null,
          action: familyAction,
        },
      },
    });
  } catch (error: any) {
    console.error("Error deleting profile:", error);
    return NextResponse.json(
      { error: "Failed to delete profile", details: error.message },
      { status: 500 }
    );
  }
}
