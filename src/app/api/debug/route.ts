import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "missing",
    nodeEnv: process.env.NODE_ENV,
  });
}
