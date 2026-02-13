// 浏览器端 Supabase 客户端 - 用于 Client Components
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 调试：检查环境变量
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables:", {
    url: supabaseUrl ? "set" : "missing",
    key: supabaseKey ? "set" : "missing",
  });
}

export function createClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not set");
  }
  
  return createBrowserClient(supabaseUrl, supabaseKey);
}
