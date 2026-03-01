"use client";

import { useEffect } from "react";
import { initializeMobileApp } from "@/lib/mobile";

export function MobileInitializer() {
  useEffect(() => {
    // 初始化移动端功能
    initializeMobileApp();
  }, []);

  return null;
}
