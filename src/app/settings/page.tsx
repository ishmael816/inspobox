"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { isNativePlatform, mobileStorage } from "@/lib/mobile";

const CONFIG_KEYS = {
  SUPABASE_URL: "supabase_url",
  SUPABASE_KEY: "supabase_anon_key",
  DASHSCOPE_KEY: "dashscope_api_key",
};

export default function SettingsPage() {
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [dashscopeKey, setDashscopeKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativePlatform());
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const url = await mobileStorage.get(CONFIG_KEYS.SUPABASE_URL);
    const key = await mobileStorage.get(CONFIG_KEYS.SUPABASE_KEY);
    const dash = await mobileStorage.get(CONFIG_KEYS.DASHSCOPE_KEY);
    
    if (url) setSupabaseUrl(url);
    if (key) setSupabaseKey(key);
    if (dash) setDashscopeKey(dash);
  };

  const handleSave = async () => {
    await mobileStorage.set(CONFIG_KEYS.SUPABASE_URL, supabaseUrl);
    await mobileStorage.set(CONFIG_KEYS.SUPABASE_KEY, supabaseKey);
    await mobileStorage.set(CONFIG_KEYS.DASHSCOPE_KEY, dashscopeKey);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    
    if (isNativePlatform()) {
      alert("配置已保存，请重启应用生效");
    }
  };

  const handleClear = async () => {
    await mobileStorage.remove(CONFIG_KEYS.SUPABASE_URL);
    await mobileStorage.remove(CONFIG_KEYS.SUPABASE_KEY);
    await mobileStorage.remove(CONFIG_KEYS.DASHSCOPE_KEY);
    
    setSupabaseUrl("");
    setSupabaseKey("");
    setDashscopeKey("");
    
    alert("配置已清除");
  };

  return (
    <main className="min-h-screen p-6">
      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-medium">应用配置</h1>
          <Link
            href="/"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← 返回
          </Link>
        </div>

        <div className="mb-6 p-4 bg-border/20 rounded-xl">
          <p className="text-sm text-muted">
            运行环境: {isNative ? "Android APP" : "浏览器"}
          </p>
          <p className="text-xs text-muted/70 mt-1">
            {isNative 
              ? "配置将保存在手机本地存储中" 
              : "配置将保存在浏览器本地存储中"}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-2">
              Supabase URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">
              Supabase Anon Key
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">
              DashScope API Key (可选)
            </label>
            <input
              type="password"
              value={dashscopeKey}
              onChange={(e) => setDashscopeKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-foreground transition-colors"
            />
            <p className="text-xs text-muted mt-1">
              用于 AI 功能，不配置则无法使用灵感重组
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <motion.button
              onClick={handleSave}
              className="flex-1 py-3 bg-foreground text-background rounded-xl font-medium text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {saved ? "✓ 已保存" : "保存配置"}
            </motion.button>
            
            <motion.button
              onClick={handleClear}
              className="px-4 py-3 border border-border rounded-xl text-sm text-muted hover:text-foreground transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              清除
            </motion.button>
          </div>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-sm text-amber-600">
              <strong>提示：</strong>修改配置后需要重启应用才能生效。
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <h2 className="text-sm font-medium mb-2">如何获取配置？</h2>
          <ol className="text-sm text-muted space-y-2 list-decimal list-inside">
            <li>登录 <a href="https://app.supabase.com" target="_blank" className="text-foreground underline">Supabase Dashboard</a></li>
            <li>选择你的项目</li>
            <li>点击左侧 Settings → API</li>
            <li>复制 URL 和 anon/public key</li>
            <li>阿里云 DashScope Key 在 <a href="https://dashscope.aliyun.com" target="_blank" className="text-foreground underline">阿里云控制台</a> 获取</li>
          </ol>
        </div>
      </motion.div>
    </main>
  );
}
