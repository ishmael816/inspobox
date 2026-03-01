import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase-middleware";

// 需要登录才能访问的路由
const protectedRoutes = ["/", "/studio"];
// 已登录用户不能访问的路由（如登录页）
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 跳过静态资源和 API 路由
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/favicon") ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname)
  ) {
    return NextResponse.next();
  }
  
  try {
    // 更新会话并获取用户信息
    const { supabaseResponse, user } = await updateSession(request);

    const isAuthenticated = !!user;

    // 如果访问受保护路由但未登录，重定向到登录页
    if (protectedRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) {
      if (!isAuthenticated) {
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // 如果已登录但访问登录/注册页，重定向到首页
    if (authRoutes.includes(pathname)) {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Middleware error:", error);
    
    // 出错时的降级处理：
    // - 如果是受保护路由，重定向到登录页
    // - 如果是登录/注册页，允许访问
    if (protectedRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - public 文件夹中的文件
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
  // 使用 Node.js runtime 而不是 Edge Runtime（解决 Windows 网络问题）
  runtime: "nodejs",
};
