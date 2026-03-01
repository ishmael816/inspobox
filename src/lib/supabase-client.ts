// 浏览器端 Supabase 客户端 - 用于 Client Components
import { createBrowserClient } from "@supabase/ssr";
import { mobileStorage } from "./mobile";

// 默认配置（从构建时环境变量获取）
const defaultSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const defaultSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 缓存的配置
let cachedConfig: { url: string | null; key: string | null } | null = null;

// 获取运行时配置（支持移动端覆盖）
async function getRuntimeConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  // 尝试从移动端存储读取
  const storedUrl = await mobileStorage.get("supabase_url");
  const storedKey = await mobileStorage.get("supabase_anon_key");

  cachedConfig = {
    url: storedUrl || defaultSupabaseUrl || null,
    key: storedKey || defaultSupabaseKey || null,
  };

  return cachedConfig;
}

// 同步获取配置（用于非异步场景）
function getConfigSync() {
  return {
    url: defaultSupabaseUrl,
    key: defaultSupabaseKey,
  };
}

// 调试：检查环境变量
if (!defaultSupabaseUrl || !defaultSupabaseKey) {
  console.warn("Missing default Supabase environment variables:", {
    url: defaultSupabaseUrl ? "set" : "missing",
    key: defaultSupabaseKey ? "set" : "missing",
  });
}

export function createClient() {
  const { url, key } = getConfigSync();

  if (!url || !key) {
    throw new Error(
      "Supabase 配置未设置。请在浏览器中访问 /settings 配置，或在构建时设置环境变量。"
    );
  }

  return createBrowserClient(url, key);
}

// 异步创建客户端（支持读取移动端存储的配置）
export async function createClientAsync() {
  const config = await getRuntimeConfig();

  if (!config.url || !config.key) {
    throw new Error(
      "Supabase 配置未设置。请在浏览器中访问 /settings 配置，或在构建时设置环境变量。"
    );
  }

  return createBrowserClient(config.url, config.key);
}

// 检查配置是否有效
export async function isConfigValid() {
  const config = await getRuntimeConfig();
  return !!config.url && !!config.key;
}

// 清除配置缓存（用于配置更新后）
export function clearConfigCache() {
  cachedConfig = null;
}
