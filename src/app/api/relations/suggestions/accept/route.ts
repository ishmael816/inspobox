import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/relations/suggestions/accept - 接受推荐
export async function POST(request: Request) {
  try {
    const { suggestion_id } = await request.json();

    if (!suggestion_id) {
      return NextResponse.json({ error: "Suggestion ID required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 使用数据库函数接受推荐
    const { data: relationId, error } = await supabase.rpc("accept_relation_suggestion", {
      p_suggestion_id: suggestion_id,
    });

    if (error) {
      console.error("Accept suggestion error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 获取创建的关联
    const { data: relation } = await supabase
      .from("fragment_relations")
      .select(`
        *,
        source_fragment:fragments!source_fragment_id(id, content),
        target_fragment:fragments!target_fragment_id(id, content)
      `)
      .eq("id", relationId)
      .single();

    return NextResponse.json(relation);

  } catch (error) {
    console.error("Accept suggestion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
