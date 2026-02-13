// 浏览器端数据操作 - 用于 Client Components
import { createClient } from "./supabase-client";
import { Fragment, Story, Tag, AIAnalysisResult, AIAnalysisHistory } from "@/types";

// 获取当前用户ID（客户端）
async function getCurrentUserId(): Promise<string> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("User not authenticated");
  }
  
  return user.id;
}

// ==================== Stories ====================

export async function getStories(): Promise<Story[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createStory(title: string, description?: string, color?: string): Promise<Story> {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  
  const { data, error } = await supabase
    .from("stories")
    .insert({ 
      title, 
      description, 
      color: color || '#171717',
      user_id: userId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==================== Tags ====================

export async function getTags(): Promise<Tag[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.warn("getTags error:", error);
    return [];
  }
  return data || [];
}

export async function createTag(name: string, color?: string): Promise<Tag> {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  
  const { data, error } = await supabase
    .from("tags")
    .insert({ 
      name: name.trim(), 
      color: color || '#6b7280',
      user_id: userId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addTagToFragment(fragmentId: string, tagId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("fragment_tags")
    .insert({ fragment_id: fragmentId, tag_id: tagId });
  
  if (error) throw error;
}

export async function removeTagFromFragment(fragmentId: string, tagId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("fragment_tags")
    .delete()
    .eq("fragment_id", fragmentId)
    .eq("tag_id", tagId);
  
  if (error) throw error;
}

// ==================== Fragments ====================

export async function getFragments(storyId?: string, tagId?: string): Promise<Fragment[]> {
  const supabase = createClient();
  
  try {
    let query = supabase
      .from("fragments")
      .select(`
        *,
        story:stories(*)
      `)
      .order("created_at", { ascending: false });
    
    if (storyId && storyId !== "all" && storyId !== "untagged") {
      query = query.eq('story_id', storyId);
    }
    
    if (storyId === "untagged") {
      query = query.is('story_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 单独获取每个碎片的标签
    const fragmentsWithTags = await Promise.all(
      (data || []).map(async (fragment: any) => {
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

    // 如果有过滤标签，在前端过滤
    if (tagId && tagId !== "all") {
      return fragmentsWithTags.filter((f: Fragment) => 
        f.tags?.some((t: Tag) => t.id === tagId)
      );
    }

    return fragmentsWithTags;
  } catch (error) {
    console.error("getFragments error:", error);
    // 降级方案
    const { data } = await supabase
      .from("fragments")
      .select(`*, story:stories(*)`)
      .order("created_at", { ascending: false });
    return (data || []).map((f: any) => ({ ...f, tags: [] }));
  }
}

export async function createFragment(content: string, storyId?: string, tagIds?: string[]): Promise<Fragment> {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  
  // 创建碎片
  const { data: fragment, error } = await supabase
    .from("fragments")
    .insert({ 
      content, 
      story_id: storyId || null,
      user_id: userId
    })
    .select(`
      *,
      story:stories(*)
    `)
    .single();

  if (error) throw error;

  // 添加标签关联
  if (tagIds && tagIds.length > 0) {
    try {
      const tagRelations = tagIds.map(tagId => ({
        fragment_id: fragment.id,
        tag_id: tagId
      }));
      await supabase.from("fragment_tags").insert(tagRelations);
    } catch (tagError) {
      console.warn("Failed to add tags:", tagError);
    }
  }

  // 获取标签
  let tags: Tag[] = [];
  try {
    const { data: tagData } = await supabase
      .from("fragment_tags")
      .select(`tag:tags(*)`)
      .eq("fragment_id", fragment.id);
    tags = tagData?.map((t: any) => t.tag).filter(Boolean) || [];
  } catch {
    tags = [];
  }

  return {
    ...fragment,
    tags
  };
}

export async function updateFragmentStory(fragmentId: string, storyId?: string): Promise<Fragment> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("fragments")
    .update({ story_id: storyId || null })
    .eq('id', fragmentId)
    .select(`
      *,
      story:stories(*)
    `)
    .single();

  if (error) throw error;

  // 获取标签
  let tags: Tag[] = [];
  try {
    const { data: tagData } = await supabase
      .from("fragment_tags")
      .select(`tag:tags(*)`)
      .eq("fragment_id", fragmentId);
    tags = tagData?.map((t: any) => t.tag).filter(Boolean) || [];
  } catch {
    tags = [];
  }

  return {
    ...data,
    tags
  };
}

export async function deleteFragment(fragmentId: string): Promise<void> {
  if (!fragmentId || typeof fragmentId !== 'string') {
    throw new Error(`Invalid fragmentId: ${fragmentId}`);
  }
  
  const supabase = createClient();
  console.log('[deleteFragment] Attempting to delete fragment:', fragmentId);
  
  // 首先检查记录是否存在
  const { data: existingData, error: checkError } = await supabase
    .from("fragments")
    .select('id')
    .eq('id', fragmentId)
    .single();
  
  console.log('[deleteFragment] Check existing:', { existingData, checkError });
  
  if (checkError) {
    console.error('[deleteFragment] Error checking record:', checkError);
    throw new Error(`Record not found or cannot access: ${checkError.message}`);
  }
  
  const { data, error } = await supabase
    .from("fragments")
    .delete()
    .eq('id', fragmentId)
    .select();

  console.log('[deleteFragment] Delete response:', { data, error });
  
  if (error) {
    console.error('[deleteFragment] Error:', error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    console.warn('[deleteFragment] No rows were deleted - possible RLS policy issue');
    throw new Error('No rows were deleted - please check RLS policies in Supabase dashboard');
  }
  
  console.log('[deleteFragment] Successfully deleted:', data);
}

export async function deleteFragments(fragmentIds: string[]): Promise<void> {
  if (!Array.isArray(fragmentIds) || fragmentIds.length === 0) {
    throw new Error(`Invalid fragmentIds: ${fragmentIds}`);
  }
  
  const supabase = createClient();
  console.log('[deleteFragments] Attempting to delete fragments:', fragmentIds);
  
  const { data, error } = await supabase
    .from("fragments")
    .delete()
    .in('id', fragmentIds)
    .select();

  console.log('[deleteFragments] Delete response:', { data, error });
  
  if (error) {
    console.error('[deleteFragments] Error:', error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    console.warn('[deleteFragments] No rows were deleted - possible RLS policy issue');
    throw new Error('No rows were deleted - please check RLS policies in Supabase dashboard');
  }
  
  console.log('[deleteFragments] Successfully deleted:', data);
}

// 更新碎片排序
export async function updateFragmentOrder(fragmentId: string, sortOrder: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("fragments")
    .update({ sort_order: sortOrder })
    .eq('id', fragmentId);

  if (error) throw error;
}

// 批量更新排序
export async function updateFragmentsOrder(updates: { id: string; sort_order: number }[]): Promise<void> {
  const supabase = createClient();
  
  for (const update of updates) {
    const { error } = await supabase
      .from("fragments")
      .update({ sort_order: update.sort_order })
      .eq('id', update.id);
    
    if (error) {
      console.error(`Failed to update order for ${update.id}:`, error);
    }
  }
}

// ==================== AI Analysis History ====================

export async function createAIHistory(
  fragmentIds: string[],
  result: AIAnalysisResult,
  rawText?: string,
  targetFragmentId?: string
) {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  
  const { data, error } = await supabase
    .from("ai_analysis_history")
    .insert({
      fragment_ids: fragmentIds,
      target_fragment_id: targetFragmentId,
      result,
      raw_text: rawText,
      user_id: userId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAIHistory(limit: number = 20): Promise<AIAnalysisHistory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_analysis_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function deleteAIHistory(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("ai_analysis_history")
    .delete()
    .eq('id', id);

  if (error) throw error;
}
