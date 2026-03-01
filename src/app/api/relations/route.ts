import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// GET /api/relations - 获取所有关联
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fragmentId = searchParams.get("fragment_id");

    let query = supabase
      .from("fragment_relations")
      .select(`
        *,
        source_fragment:fragments!source_fragment_id(id, content),
        target_fragment:fragments!target_fragment_id(id, content)
      `)
      .eq("user_id", user.id);

    if (fragmentId) {
      query = query.or(`source_fragment_id.eq.${fragmentId},target_fragment_id.eq.${fragmentId}`);
    }

    const { data: relations, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Get relations error:", error);
      return NextResponse.json({ error: "Failed to fetch relations" }, { status: 500 });
    }

    return NextResponse.json(relations || []);

  } catch (error) {
    console.error("Get relations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/relations - 创建关联
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source_fragment_id, target_fragment_id, relation_type, strength, description } = body;

    // 验证参数
    if (!source_fragment_id || !target_fragment_id || !relation_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (source_fragment_id === target_fragment_id) {
      return NextResponse.json(
        { error: "Cannot relate fragment to itself" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 检查碎片所有权
    const { data: fragments } = await supabase
      .from("fragments")
      .select("id")
      .in("id", [source_fragment_id, target_fragment_id])
      .eq("user_id", user.id);

    if (!fragments || fragments.length !== 2) {
      return NextResponse.json(
        { error: "Fragments not found or access denied" },
        { status: 404 }
      );
    }

    // 创建关联
    const { data: relation, error } = await supabase
      .from("fragment_relations")
      .insert({
        source_fragment_id,
        target_fragment_id,
        relation_type,
        strength: strength || 0.5,
        description,
        ai_generated: false,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Relation already exists" },
          { status: 409 }
        );
      }
      console.error("Create relation error:", error);
      return NextResponse.json({ error: "Failed to create relation" }, { status: 500 });
    }

    return NextResponse.json(relation, { status: 201 });

  } catch (error) {
    console.error("Create relation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
