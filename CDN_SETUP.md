# 腾讯云 CDN 加速配置

## 步骤 1：开启腾讯云 CDN

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/cdn)
2. 点击 **域名管理** → **添加域名**

## 步骤 2：配置 CDN

### 基本配置
```
域名：inspobox.quizcraft.site
加速类型：静态加速
源站类型：自有源
源站地址：cname.vercel-dns.com 或 Vercel 给你的域名
回源协议：HTTPS
```

### HTTPS 配置
1. 开启 HTTPS 加速
2. 证书来源：腾讯云托管证书（自动申请）

## 步骤 3：修改 DNS

在 [腾讯云云解析](https://console.cloud.tencent.com/cns) 修改记录：

```
主机记录：inspobox
记录类型：CNAME
记录值：cdn.qcloud.com 给你的 CNAME 地址
TTL：600
```

## 步骤 4：等待生效

CDN 部署通常需要 5-10 分钟。

---

## 方案 2：部署到 Netlify（国内访问更快）

```bash
npm install -g netlify-cli
netlify login
netlify deploy --build --prod
```

## 方案 3：部署到 Cloudflare Pages

1. 登录 https://dash.cloudflare.com
2. Pages → Create a project
3. 导入 GitHub 仓库或手动上传
