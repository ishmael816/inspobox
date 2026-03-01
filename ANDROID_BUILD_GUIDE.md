# InspoBox Android APP 构建指南

本指南说明如何将 InspoBox Web 应用构建为 Android APK。

## 📱 项目结构

```
android/                    # Android 原生项目目录
capacitor.config.ts         # Capacitor 配置文件
src/lib/mobile.ts           # 移动端原生功能封装
src/components/MobileInitializer.tsx  # 移动端初始化组件
src/app/settings/page.tsx   # APP 内配置页面
```

## 🛠️ 环境要求

### 必需软件

1. **Node.js** >= 20.0.0
2. **Android Studio** (最新稳定版)
3. **Android SDK**:
   - Android SDK Platform 33+ (API Level 33)
   - Android SDK Build-Tools 33+
   - Android Emulator (可选，用于测试)

### 安装 Android Studio

1. 下载 [Android Studio](https://developer.android.com/studio)
2. 安装时选择:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (可选)

## 🚀 构建步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量（可选）

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=你的SupabaseURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase密钥
DASHSCOPE_API_KEY=你的阿里云API密钥
```

### 3. 构建 Web 应用

```bash
npm run build
```

这会生成静态文件到 `dist/` 目录。

### 4. 同步到 Android 项目

```bash
npm run sync:android
```

### 5. 打开 Android 项目

```bash
npm run open:android
```

### 6. 构建 APK

在 Android Studio 中:

1. 等待 Gradle 同步完成
2. **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. APK 输出位置: `android/app/build/outputs/apk/debug/app-debug.apk`

## 📱 手机端配置

由于 APK 是静态应用，配置需要在手机端进行：

1. 安装并打开 APP
2. 点击首页右上角的 **⚙️ 设置图标**
3. 输入 Supabase URL 和 Anon Key
4. 保存后**重启应用**生效

## 🔧 常用命令

```bash
# 开发时快速同步
npm run build:android

# 直接在模拟器/真机运行
npm run run:android

# 更新原生插件
npx cap update android
```

## 📚 相关文档

- [Capacitor 文档](https://capacitorjs.com/docs)
- [Android 开发者指南](https://developer.android.com/guide)

## ✅ 功能支持状态

| 功能 | 状态 | 说明 |
|------|------|------|
| 用户登录/注册 | ✅ | 通过 Supabase Auth |
| 灵感捕捉 | ✅ | 完整支持 |
| 故事管理 | ✅ | 完整支持 |
| 标签系统 | ✅ | 完整支持 |
| AI 分析 | ✅ | 需要配置 API Key |
| 离线存储 | ⚠️ | 需额外配置 |
| 推送通知 | ❌ | 未实现 |

## 🔄 更新流程

当 Web 代码更新后:

1. `npm run build` - 重新构建 Web 应用
2. `npm run sync:android` - 同步到 Android 项目
3. 在 Android Studio 中重新构建 APK
