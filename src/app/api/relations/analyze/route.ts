import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createClient } from "@/lib/supabase-server";
import { RELATION_ANALYZE_SYSTEM_PROMPT, createAnalyzeUserPrompt, AI_CONFIG } from "@/lib/prompts";

export const runtime = "nodejs";

// 创建阿里云 DashScope provider
const dashscope = createOpenAICompatible({
  name: "dashscope",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  headers: {
    Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
  },
});

export async function POST(request: Request) {
  try {
    const { fragment_ids, analysis_depth = "basic" } = await request.json();

    // 验证参数
    if (!fragment_ids || !Array.isArray(fragment_ids) || fragment_ids.length < 2) {
      return new Response(
        JSON.stringify({ error: "At least 2 fragment IDs required", code: "MISSING_FRAGMENTS" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (fragment_ids.length > 50) {
      return new Response(
        JSON.stringify({ error: "Maximum 50 fragments allowed", code: "TOO_MANY_FRAGMENTS" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 获取当前用户
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", code: "AUTH_REQUIRED" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 获取碎片内容
    const { data: fragments, error: fragmentsError } = await supabase
      .from("fragments")
      .select("id, content, story_id, created_at")
      .in("id", fragment_ids)
      .eq("user_id", user.id);

    if (fragmentsError || !fragments || fragments.length === 0) {
      return new Response(
        JSON.stringify({ error: "Fragments not found", code: "FRAGMENTS_NOT_FOUND" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 确保返回的碎片顺序与请求顺序一致
    const orderedFragments = fragment_ids
      .map(id => fragments.find(f => f.id === id))
      .filter(Boolean) as { id: string; content: string }[];

    // 使用优化的提示词
    const userPrompt = createAnalyzeUserPrompt(orderedFragments);

    // 流式响应
    const result = await streamText({
      model: dashscope(AI_CONFIG.relationAnalyze.model),
      system: RELATION_ANALYZE_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: AI_CONFIG.relationAnalyze.temperature,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error("Relation analysis error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
