# 腾讯云域名绑定 Vercel 指南

## 步骤 1：Vercel 添加域名

1. 访问 https://vercel.com/dashboard
2. 进入 `inspobox` 项目
3. 点击 **Settings** → **Domains**
4. 输入你的腾讯云域名（如 `inspobox.yourdomain.com`）
5. 点击 **Add**
6. 记录 Vercel 给出的 DNS 配置信息：
   - 类型：`CNAME`
   - 名称：`inspobox`（子域名）或 `@`（根域名）
   - 值：`cname.vercel-dns.com` 或类似值

## 步骤 2：腾讯云 DNS 配置

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com)
2. 进入 **云解析 DNS** → 你的域名
3. 点击 **添加记录**：

### 选项 A：使用子域名（推荐）
```
主机记录：inspobox
记录类型：CNAME
记录值：cname.vercel-dns.com
TTL：600
```

### 选项 B：使用根域名
```
主机记录：@
记录类型：A
记录值：76.76.21.21（Vercel 的 IP，具体看 Vercel 给的信息）
```

或者 CNAME 到 `cname.vercel-dns.com`（如果域名支持 CNAME Flattening）

## 步骤 3：等待生效

- DNS 传播通常需要 **几分钟到几小时**
- 可以用以下命令检查：
```bash
nslookup inspobox.yourdomain.com
```

## 步骤 4：配置 Supabase

在 Supabase Dashboard → Authentication → URL Configuration：

- **Site URL**: `https://inspobox.yourdomain.com`
- **Redirect URLs**: `https://inspobox.yourdomain.com/**`

## 步骤 5：重新部署（如果需要）

```bash
npx vercel --prod
```

## 完成！

访问你的域名：
- `https://inspobox.yourdomain.com`

## 常见问题

### 1. SSL 证书
Vercel 会自动为你的域名申请 Let's Encrypt SSL 证书，无需手动配置。

### 2. 国内加速
如果国内访问还是慢，可以：
- 开启腾讯云 CDN 加速
- 或者将 DNS 解析到 Vercel 的 Edge Network：
```
记录类型：CNAME
记录值：cname-china.vercel-dns.com（如果 Vercel 提供）
```

### 3. 绑定后 404
- 检查 Vercel 是否显示域名 "Invalid Configuration"
- 确保 DNS 记录正确
- 等待 DNS 传播完成（最长 24 小时）

### 4. 想绑定主域名而不是子域名
如果想用 `yourdomain.com` 而不是 `inspobox.yourdomain.com`：
1. 在 Vercel 添加 `yourdomain.com`
2. 腾讯云 DNS 添加 A 记录指向 Vercel 提供的 IP
3. 或者添加 CNAME 到 `cname.vercel-dns.com`（如果支持）
