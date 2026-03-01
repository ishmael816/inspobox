import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/relations/suggestions/reject - 拒绝推荐
export async function POST(request: Request) {
  try {
    const { suggestion_id } = await request.json();

    if (!suggestion_id) {
      return NextResponse.json({ error: "Suggestion ID required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 更新推荐状态为拒绝
    const { error } = await supabase
      .from("fragment_relation_suggestions")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", suggestion_id)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (error) {
      console.error("Reject suggestion error:", error);
      return NextResponse.json({ error: "Failed to reject suggestion" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Reject suggestion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
