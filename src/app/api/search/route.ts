import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/search?q={query}&story_id={story_id}&limit={limit}&offset={offset}
 * 
 * 全文搜索灵感碎片
 * 支持按内容、故事、标签搜索
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 解析查询参数
    const query = searchParams.get("q")?.trim();
    const storyId = searchParams.get("story_id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    
    // 验证查询参数
    if (!query || query.length === 0) {
      return NextResponse.json(
        { error: "Search query is required", code: "MISSING_QUERY" },
        { status: 400 }
      );
    }
    
    if (query.length > 200) {
      return NextResponse.json(
        { error: "Query too long (max 200 characters)", code: "QUERY_TOO_LONG" },
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
    
    // 执行搜索
    // 由于 Supabase 的 RPC 可能有限制，我们先尝试直接查询
    // 方案1: 使用 ILIKE 进行简单搜索（兼容性最好）
    // 方案2: 如果有 search_vector，使用全文搜索
    
    let dbQuery = supabase
      .from("fragments")
      .select(`
        *,
        story:stories(*)
      `, { count: "exact" })
      .eq("user_id", user.id)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    // 如果指定了故事ID，添加筛选
    if (storyId) {
      dbQuery = dbQuery.eq("story_id", storyId);
    }
    
    const { data: fragments, error, count } = await dbQuery;
    
    if (error) {
      console.error("Search error:", error);
      return NextResponse.json(
        { error: "Search failed", code: "SEARCH_ERROR", details: error.message },
        { status: 500 }
      );
    }
    
    // 获取每个碎片的标签
    const fragmentsWithTags = await Promise.all(
      (fragments || []).map(async (fragment: any) => {
        try {
          const { data: tagData } = await supabase
            .from("fragment_tags")
            .select(`
              tag:tags(*)
            `)
            .eq("fragment_id", fragment.id);
          
          return {
            ...fragment,
            tags: tagData?.map((t: any) => t.tag).filter(Boolean) || []
          };
        } catch {
          return { ...fragment, tags: [] };
        }
      })
    );
    
    // 如果结果太少，尝试搜索故事和标签名称
    let relatedFragments: any[] = [];
    if (fragmentsWithTags.length < limit) {
      // 搜索故事标题匹配的内容
      const { data: matchingStories } = await supabase
        .from("stories")
        .select("id")
        .eq("user_id", user.id)
        .ilike("title", `%${query}%`);
      
      if (matchingStories && matchingStories.length > 0) {
        const storyIds = matchingStories.map(s => s.id);
        
        // 获取这些故事下的碎片（排除已找到的）
        const existingIds = new Set(fragmentsWithTags.map(f => f.id));
        
        const { data: storyFragments } = await supabase
          .from("fragments")
          .select(`
            *,
            story:stories(*)
          `)
          .eq("user_id", user.id)
          .in("story_id", storyIds)
          .not("id", "in", `(${Array.from(existingIds).join(",")})`)
          .limit(limit - fragmentsWithTags.length);
        
        if (storyFragments) {
          const storyFragmentsWithTags = await Promise.all(
            storyFragments.map(async (fragment: any) => {
              try {
                const { data: tagData } = await supabase
                  .from("fragment_tags")
                  .select(`tag:tags(*)`)
                  .eq("fragment_id", fragment.id);
                
                return {
                  ...fragment,
                  tags: tagData?.map((t: any) => t.tag).filter(Boolean) || []
                };
              } catch {
                return { ...fragment, tags: [] };
              }
            })
          );
          
          relatedFragments = storyFragmentsWithTags;
        }
      }
    }
    
    // 合并结果
    const allFragments = [...fragmentsWithTags, ...relatedFragments];
    
    return NextResponse.json({
      fragments: allFragments,
      total: count || allFragments.length,
      query,
      has_more: (count || 0) > offset + limit
    });
    
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        code: "INTERNAL_ERROR",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
