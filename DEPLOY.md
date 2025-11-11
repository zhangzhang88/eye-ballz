# 🚀 Cloudflare Tunnel 部署指南

## 📋 前置要求

- ✅ Cloudflare 账户
- ✅ 域名 `ztr8.uk` (已在 Cloudflare 管理)
- ✅ macOS 系统
- ✅ 已安装 Node.js 和 pnpm

## 🔧 第一步: 安装 cloudflared

```bash
# 安装 cloudflared
brew install cloudflare/cloudflare/cloudflared

# 验证安装
cloudflared --version
```

## 🔐 第二步: 登录 Cloudflare

```bash
cloudflared tunnel login
```

浏览器会自动打开,选择域名 **ztr8.uk** 并授权。

## 🛠️ 第三步: 创建隧道

```bash
# 创建名为 eyeballz 的隧道
cloudflared tunnel create eyeballz
```

**重要**: 记下返回的 Tunnel ID,例如:
```
Created tunnel eyeballz with id: abc123-def456-789ghi-...
```

## 📝 第四步: 配置隧道

1. 复制模板配置文件:
```bash
cp cloudflare-tunnel-config.yml ~/.cloudflared/config.yml
```

2. 编辑配置文件:
```bash
nano ~/.cloudflared/config.yml
```

3. 替换以下内容:
   - 将 `<TUNNEL_ID>` 替换为第三步获得的 Tunnel ID
   - 将 `<YOUR_USERNAME>` 替换为 `world`

最终配置应该类似:
```yaml
tunnel: abc123-def456-789ghi
credentials-file: /Users/world/.cloudflared/abc123-def456-789ghi.json

ingress:
  - hostname: eye.ztr8.uk
    service: http://localhost:3000
  - service: http_status:404
```

## 🌐 第五步: 配置 DNS

```bash
# 添加 DNS 记录
cloudflared tunnel route dns eyeballz eye.ztr8.uk
```

这会在 Cloudflare DNS 中自动创建 CNAME 记录。

## 🚀 第六步: 启动服务

打开 **3个终端窗口**:

### 终端 1: 上传服务器
```bash
cd /Users/world/Downloads/code/ezshine/eye-ballz
pnpm run upload
```

### 终端 2: 预览服务器
```bash
cd /Users/world/Downloads/code/ezshine/eye-ballz
pnpm run preview
```

### 终端 3: Cloudflare Tunnel
```bash
cloudflared tunnel run eyeballz
```

## ✅ 第七步: 测试

1. 访问: https://eye.ztr8.uk
2. 上传照片
3. 点击"开始生成"
4. 等待完成后自动跳转到预览页面

## 📱 分享给用户

现在可以将链接分享给任何人:
```
https://eye.ztr8.uk
```

他们不需要任何特殊配置,直接访问即可!

## 🛑 停止服务

按 `Ctrl + C` 在每个终端窗口中停止服务:
1. 停止 Cloudflare Tunnel (终端 3)
2. 停止预览服务器 (终端 2)
3. 停止上传服务器 (终端 1)

## 🔄 重新启动

下次使用时,只需重复第六步即可!

## 📊 管理隧道

### 查看所有隧道
```bash
cloudflared tunnel list
```

### 查看隧道信息
```bash
cloudflared tunnel info eyeballz
```

### 删除隧道(如果需要)
```bash
cloudflared tunnel delete eyeballz
```

## 🐛 故障排除

### 问题 1: 无法访问 eye.ztr8.uk
- 检查 3 个服务是否都在运行
- 检查 DNS 是否生效 (可能需要几分钟)
- 运行 `cloudflared tunnel info eyeballz` 查看状态

### 问题 2: 生成图片后看不到
- 检查 `outputs/` 目录是否有生成的文件
- 检查 `photos.ts` 是否已更新
- 强制刷新浏览器 (Cmd+Shift+R)

### 问题 3: Cloudflare Tunnel 连接失败
- 检查配置文件路径和内容
- 确认 Tunnel ID 正确
- 尝试重新登录: `cloudflared tunnel login`

## 💡 提示

1. **保持电脑运行**: Cloudflare Tunnel 需要你的电脑保持运行和联网
2. **HTTPS 自动启用**: Cloudflare 自动提供 HTTPS,无需配置
3. **多项目支持**: 可以创建多个隧道,互不干扰
4. **永久 URL**: 配置一次后 URL 永久不变

## 🎯 下一步

- 可以在 Cloudflare Dashboard 查看流量统计
- 可以设置访问控制(需要登录)
- 可以启用 WAF 防护

---

**完成!** 🎉 现在你的 Eye Ballz 项目已经可以通过 https://eye.ztr8.uk 访问了!
