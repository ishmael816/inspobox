import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/search/suggestions?q={query}
 * 
 * 获取搜索建议（故事、标签）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get("q")?.trim();
    
    if (!query || query.length === 0) {
      return NextResponse.json(
        { stories: [], tags: [] },
        { status: 200 }
      );
    }
    
    if (query.length > 50) {
      return NextResponse.json(
        { error: "Query too long", code: "QUERY_TOO_LONG" },
        { status: 400 }
      );
    }
    
    // 获取当前用户
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }
    
    // 搜索匹配的故事
    const { data: stories } = await supabase
      .from("stories")
      .select("id, title, color")
      .eq("user_id", user.id)
      .ilike("title", `%${query}%`)
      .limit(5);
    
    // 搜索匹配的标签
    const { data: tags } = await supabase
      .from("tags")
      .select("id, name, color")
      .eq("user_id", user.id)
      .ilike("name", `%${query}%`)
      .limit(5);
    
    return NextResponse.json({
      stories: stories || [],
      tags: tags || []
    });
    
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json(
      { stories: [], tags: [] },
      { status: 200 }
    );
  }
}
