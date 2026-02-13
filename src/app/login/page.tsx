"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = (searchParams.get("redirect") as string) || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      console.log("Attempting login...", { email });
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      console.log("Login success:", data);

      // 登录成功，跳转到原页面或首页
      router.push(redirect as any);
      router.refresh();
    } catch (err: any) {
      console.error("Login error:", err);
      
      // 友好的错误提示
      let errorMessage = "登录失败，请检查邮箱和密码";
      
      if (err.message?.includes("Invalid login credentials")) {
        errorMessage = "邮箱或密码错误";
      } else if (err.message?.includes("Email not confirmed")) {
        errorMessage = "邮箱未验证，请检查收件箱";
      } else if (err.message?.includes("environment variables")) {
        errorMessage = "系统配置错误，请联系管理员";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* 背景装饰 */}
      <motion.div 
        className="absolute inset-0 pointer-events-none" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-foreground/[0.02]"
            style={{ width: 300 + i * 200, height: 300 + i * 200, left: "50%", top: "50%" }}
            animate={{ x: ["-50%", "-48%"], y: ["-50%", "-52%"], scale: [1, 1.05] }}
            transition={{ duration: 4 + i, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
        ))}
      </motion.div>

      {/* 品牌 */}
      <motion.div 
        className="fixed top-6 left-1/2 -translate-x-1/2 text-xs text-muted/20 tracking-[0.3em] uppercase"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        InspoBox
      </motion.div>

      {/* 登录表单 */}
      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center mb-8">
          <motion.h1 
            className="text-2xl font-medium mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            欢迎回来
          </motion.h1>
          <motion.p 
            className="text-muted text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            登录以继续管理你的灵感
          </motion.p>
        </div>

        <motion.form 
          onSubmit={handleSubmit}
          className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-2xl p-6 border border-border/50 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {error && (
            <motion.div 
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm text-muted mb-1.5">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-foreground transition-colors"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 bg-foreground text-background rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                登录中...
              </span>
            ) : (
              "登录"
            )}
          </motion.button>
        </motion.form>

        <motion.p 
          className="text-center mt-6 text-sm text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          还没有账号？{" "}
          <Link href="/register" className="text-foreground hover:underline">
            立即注册
          </Link>
        </motion.p>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="w-8 h-8 border-2 border-border border-t-foreground rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
