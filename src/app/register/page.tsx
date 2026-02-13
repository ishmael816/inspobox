"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 验证密码
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("密码至少需要6位");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // 可以在这里添加用户元数据
          data: {
            created_at: new Date().toISOString(),
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // 注册成功
      setSuccess(true);
      
      // 3秒后跳转到登录页
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h1 className="text-2xl font-medium mb-2">注册成功</h1>
          <p className="text-muted mb-4">请查收邮箱验证邮件（如需要）</p>
          <p className="text-sm text-muted">3秒后自动跳转到登录页...</p>
        </motion.div>
      </main>
    );
  }

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

      {/* 注册表单 */}
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
            创建账号
          </motion.h1>
          <motion.p 
            className="text-muted text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            开始收集和管理你的灵感
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
            <p className="text-xs text-muted mt-1">至少需要6位字符</p>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-foreground transition-colors"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading || !email || !password || !confirmPassword}
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
                注册中...
              </span>
            ) : (
              "注册"
            )}
          </motion.button>
        </motion.form>

        <motion.p 
          className="text-center mt-6 text-sm text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          已有账号？{" "}
          <Link href="/login" className="text-foreground hover:underline">
            立即登录
          </Link>
        </motion.p>
      </motion.div>
    </main>
  );
}
