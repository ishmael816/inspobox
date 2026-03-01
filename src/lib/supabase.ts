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

// ==================== Search ====================

export interface SearchResult {
  fragments: Fragment[];
  total: number;
  query: string;
  has_more: boolean;
}

export interface SearchSuggestions {
  stories: { id: string; title: string; color: string }[];
  tags: { id: string; name: string; color: string }[];
}

export async function searchFragments(
  query: string,
  options?: {
    storyId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<SearchResult> {
  const params = new URLSearchParams();
  params.set("q", query);
  if (options?.storyId) params.set("story_id", options.storyId);
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.offset) params.set("offset", options.offset.toString());
  
  const response = await fetch(`/api/search?${params.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Search failed");
  }
  
  return response.json();
}

export async function getSearchSuggestions(query: string): Promise<SearchSuggestions> {
  if (!query.trim()) {
    return { stories: [], tags: [] };
  }
  
  const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
  
  if (!response.ok) {
    return { stories: [], tags: [] };
  }
  
  return response.json();
}

// ==================== Batch Operations ====================

export interface BatchUpdateResult {
  updated: number;
  failed: number;
  action: string;
  total: number;
}

export async function batchUpdateFragments(
  ids: string[],
  action: "move_to_story" | "add_tags" | "remove_tags",
  options?: {
    storyId?: string | null;
    tagIds?: string[];
  }
): Promise<BatchUpdateResult> {
  const response = await fetch("/api/fragments/batch-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ids,
      action,
      story_id: options?.storyId,
      tag_ids: options?.tagIds
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Batch update failed");
  }

  return response.json();
}

export async function batchMoveToStory(
  fragmentIds: string[],
  storyId: string | null
): Promise<BatchUpdateResult> {
  return batchUpdateFragments(fragmentIds, "move_to_story", { storyId });
}

export async function batchAddTags(
  fragmentIds: string[],
  tagIds: string[]
): Promise<BatchUpdateResult> {
  return batchUpdateFragments(fragmentIds, "add_tags", { tagIds });
}

export async function batchRemoveTags(
  fragmentIds: string[],
  tagIds: string[]
): Promise<BatchUpdateResult> {
  return batchUpdateFragments(fragmentIds, "remove_tags", { tagIds });
}

// ==================== Fragment Relations ====================

export interface FragmentRelation {
  id: string;
  source_fragment_id: string;
  target_fragment_id: string;
  relation_type: 'similar' | 'contrast' | 'sequence' | 'causal' | 'thematic' | 'emotional' | 'reference' | 'custom';
  strength: number;
  description?: string;
  ai_generated: boolean;
  ai_confidence?: number;
  source_fragment?: { id: string; content: string };
  target_fragment?: { id: string; content: string };
  created_at: string;
}

export interface RelationSuggestion {
  id: string;
  source_fragment_id: string;
  target_fragment_id: string;
  source_preview?: string;
  target_preview?: string;
  relation_type: string;
  confidence: number;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface SmartGroup {
  id: string;
  name: string;
  description: string;
  fragment_ids: string[];
  tags: string[];
  color: string;
  confidence: number;
  key_themes: string[];
}

export interface TimelineEvent {
  fragment_id: string;
  position: number;
  estimated_time?: string;
  narrative_role: 'setup' | 'inciting' | 'rising' | 'climax' | 'falling' | 'resolution';
  connections: { before: string[]; after: string[] };
}

export interface TimelineGap {
  after_fragment_id: string;
  before_fragment_id: string;
  description: string;
  suggestion: string;
}

export interface ThemeCluster {
  id: string;
  name: string;
  level: 'primary' | 'secondary' | 'tertiary';
  keywords: string[];
  fragment_ids: string[];
  related_themes?: string[];
  heat_score: number;
}

export interface RelationAnalysisResult {
  relations: FragmentRelation[];
  groups: SmartGroup[];
  timeline: { events: TimelineEvent[]; gaps: TimelineGap[] };
  themes: ThemeCluster[];
  suggestions: RelationSuggestion[];
}

// 获取关联列表
export async function getRelations(fragmentId?: string): Promise<FragmentRelation[]> {
  const params = fragmentId ? `?fragment_id=${fragmentId}` : '';
  const response = await fetch(`/api/relations${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch relations');
  }
  
  return response.json();
}

// 创建关联
export async function createRelation(
  sourceId: string,
  targetId: string,
  type: string,
  strength?: number,
  description?: string
): Promise<FragmentRelation> {
  const response = await fetch('/api/relations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_fragment_id: sourceId,
      target_fragment_id: targetId,
      relation_type: type,
      strength,
      description
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create relation');
  }
  
  return response.json();
}

// 删除关联
export async function deleteRelation(relationId: string): Promise<void> {
  const response = await fetch(`/api/relations/${relationId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete relation');
  }
}

// 获取关联推荐
export async function getRelationSuggestions(limit: number = 10): Promise<{
  suggestions: RelationSuggestion[];
  total_pending: number;
}> {
  const response = await fetch(`/api/relations/suggestions?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch suggestions');
  }
  
  return response.json();
}

// 接受推荐
export async function acceptRelationSuggestion(suggestionId: string): Promise<FragmentRelation> {
  const response = await fetch('/api/relations/suggestions/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suggestion_id: suggestionId })
  });
  
  if (!response.ok) {
    throw new Error('Failed to accept suggestion');
  }
  
  return response.json();
}

// 拒绝推荐
export async function rejectRelationSuggestion(suggestionId: string): Promise<void> {
  const response = await fetch('/api/relations/suggestions/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suggestion_id: suggestionId })
  });
  
  if (!response.ok) {
    throw new Error('Failed to reject suggestion');
  }
}

// 保存批量推荐（用于AI分析后）
export async function saveRelationSuggestions(
  suggestions: Omit<RelationSuggestion, 'id' | 'status'>[]
): Promise<{ saved: number }> {
  const response = await fetch('/api/relations/suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suggestions })
  });
  
  if (!response.ok) {
    throw new Error('Failed to save suggestions');
  }
  
  return response.json();
}
