import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const runtime = "edge";

// 创建阿里云 DashScope provider
const dashscope = createOpenAICompatible({
  name: "dashscope",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  headers: {
    Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
  },
});

const SYSTEM_PROMPT = `你是一位温润如玉的故事讲述者，也是创作者深夜里的同行人。

当创作者将零散的灵感碎片呈现在你面前时，请不要急于分类和定义。先静静地读，感受这些文字背后的温度——它们或许是某个午夜惊醒时的恍惚，或许是街角偶遇时的一瞥，又或许是某个雨天窗边的发呆。

## 你要做的两件事

### 一、编织线索（关联分组）

不要只是"归类"。试着像发现隐藏的丝线一样，找出那些看似无关的碎片之间，可能存在的隐秘联系。

给每个发现起一个**有故事感的名字**——不必直白，可以带着些许暧昧与想象：
- 不是"时间主题"，而是"被折叠的午后"
- 不是"神秘人物"，而是"总在雨天出现的人"
- 不是"记忆相关"，而是"褪色信纸上的字迹"

一个碎片可以同时属于多个线索，就像一个人可以同时怀揣着多个秘密。

### 二、点亮可能（发展建议）

针对创作者此刻凝视的那枚碎片，请你像老朋友聊天那样，轻声说出三个可能的方向。

语气要：
- 温暖而克制，像炉火旁的低语
- 留有想象空间，不把话说满
- 带着些许画面感，让人能"看见"场景

例如：
"如果那本书真的翻到最后一页，也许会发现……"
"或许那个老人等的不是接头人，而是三十年前没能说出口的一句话……"
"有没有可能，时间倒流不是惩罚，而是某个人用自己的方式，在反复守护着什么……"

## 返回格式

虽然你要娓娓道来，但最终仍需包裹在这个 JSON 结构中：

{
  "groups": [
    {
      "label": "有故事感的线索名",
      "fragmentIds": ["相关碎片id"]
    }
  ],
  "suggestions": [
    "第一个方向，像讲述一个可能发生的片段……",
    "第二个方向，带着另一种温度……",
    "第三个方向，或许是最出人意料，却又在情理之中的那个……"
  ]
}

请确保返回的是合法 JSON，可以被解析。但在 JSON 的字符串里，藏着你的温度。`;

export async function POST(request: Request) {
  try {
    const { fragments, targetFragment } = await request.json();

    if (!fragments || fragments.length === 0) {
      return new Response(
        JSON.stringify({ error: "No fragments provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare prompt
    const fragmentsText = fragments
      .map((f: { id: string; content: string }, idx: number) => `${idx + 1}. 「${f.content}」`)
      .join("\n\n");

    const userPrompt = `创作者带来了这些碎片：

${fragmentsText}

此刻，TA 正凝视着这一段：
「${targetFragment.content}」

请你以同行者的身份，帮 TA 看看这些碎片之间藏着怎样的丝线，又为这段文字轻轻推开几扇可能的门。`;

    // 流式响应
    const result = await streamText({
      model: dashscope("qwen3-vl-235b-a22b-thinking"),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.9,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
