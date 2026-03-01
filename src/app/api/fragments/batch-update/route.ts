import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/fragments/batch-update
 * 
 * 批量更新碎片
 * - move_to_story: 移动到指定故事
 * - add_tags: 添加标签
 * - remove_tags: 移除标签
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids, action, story_id, tag_ids } = body;

    // 参数验证
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Fragment IDs are required", code: "MISSING_IDS" },
        { status: 400 }
      );
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { error: "Too many fragments (max 100)", code: "TOO_MANY_IDS" },
        { status: 400 }
      );
    }

    if (!action || !["move_to_story", "add_tags", "remove_tags"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action", code: "INVALID_ACTION" },
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

    let updated = 0;
    let failed = 0;

    // 根据 action 执行不同的操作
    switch (action) {
      case "move_to_story": {
        // 验证 story_id
        if (story_id) {
          const { data: story } = await supabase
            .from("stories")
            .select("id")
            .eq("id", story_id)
            .eq("user_id", user.id)
            .single();

          if (!story) {
            return NextResponse.json(
              { error: "Story not found or access denied", code: "STORY_NOT_FOUND" },
              { status: 404 }
            );
          }
        }

        // 批量更新故事
        const { data, error } = await supabase
          .from("fragments")
          .update({ story_id: story_id || null })
          .in("id", ids)
          .eq("user_id", user.id)
          .select();

        if (error) {
          console.error("Batch move error:", error);
          failed = ids.length;
        } else {
          updated = data?.length || 0;
          failed = ids.length - updated;
        }
        break;
      }

      case "add_tags": {
        if (!tag_ids || !Array.isArray(tag_ids) || tag_ids.length === 0) {
          return NextResponse.json(
            { error: "Tag IDs are required", code: "MISSING_TAG_IDS" },
            { status: 400 }
          );
        }

        // 验证用户拥有这些标签
        const { data: validTags } = await supabase
          .from("tags")
          .select("id")
          .eq("user_id", user.id)
          .in("id", tag_ids);

        const validTagIds = new Set(validTags?.map(t => t.id) || []);

        // 为每个碎片添加标签
        for (const fragmentId of ids) {
          try {
            // 检查碎片所有权
            const { data: fragment } = await supabase
              .from("fragments")
              .select("id")
              .eq("id", fragmentId)
              .eq("user_id", user.id)
              .single();

            if (!fragment) {
              failed++;
              continue;
            }

            // 获取已存在的标签关联
            const { data: existingLinks } = await supabase
              .from("fragment_tags")
              .select("tag_id")
              .eq("fragment_id", fragmentId);

            const existingTagIds = new Set(existingLinks?.map(l => l.tag_id) || []);

            // 过滤掉已存在的标签
            const newTagIds = tag_ids.filter(id => 
              validTagIds.has(id) && !existingTagIds.has(id)
            );

            if (newTagIds.length > 0) {
              const { error } = await supabase
                .from("fragment_tags")
                .insert(newTagIds.map(tagId => ({
                  fragment_id: fragmentId,
                  tag_id: tagId
                })));

              if (error) {
                console.error("Add tags error:", error);
                failed++;
              } else {
                updated++;
              }
            } else {
              // 没有新标签需要添加，也算成功
              updated++;
            }
          } catch (err) {
            console.error("Add tag to fragment error:", err);
            failed++;
          }
        }
        break;
      }

      case "remove_tags": {
        if (!tag_ids || !Array.isArray(tag_ids) || tag_ids.length === 0) {
          return NextResponse.json(
            { error: "Tag IDs are required", code: "MISSING_TAG_IDS" },
            { status: 400 }
          );
        }

        // 批量移除标签
        const { error } = await supabase
          .from("fragment_tags")
          .delete()
          .in("fragment_id", ids)
          .in("tag_id", tag_ids);

        if (error) {
          console.error("Remove tags error:", error);
          failed = ids.length;
        } else {
          // 由于 delete 不返回影响的行数，我们假设全部成功
          // 实际生产环境可以逐个删除来获取准确数量
          updated = ids.length;
        }
        break;
      }
    }

    return NextResponse.json({
      updated,
      failed,
      action,
      total: ids.length
    });

  } catch (error) {
    console.error("Batch update error:", error);
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
