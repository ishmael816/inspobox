import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/relations/suggestions - 获取推荐列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取待处理的推荐
    const { data: suggestions, error } = await supabase
      .from("fragment_relation_suggestions")
      .select(`
        *,
        source_fragment:fragments!source_fragment_id(id, content),
        target_fragment:fragments!target_fragment_id(id, content)
      `)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("confidence", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Get suggestions error:", error);
      return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
    }

    // 统计待处理数量
    const { count } = await supabase
      .from("fragment_relation_suggestions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending");

    // 格式化响应
    const formattedSuggestions = (suggestions || []).map(s => ({
      id: s.id,
      source_fragment_id: s.source_fragment_id,
      target_fragment_id: s.target_fragment_id,
      source_preview: s.source_fragment?.content?.slice(0, 50) + "...",
      target_preview: s.target_fragment?.content?.slice(0, 50) + "...",
      relation_type: s.relation_type,
      confidence: s.confidence,
      reason: s.reason,
      status: s.status,
    }));

    return NextResponse.json({
      suggestions: formattedSuggestions,
      total_pending: count || 0,
    });

  } catch (error) {
    console.error("Get suggestions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/relations/suggestions - 批量创建推荐（用于AI分析后保存）
export async function POST(request: Request) {
  try {
    const { suggestions } = await request.json();

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return NextResponse.json({ error: "Suggestions array required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 添加用户ID到每个推荐
    const suggestionsWithUser = suggestions.map(s => ({
      ...s,
      user_id: user.id,
      status: "pending",
    }));

    const { data, error } = await supabase
      .from("fragment_relation_suggestions")
      .upsert(suggestionsWithUser, {
        onConflict: "source_fragment_id,target_fragment_id,relation_type",
        ignoreDuplicates: true,
      })
      .select();

    if (error) {
      console.error("Save suggestions error:", error);
      return NextResponse.json({ error: "Failed to save suggestions" }, { status: 500 });
    }

    return NextResponse.json({ saved: data?.length || 0 });

  } catch (error) {
    console.error("Save suggestions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
