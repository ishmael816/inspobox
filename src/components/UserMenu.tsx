"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

interface User {
  email: string;
  id: string;
}

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser({
          email: user.email || "",
          id: user.id,
        });
      }
      setLoading(false);
    };

    getUser();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (response.ok) {
        router.push("/login" as any);
        router.refresh();
      }
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setSigningOut(false);
      setShowMenu(false);
    }
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-border/50 animate-pulse" />
    );
  }

  if (!user) {
    return null;
  }

  // 获取邮箱首字母作为头像
  const initial = user.email.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {initial}
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)} 
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-border">
                <p className="text-xs text-muted">当前登录</p>
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
              
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full px-3 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                {signingOut ? (
                  <>
                    <motion.span
                      className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    退出中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    退出登录
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
