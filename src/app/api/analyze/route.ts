import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { ANALYZE_SYSTEM_PROMPT, createAnalyzeUserPrompt, AI_CONFIG } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const { fragments, targetFragment } = await request.json();

    if (!fragments || fragments.length === 0) {
      return new Response(
        JSON.stringify({ error: "No fragments provided", code: "MISSING_FRAGMENTS" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (fragments.length > 50) {
      return new Response(
        JSON.stringify({ error: "Maximum 50 fragments allowed", code: "TOO_MANY_FRAGMENTS" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 使用优化的提示词
    const userPrompt = createAnalyzeUserPrompt(fragments, targetFragment);

    // 流式响应
    const result = await streamText({
      model: dashscope(AI_CONFIG.analyze.model),
      system: ANALYZE_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: AI_CONFIG.analyze.temperature,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error("Analysis error:", error);
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
