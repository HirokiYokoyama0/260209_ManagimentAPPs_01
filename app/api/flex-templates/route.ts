import { NextResponse } from "next/server";
import { getFlexTemplateList } from "@/lib/flex-templates";

/**
 * GET /api/flex-templates
 * Flex Messageテンプレート一覧を取得
 */
export async function GET() {
  try {
    const templates = getFlexTemplateList();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error getting flex templates:", error);
    return NextResponse.json(
      { error: "テンプレートの取得に失敗しました" },
      { status: 500 }
    );
  }
}
